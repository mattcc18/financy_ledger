from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from sqlalchemy import text
from typing import List, Dict, Optional
import csv
import io
from datetime import datetime
from app.db.database import engine
from app.models.schemas import TransactionCreateRequest

router = APIRouter(prefix="/api/csv-import", tags=["csv-import"])


def detect_csv_format(headers: List[str]) -> str:
    """Detect which CSV format we're dealing with"""
    headers_lower = [h.lower().strip() for h in headers]
    
    if 'type' in headers_lower and 'product' in headers_lower:
        return 'revolut_statement'
    elif 'merchandiser' in headers_lower or ('merchant' in headers_lower and 'date' in headers_lower):
        return 'revolut_expense'
    elif 'date' in headers_lower and 'total_amt' in headers_lower:
        return 'monzo'
    else:
        return 'unknown'


def check_learned_pattern(pattern_type: str, pattern_value: str) -> Optional[Dict]:
    """Check if we have a learned pattern for this"""
    try:
        with engine.connect() as conn:
            # Check if table exists first
            check_table = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'import_patterns'
                )
            """)
            table_exists = conn.execute(check_table).scalar()
            
            if not table_exists:
                return None
            
            query = text("""
                SELECT matched_account_id, matched_category, matched_transaction_type, confidence_score
                FROM import_patterns
                WHERE pattern_type = :pattern_type 
                AND LOWER(pattern_value) = LOWER(:pattern_value)
                ORDER BY usage_count DESC, confidence_score DESC
                LIMIT 1
            """)
            result = conn.execute(query, {
                'pattern_type': pattern_type,
                'pattern_value': pattern_value
            }).fetchone()
            
            if result:
                return {
                    'account_id': result[0],
                    'category': result[1],
                    'value': result[2],  # transaction_type
                    'confidence': float(result[3])
                }
    except Exception as e:
        # Silently fail if table doesn't exist - it's optional
        pass
    return None


def save_learned_pattern(pattern_type: str, pattern_value: str, account_id: Optional[int], 
                        category: Optional[str], transaction_type: Optional[str], confidence: float):
    """Save a learned pattern for future use"""
    try:
        with engine.connect() as conn:
            # Check if table exists first
            check_table = text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'import_patterns'
                )
            """)
            table_exists = conn.execute(check_table).scalar()
            
            if not table_exists:
                return  # Silently skip if table doesn't exist
            
            # Check if pattern exists
            check_query = text("""
                SELECT pattern_id, usage_count FROM import_patterns
                WHERE pattern_type = :pattern_type AND LOWER(pattern_value) = LOWER(:pattern_value)
            """)
            existing = conn.execute(check_query, {
                'pattern_type': pattern_type,
                'pattern_value': pattern_value
            }).fetchone()
            
            if existing:
                # Update existing pattern
                update_query = text("""
                    UPDATE import_patterns
                    SET usage_count = usage_count + 1,
                        matched_account_id = COALESCE(:account_id, matched_account_id),
                        matched_category = COALESCE(:category, matched_category),
                        matched_transaction_type = COALESCE(:transaction_type, matched_transaction_type),
                        confidence_score = GREATEST(confidence_score, :confidence),
                        last_used = CURRENT_TIMESTAMP
                    WHERE pattern_id = :pattern_id
                """)
                conn.execute(update_query, {
                    'pattern_id': existing[0],
                    'account_id': account_id,
                    'category': category,
                    'transaction_type': transaction_type,
                    'confidence': confidence
                })
            else:
                # Insert new pattern
                insert_query = text("""
                    INSERT INTO import_patterns 
                    (pattern_type, pattern_value, matched_account_id, matched_category, 
                     matched_transaction_type, confidence_score)
                    VALUES (:pattern_type, :pattern_value, :account_id, :category, 
                            :transaction_type, :confidence)
                """)
                conn.execute(insert_query, {
                    'pattern_type': pattern_type,
                    'pattern_value': pattern_value,
                    'account_id': account_id,
                    'category': category,
                    'transaction_type': transaction_type,
                    'confidence': confidence
                })
            conn.commit()
    except Exception as e:
        # Silently fail if table doesn't exist - it's optional
        pass


