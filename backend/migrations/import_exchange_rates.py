import csv
import sys
from datetime import datetime, timedelta

# Get user_id from command line argument
if len(sys.argv) < 2:
    print("Usage: python3 import_exchange_rates.py <user_id>")
    print("Example: python3 import_exchange_rates.py '123e4567-e89b-12d3-a456-426614174000'")
    sys.exit(1)

user_id = sys.argv[1]

# Read CSV and extract data
rates_data = []
with open('../../expenses/Eur Exchaneg rates.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)
    
    # Find header row - it's around line 44
    # Header format: ,,USD,JPY,BGN,CZK,DKK,EEK,ILS,GBP,HUF,LTL,LVL,PLN,RON,SEK,SKK,CHF,...
    # Count: 0=empty, 1=empty, 2=USD, 3=JPY, 4=BGN, 5=CZK, 6=DKK, 7=EEK, 8=ILS, 9=GBP, 10=HUF, 11=LTL, 12=LVL, 13=PLN, 14=RON, 15=SEK, 16=SKK, 17=CHF
    usd_idx = 2
    gbp_idx = 9  # Fixed: GBP is at index 9, not 8
    chf_idx = 17  # Fixed: CHF is at index 17, not 16
    
    # Parse dates from Sep 2025 onwards
    for row in rows[44:]:
        if len(row) < max(usd_idx, gbp_idx, chf_idx) + 1:
            continue
            
        date_str = row[1].strip() if len(row) > 1 else ''
        if not date_str:
            continue
            
        # Check if we've passed Dec 2025
        if 'Jan 26' in date_str or 'Feb 26' in date_str:
            break
            
        # Only process Sep 2025 onwards
        if 'Sep 25' not in date_str and 'Oct 25' not in date_str and 'Nov 25' not in date_str and 'Dec 25' not in date_str:
            continue
            
        try:
            # Parse date like '1 Sep 25' -> 2025-09-01
            # Format: day month year (e.g., "1 Sep 25" = September 1, 2025)
            parts = date_str.split()
            if len(parts) >= 3:
                day = int(parts[0])
                month_str = parts[1]
                year_str = parts[2]
                
                # Handle year (could be "25" meaning 2025)
                if len(year_str) == 2:
                    year = 2000 + int(year_str)
                else:
                    year = int(year_str)
                
                month_map = {'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12}
                month = month_map.get(month_str)
                
                if month and year == 2025:
                    date_obj = datetime(year, month, day)
                    
                    # Get rates - skip if empty or N/A
                    usd_rate_str = row[usd_idx].strip() if len(row) > usd_idx else ''
                    gbp_rate_str = row[gbp_idx].strip() if len(row) > gbp_idx else ''
                    chf_rate_str = row[chf_idx].strip() if len(row) > chf_idx else ''
                    
                    # Check if all rates are valid
                    if (usd_rate_str and gbp_rate_str and chf_rate_str and 
                        usd_rate_str != 'N/A' and gbp_rate_str != 'N/A' and chf_rate_str != 'N/A' and
                        usd_rate_str != '' and gbp_rate_str != '' and chf_rate_str != ''):
                        try:
                            rates_data.append({
                                'date': date_obj,
                                'usd': float(usd_rate_str),
                                'gbp': float(gbp_rate_str),
                                'chf': float(chf_rate_str)
                            })
                        except ValueError:
                            continue
        except (ValueError, IndexError) as e:
            continue

# Sort by date
rates_data.sort(key=lambda x: x['date'])

if not rates_data:
    print("No rates data found!")
    exit(1)

# Create a dictionary of rates by date for quick lookup
rates_by_date = {entry['date']: entry for entry in rates_data}

# Get date range
start_date = rates_data[0]['date']
end_date = rates_data[-1]['date']

# Generate SQL with weekend handling
sql_lines = [f'-- Exchange rates from September 2025 to latest (CHF, GBP, USD only)']
sql_lines.append(f'-- Weekend dates use the previous Friday rate')
sql_lines.append(f'-- User ID: {user_id}')
sql_lines.append('')
sql_lines.append(f'-- Delete existing rates for this user and date range first')
sql_lines.append(f"DELETE FROM exchange_rates.rate_history")
sql_lines.append(f"WHERE user_id = '{user_id}'")
sql_lines.append(f"  AND rate_date >= '{start_date.strftime('%Y-%m-%d')}'")
sql_lines.append(f"  AND rate_date <= '{end_date.strftime('%Y-%m-%d')}'")
sql_lines.append(f"  AND base_currency = 'EUR'")
sql_lines.append(f"  AND target_currency IN ('USD', 'GBP', 'CHF');")
sql_lines.append('')
sql_lines.append('-- Insert new rates')
sql_lines.append('INSERT INTO exchange_rates.rate_history (base_currency, target_currency, rate, rate_date, user_id)')
sql_lines.append('VALUES')

values = []
last_friday_rates = {'usd': None, 'gbp': None, 'chf': None}

# Generate all dates from start to end
current_date = start_date
while current_date <= end_date:
    weekday = current_date.weekday()  # 0=Monday, 6=Sunday
    date_str = current_date.strftime('%Y-%m-%d')
    
    # Check if we have data for this date
    if current_date in rates_by_date:
        # Use the actual rate from CSV
        rate_entry = rates_by_date[current_date]
        usd_rate = rate_entry['usd']
        gbp_rate = rate_entry['gbp']
        chf_rate = rate_entry['chf']
        
        # Update last Friday rates if it's a weekday
        if weekday < 5:  # Monday-Friday
            last_friday_rates = {
                'usd': usd_rate,
                'gbp': gbp_rate,
                'chf': chf_rate
            }
    else:
        # Date not in CSV - must be a weekend
        if weekday >= 5:  # Saturday or Sunday
            if last_friday_rates['usd'] is not None:
                # Use last Friday's rates
                usd_rate = last_friday_rates['usd']
                gbp_rate = last_friday_rates['gbp']
                chf_rate = last_friday_rates['chf']
            else:
                # No Friday rate yet, skip this date
                current_date += timedelta(days=1)
                continue
        else:
            # Weekday not in CSV - skip (shouldn't happen, but just in case)
            current_date += timedelta(days=1)
            continue
    
    # Add rates for this date
    values.append(f"    ('EUR', 'USD', {usd_rate}, '{date_str}', '{user_id}')")
    values.append(f"    ('EUR', 'GBP', {gbp_rate}, '{date_str}', '{user_id}')")
    values.append(f"    ('EUR', 'CHF', {chf_rate}, '{date_str}', '{user_id}')")
    
    # Move to next day
    current_date += timedelta(days=1)

# Join values with commas
sql_lines.append(',\n'.join(values))
sql_lines.append(';')

sql_content = '\n'.join(sql_lines)

# Write to file
with open('import_exchange_rates_sep2025.sql', 'w') as f:
    f.write(sql_content)

num_dates = len(values) // 3  # 3 rates per date (USD, GBP, CHF)
print(f'Generated SQL file with {num_dates} date entries')
print(f'Total INSERT statements: {len(values)}')
print(f'File saved to: import_exchange_rates_sep2025.sql')