def classify_transaction_type(tx_type: str, description: str, amount: float) -> str:
    """Classify transaction as income, expense, or transfer"""
    tx_type_lower = tx_type.lower()
    desc_lower = description.lower()
    
    # Check learned patterns first
    learned_type = check_learned_pattern('transaction_type', description)
    if learned_type and learned_type.get('confidence', 0) > 0.7:
        return learned_type['value']
    
    # Pattern matching
    if tx_type_lower in ['topup', 'rev payment'] or 'payment from' in desc_lower:
        return 'income'
    elif tx_type_lower == 'transfer':
        if 'to ' in desc_lower or 'transfer to' in desc_lower:
            return 'transfer'
        elif 'from ' in desc_lower or 'transfer from' in desc_lower:
            return 'income'  # Money coming in
        else:
            return 'transfer'
    elif tx_type_lower in ['card payment', 'exchange']:
        return 'expense' if amount < 0 else 'income'
    else:
        # Default based on amount
        return 'expense' if amount < 0 else 'income'


def match_account_name_in_description(description: str, accounts: List[Dict]) -> Optional[int]:
    """Try to match account name from description (for transfers)"""
    if not description or not accounts:
        return None
    
    desc_lower = description.lower()
    
    # Common patterns: "To X", "From X", "Transfer to X", "Transfer from X"
    patterns = [
        ('to ', 'after'),
        ('from ', 'before'),
        ('transfer to ', 'after'),
        ('transfer from ', 'after'),
    ]
    
    for pattern, position in patterns:
        if pattern in desc_lower:
            # Extract the account name part
            parts = desc_lower.split(pattern, 1)
            if len(parts) > 1 and parts[1]:
                # Get the part after the pattern
                after_pattern = parts[1].strip()
                if not after_pattern:
                    continue
                
                # Split by comma and take first part, then split by space and take first 3 words
                account_name_parts = after_pattern.split(',')[0].strip()
                if account_name_parts:
                    words = account_name_parts.split(' ')
                    account_name_part = words[0:min(3, len(words))]  # Take first few words, max 3
                    account_name_candidate = ' '.join(account_name_part).strip()
                    
                    if account_name_candidate:
                        # Try to match against account names (fuzzy matching)
                        for account in accounts:
                            account_name_lower = account['account_name'].lower()
                            # Check if any part of the account name matches
                            candidate_words = [w for w in account_name_candidate.split() if len(w) > 2]
                            if candidate_words and any(word in account_name_lower for word in candidate_words):
                                return account['account_id']
                            # Also check if account name contains the candidate
                            if account_name_candidate in account_name_lower or account_name_lower in account_name_candidate:
                                return account['account_id']
    
    return None


def match_account(description: str, currency: str, accounts: List[Dict], default_account_id: Optional[int] = None) -> Dict:
    """Match transaction to an account"""
    # Check learned patterns
    learned_account = check_learned_pattern('account_match', description)
    if learned_account and learned_account.get('confidence', 0) > 0.7:
        return {
            'account_id': learned_account['account_id'],
            'confidence': learned_account['confidence']
        }
    
    # Pattern matching
    desc_lower = description.lower()
    
    # For transfers, try to match the other account from description
    if 'transfer' in desc_lower or 'to ' in desc_lower or 'from ' in desc_lower:
        matched_account_id = match_account_name_in_description(description, accounts)
        if matched_account_id:
            return {
                'account_id': matched_account_id,
                'confidence': 0.8
            }
    
    # Match by currency first
    matching_accounts = [a for a in accounts if a['currency_code'] == currency]
    
    # Try to match by description keywords
    for account in matching_accounts:
        account_name_lower = account['account_name'].lower()
        institution_lower = account['institution'].lower()
        
        # Check if account name or institution appears in description
        if account_name_lower in desc_lower or institution_lower in desc_lower:
            return {
                'account_id': account['account_id'],
                'confidence': 0.9
            }
    
    # Use default account if provided (the account the CSV is from)
    if default_account_id:
        # Verify it matches currency
        default_account = next((a for a in accounts if a['account_id'] == default_account_id), None)
        if default_account and default_account['currency_code'] == currency:
            return {
                'account_id': default_account_id,
                'confidence': 0.9  # High confidence since user selected it
            }
    
    # Default to first matching currency account
    if matching_accounts:
        return {
            'account_id': matching_accounts[0]['account_id'],
            'confidence': 0.5  # Low confidence, needs review
        }
    
    # No match found
    return {
        'account_id': default_account_id,  # Fallback to selected account
        'confidence': 0.3  # Very low confidence
    }


def classify_category(description: str, transaction_type: str) -> Optional[str]:
    """Classify transaction category"""
    if transaction_type == 'transfer':
        return 'Transfer'
    
    # Check learned patterns
    learned_category = check_learned_pattern('category', description)
    if learned_category and learned_category.get('confidence', 0) > 0.7:
        return learned_category['value']
    
    # Pattern matching
    desc_lower = description.lower()
    
    category_keywords = {
        'Groceries': ['tesco', 'lidl', 'aldi', 'dunnes', 'supermarket', 'groceries', 'boots', 'costcutter'],
        'Restaurants': ['restaurant', 'cafe', 'mcdonald', 'burger king', 'pizza', 'food', 'wetherspoon', 'fratelli'],
        'Transport': ['uber', 'bolt', 'free now', 'trainline', 'stagecoach', 'transport', 'taxi', 'dsb', 'rhônexpress'],
        'Shopping': ['amazon', 'temu', 'shopping', 'store', 'tenpin'],
        'Travel': ['ryanair', 'hotel', 'airbnb', 'travel', 'flight', 'expedia'],
        'Entertainment': ['movies', 'cinema', 'entertainment', 'patreon'],
        'Bills': ['giffgaff', 'phone', 'bill'],
        'Fitness': ['fitness', 'gym', 'badminton', 'anytime fitness'],
        'Education': ['education', 'italki'],
        'General': ['general', 'register office'],
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in desc_lower for keyword in keywords):
            return category
    
    return 'Other'


def extract_merchant(description: str, transaction_type: str) -> Optional[str]:
    """Extract merchant name from description"""
    if not description:
        return None
    
    if transaction_type == 'transfer':
        # For transfers, merchant is the other account/person
        desc_lower = description.lower()
        if 'to ' in desc_lower:
            # Case-insensitive split
            parts = description.split('to ', 1) if 'to ' in description else description.split('To ', 1)
            if len(parts) > 1 and parts[1]:
                merchant = parts[1].split(',')[0].strip()
                return merchant if merchant else None
        elif 'from ' in desc_lower:
            # Case-insensitive split
            parts = description.split('from ', 1) if 'from ' in description else description.split('From ', 1)
            if len(parts) > 1 and parts[1]:
                merchant = parts[1].split(',')[0].strip()
                return merchant if merchant else None
        return None
    
    # For expenses, merchant is usually the first part of description
    # Remove common prefixes
    desc = description
    prefixes = ['Card Payment', 'Payment', 'Rev Payment']
    for prefix in prefixes:
        if desc.startswith(prefix):
            desc = desc[len(prefix):].strip()
    
    # Take first part before comma or dash
    if desc:
        merchant = desc.split(',')[0].split('-')[0].strip()
        return merchant if merchant else None
    
    return None


def parse_revolut_statement(row: Dict, accounts: List[Dict], default_account_id: Optional[int] = None) -> Optional[Dict]:
    """Parse Revolut statement format"""
    try:
        # Extract data
        tx_type = row.get('Type', '').strip()
        description = row.get('Description', '').strip()
        amount_str = row.get('Amount', '0').replace(',', '').strip()
        currency = row.get('Currency', 'EUR').strip()
        started_date = row.get('Started Date', '').strip()  # Use Started Date instead of Completed Date
        completed_date = row.get('Completed Date', '').strip()
        state = row.get('State', '').strip()
        
        # Skip REVERTED transactions
        if state == 'REVERTED':
            return None
        
        # Use Started Date if available, otherwise fallback to Completed Date
        date_str = started_date if started_date else completed_date
        if not date_str:
            return None
        
        # Parse amount
        try:
            amount = float(amount_str)
        except:
            return None
        
        # Parse date and time - handle formats: "2025-12-08 12:38:09", "2025-12-08", "01/09/2025 13:31", "01/09/2025"
        tx_date = None
        tx_time = None
        
        try:
            # Try YYYY-MM-DD HH:MM:SS format first
            try:
                dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                tx_date = dt.date()
                tx_time = dt.time().strftime('%H:%M')
            except:
                # Try YYYY-MM-DD HH:MM format
                try:
                    dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M')
                    tx_date = dt.date()
                    tx_time = dt.time().strftime('%H:%M')
                except:
                    # Try YYYY-MM-DD format (date only)
                    try:
                        tx_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    except:
                        # Try DD/MM/YYYY HH:MM format
                        try:
                            dt = datetime.strptime(date_str, '%d/%m/%Y %H:%M')
                            tx_date = dt.date()
                            tx_time = dt.time().strftime('%H:%M')
                        except:
                            # Fallback to DD/MM/YYYY format (date only)
                            tx_date = datetime.strptime(date_str, '%d/%m/%Y').date()
        except:
            return None
        
        # Determine transaction type
        transaction_type = classify_transaction_type(tx_type, description, amount)
        
        # For transfers, check if we can identify the other account
        transfer_to_account_id = None
        if transaction_type == 'transfer':
            # Check if description mentions another account
            transfer_to_account_id = match_account_name_in_description(description, accounts)
        
        # Match account - use default_account_id as the source account
        # For transfers OUT (negative), use default_account_id
        # For transfers IN (positive), try to match the "to" account
        if transaction_type == 'transfer' and amount < 0:
            # Money going out - this is from the default account
            account_match = {
                'account_id': default_account_id,
                'confidence': 0.95
            }
        elif transaction_type == 'transfer' and amount > 0:
            # Money coming in - try to match the "from" account, otherwise use default
            if transfer_to_account_id:
                account_match = {
                    'account_id': transfer_to_account_id,
                    'confidence': 0.85
                }
            else:
                account_match = match_account(description, currency, accounts, default_account_id)
        else:
            # Regular transaction - use default account
            account_match = match_account(description, currency, accounts, default_account_id)
        
        # Classify category
        category = classify_category(description, transaction_type)
        
        # Get merchant
        merchant = extract_merchant(description, transaction_type)
        
        return {
            'transaction_type': transaction_type,
            'account_id': account_match['account_id'],
            'account_confidence': account_match['confidence'],
            'amount': amount,
            'currency': currency,
            'transaction_date': tx_date.isoformat(),
            'transaction_time': tx_time,  # HH:MM format or None if not available
            'description': description,
            'merchant': merchant,
            'category': category,
            'transfer_to_account_id': transfer_to_account_id,  # For creating linked transfers
            'confidence': min(account_match['confidence'], 0.8),  # Overall confidence
            'raw_data': row
        }
    except Exception as e:
        import traceback
        print(f"Error parsing revolut statement row: {e}")
        print(f"Row data: {row}")
        print(f"Traceback: {traceback.format_exc()}")
        return None


def match_trip(trip_name: str) -> Optional[int]:
    """Match trip name to trip_id"""
    if not trip_name:
        return None
    
    try:
        with engine.connect() as conn:
            query = text("""
                SELECT trip_id FROM trips.list
                WHERE LOWER(trip_name) = LOWER(:trip_name)
                LIMIT 1
            """)
            result = conn.execute(query, {'trip_name': trip_name}).fetchone()
            if result:
                return result[0]
    except Exception as e:
        print(f"Error matching trip: {e}")
    return None


def parse_revolut_expense(row: Dict, accounts: List[Dict], default_account_id: Optional[int] = None) -> Optional[Dict]:
    """Parse Revolut expense format (with merchandiser column)"""
    try:
        date_str = row.get('date', '').strip()
        amount_str = row.get('total_amt', row.get('amount', '0')).replace(',', '').strip()
        merchant = row.get('merchandiser', row.get('merchant', '')).strip()
        currency = row.get('currency', 'EUR').strip()
        category = row.get('expense_category', row.get('category', '')).strip()
        trip_name = row.get('Trip', row.get('trip', '')).strip()
        
        # Parse amount
        try:
            amount = float(amount_str)
        except:
            return None
        
        # Parse date and time
        tx_date = None
        tx_time = None
        
        try:
            # Try DD/MM/YYYY HH:MM format first
            try:
                dt = datetime.strptime(date_str, '%d/%m/%Y %H:%M')
                tx_date = dt.date()
                tx_time = dt.time().strftime('%H:%M')
            except:
                # Fallback to DD/MM/YYYY format (date only)
                try:
                    tx_date = datetime.strptime(date_str, '%d/%m/%Y').date()
                except:
                    return None
        except:
            return None
        
        # Determine transaction type (expense format is usually expenses)
        transaction_type = 'expense' if amount < 0 else 'income'
        
        # Match account
        account_match = match_account(merchant, currency, accounts, default_account_id)
        
        # Use provided category or classify
        if not category:
            category = classify_category(merchant, transaction_type)
        
        # Match trip
        trip_id = match_trip(trip_name) if trip_name else None
        
        return {
            'transaction_type': transaction_type,
            'account_id': account_match['account_id'],
            'account_confidence': account_match['confidence'],
            'amount': amount,
            'currency': currency,
            'transaction_date': tx_date.isoformat(),
            'transaction_time': tx_time,  # HH:MM format or None
            'description': merchant,
            'merchant': merchant,
            'category': category,
            'trip_id': trip_id,
            'trip_name': trip_name if trip_name else None,
            'confidence': min(account_match['confidence'], 0.8),
            'raw_data': row
        }
    except Exception as e:
        print(f"Error parsing revolut expense row: {e}")
        return None


def parse_monzo(row: Dict, accounts: List[Dict], default_account_id: Optional[int] = None) -> Optional[Dict]:
    """Parse Monzo format (similar to revolut expense)"""
    return parse_revolut_expense(row, accounts, default_account_id)


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    account_id: Optional[int] = Query(None, description="Account ID that this CSV is from")
):
    """Upload and parse CSV file"""
    try:
        # Read CSV content
        content = await file.read()
        csv_content = io.StringIO(content.decode('utf-8'))
        reader = csv.DictReader(csv_content)
        
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV file is empty or invalid")
        
        # Detect format
        format_type = detect_csv_format(reader.fieldnames)
        if format_type == 'unknown':
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown CSV format. Headers: {', '.join(reader.fieldnames)}"
            )
        
        # Get all accounts
        with engine.connect() as conn:
            accounts_query = text("SELECT account_id, account_name, institution, currency_code FROM accounts.list")
            accounts_result = conn.execute(accounts_query)
            accounts = [
                {
                    'account_id': row[0],
                    'account_name': row[1],
                    'institution': row[2],
                    'currency_code': row[3]
                }
                for row in accounts_result
            ]
        
        # Validate account_id if provided
        default_account = None
        if account_id:
            default_account = next((a for a in accounts if a['account_id'] == account_id), None)
            if not default_account:
                raise HTTPException(status_code=400, detail=f"Account ID {account_id} not found")
        
        transactions = []
        uncertain = []
        errors = []
        
        # Parse each row
        for idx, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            parsed = None
            try:
                if format_type == 'revolut_statement':
                    parsed = parse_revolut_statement(row, accounts, account_id)
                elif format_type == 'revolut_expense':
                    parsed = parse_revolut_expense(row, accounts, account_id)
                elif format_type == 'monzo':
                    parsed = parse_monzo(row, accounts, account_id)
                
                if parsed:
                    # Always assign row_number for tracking
                    parsed['row_number'] = idx
                    
                    # For transfers, mark as uncertain if we couldn't identify the other account
                    if parsed['transaction_type'] == 'transfer' and not parsed.get('transfer_to_account_id') and parsed['account_confidence'] < 0.8:
                        uncertain.append(parsed)
                    elif parsed['confidence'] < 0.7 or parsed['account_confidence'] < 0.7 or parsed['account_id'] is None:
                        uncertain.append(parsed)
                    else:
                        transactions.append(parsed)
                else:
                    errors.append(f"Row {idx}: Failed to parse")
            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")
        
        return {
            'transactions': transactions,
            'uncertain': uncertain,
            'errors': errors,
            'total_parsed': len(transactions) + len(uncertain),
            'format_detected': format_type,
            'default_account_id': account_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")


@router.post("/confirm")
async def confirm_transactions(transactions: List[Dict]):
    """Confirm and import transactions, saving patterns"""
    try:
        with engine.connect() as conn:
            imported_count = 0
            transfer_pairs_created = 0
            
            for tx in transactions:
                # Validate required fields
                if not tx.get('account_id') or not tx.get('transaction_date'):
                    continue
                
                # Handle transfers with transfer_to_account_id - create linked pair
                if tx.get('transaction_type') == 'transfer' and tx.get('transfer_to_account_id'):
                    transfer_to_account_id = tx['transfer_to_account_id']
                    amount = abs(float(tx['amount']))
                    
                    # Determine which account is "from" and which is "to"
                    if float(tx['amount']) < 0:
                        # Negative amount = money going out from this account
                        from_account_id = tx['account_id']
                        to_account_id = transfer_to_account_id
                    else:
                        # Positive amount = money coming in to this account
                        from_account_id = transfer_to_account_id
                        to_account_id = tx['account_id']
                    
                    # Get account names
                    account_names_query = text("""
                        SELECT account_id, account_name FROM accounts.list 
                        WHERE account_id IN (:from_account_id, :to_account_id)
                    """)
                    account_names_result = conn.execute(account_names_query, {
                        "from_account_id": from_account_id,
                        "to_account_id": to_account_id
                    }).fetchall()
                    account_names = {row[0]: row[1] for row in account_names_result}
                    from_account_name = account_names.get(from_account_id, "Unknown Account")
                    to_account_name = account_names.get(to_account_id, "Unknown Account")
                    
                    # Get transfer_link_id
                    get_link_id = text("SELECT nextval('transactions.transfer_link_seq')")
                    link_id_result = conn.execute(get_link_id)
                    transfer_link_id = link_id_result.scalar()
                    
                    description = tx.get('description') or f"Transfer between accounts"
                    
                    # Insert negative transaction (from account)
                    insert_from = text("""
                        INSERT INTO transactions.ledger 
                        (account_id, amount, transaction_type, category, transaction_date, 
                         transfer_link_id, description, merchant)
                        VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, 
                                :transfer_link_id, :description, :merchant)
                    """)
                    conn.execute(insert_from, {
                        'account_id': from_account_id,
                        'amount': -amount,
                        'transaction_date': tx['transaction_date'],
                        'transfer_link_id': transfer_link_id,
                        'description': f"{description} (from {from_account_name} to {to_account_name})",
                        'merchant': to_account_name
                    })
                    
                    # Insert positive transaction (to account)
                    insert_to = text("""
                        INSERT INTO transactions.ledger 
                        (account_id, amount, transaction_type, category, transaction_date, 
                         transfer_link_id, description, merchant)
                        VALUES (:account_id, :amount, 'transfer', 'Transfer', :transaction_date, 
                                :transfer_link_id, :description, :merchant)
                    """)
                    conn.execute(insert_to, {
                        'account_id': to_account_id,
                        'amount': amount,
                        'transaction_date': tx['transaction_date'],
                        'transfer_link_id': transfer_link_id,
                        'description': f"{description} (from {from_account_name} to {to_account_name})",
                        'merchant': from_account_name
                    })
                    
                    imported_count += 2
                    transfer_pairs_created += 1
                else:
                    # Regular transaction (or transfer without transfer_to_account_id)
                    create_query = text("""
                        INSERT INTO transactions.ledger 
                        (account_id, amount, transaction_type, category, transaction_date, 
                         description, merchant, trip_id)
                        VALUES (:account_id, :amount, :transaction_type, :category, 
                                :transaction_date, :description, :merchant, :trip_id)
                    """)
                    conn.execute(create_query, {
                        'account_id': tx['account_id'],
                        'amount': tx['amount'],
                        'transaction_type': tx['transaction_type'],
                        'category': tx.get('category'),
                        'transaction_date': tx['transaction_date'],
                        'description': tx.get('description'),
                        'merchant': tx.get('merchant'),
                        'trip_id': tx.get('trip_id')
                    })
                    imported_count += 1
                
                # Save learned patterns
                description = tx.get('description') or tx.get('merchant') or ''
                if description:
                    save_learned_pattern(
                        'merchant',
                        description,
                        tx['account_id'],
                        tx.get('category'),
                        tx['transaction_type'],
                        0.9  # High confidence for user-confirmed
                    )
            
            conn.commit()
        
        message = f"Successfully imported {imported_count} transactions"
        if transfer_pairs_created > 0:
            message += f" ({transfer_pairs_created} transfer pairs)"
        
        return {"message": message, "imported": imported_count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importing transactions: {str(e)}")

