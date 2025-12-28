import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { CloudUpload, CheckCircle, Warning, Edit, Delete, Save, Cancel } from '@mui/icons-material';
import { api, Account, Trip, Category } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';
import { useNavigate } from 'react-router-dom';
import { ErrorDisplay, TransactionTable, ParsedTransaction } from '../components/csv-import';

const CSVImport: React.FC = () => {
  const navigate = useNavigate();
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);
  
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{
    transactions: ParsedTransaction[];
    uncertain: ParsedTransaction[];
    errors: string[];
    format_detected: string;
    default_account_id?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // All transactions are in edit mode by default - no need for editingRowId

  useEffect(() => {
    loadAccountsAndTrips();
  }, []);

  const loadAccountsAndTrips = async () => {
    try {
      const [accountsData, tripsData, categoriesData] = await Promise.all([
        api.getAccounts(),
        api.getTrips(),
        api.getAllCategories(),
      ]);
      setAccounts(accountsData);
      setTrips(tripsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading accounts/trips/categories:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setParsed(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!selectedAccountId) {
      alert('Please select an account first');
      return;
    }
    
    setLoading(true);
    setParsed(null); // Clear previous results
    try {
      const data = await api.uploadCSV(file, selectedAccountId as number);
      setParsed(data);
      
      // Show summary alert if there are errors
      if (data.errors && data.errors.length > 0) {
        console.warn('Parsing errors:', data.errors);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload CSV';
      alert(errorMessage);
      // Set parsed to show error state
      setParsed({
        transactions: [],
        uncertain: [],
        errors: [errorMessage],
        format_detected: 'unknown',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (transactions: ParsedTransaction[]) => {
    setImporting(true);
    try {
      // Prepare transactions for import
      const transactionsToImport = transactions.map(tx => ({
        account_id: tx.account_id,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        category: tx.category,
        transaction_date: tx.transaction_date,
        description: tx.description,
        merchant: tx.merchant,
        trip_id: tx.trip_id,
      }));

      const result = await api.confirmCSVTransactions(transactionsToImport);
      alert(result.message);
      
      // Clear and reload
      setFile(null);
      setParsed(null);
      navigate('/expenses');
    } catch (err) {
      console.error('Import error:', err);
      alert(err instanceof Error ? err.message : 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  const handleEditTransaction = (tx: ParsedTransaction) => {
    setEditingTransaction({ ...tx });
    setEditDialogOpen(true);
  };

  const handleUpdateTransaction = (rowNumber: number | undefined, field: keyof ParsedTransaction, value: any) => {
    if (!parsed || rowNumber === undefined) return;
    
    // Update in confident transactions list
    const confidentIndex = parsed.transactions.findIndex(tx => tx.row_number === rowNumber);
    if (confidentIndex >= 0) {
      const updatedTransactions = [...parsed.transactions];
      updatedTransactions[confidentIndex] = {
        ...updatedTransactions[confidentIndex],
        [field]: value
      };
      setParsed({ ...parsed, transactions: updatedTransactions });
      return;
    }
    
    // Update in uncertain transactions list
    const uncertainIndex = parsed.uncertain.findIndex(tx => tx.row_number === rowNumber);
    if (uncertainIndex >= 0) {
      const updatedUncertain = [...parsed.uncertain];
      updatedUncertain[uncertainIndex] = {
        ...updatedUncertain[uncertainIndex],
        [field]: value
      };
      setParsed({ ...parsed, uncertain: updatedUncertain });
    }
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    // Update the transaction in both uncertain and transactions lists
    if (parsed) {
      // Check if it's in uncertain list (by row_number or by reference)
      const uncertainIndex = parsed.uncertain.findIndex(tx => 
        (tx.row_number && editingTransaction.row_number && tx.row_number === editingTransaction.row_number) ||
        tx === editingTransaction
      );
      
      if (uncertainIndex >= 0) {
        // Update in uncertain list
        const updatedUncertain = [...parsed.uncertain];
        updatedUncertain[uncertainIndex] = editingTransaction;
        setParsed({ ...parsed, uncertain: updatedUncertain });
      } else {
        // Check if it's in transactions list (by row_number or by reference)
        const transactionsIndex = parsed.transactions.findIndex(tx => 
          (tx.row_number && editingTransaction.row_number && tx.row_number === editingTransaction.row_number) ||
          tx === editingTransaction
        );
        
        if (transactionsIndex >= 0) {
          const updatedTransactions = [...parsed.transactions];
          updatedTransactions[transactionsIndex] = editingTransaction;
          setParsed({ ...parsed, transactions: updatedTransactions });
        }
      }
    }
    setEditDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteUncertain = (tx: ParsedTransaction) => {
    if (parsed) {
      const updatedUncertain = parsed.uncertain.filter(t => t !== tx);
      setParsed({ ...parsed, uncertain: updatedUncertain });
    }
  };

  const handleDeleteConfident = (tx: ParsedTransaction) => {
    if (parsed) {
      const updatedTransactions = parsed.transactions.filter(t => t !== tx);
      setParsed({ ...parsed, transactions: updatedTransactions });
    }
  };

  const getAccountName = (accountId: number | null): string => {
    if (!accountId) return 'Unknown';
    const account = accounts.find(a => a.account_id === accountId);
    return account ? `${account.account_name} (${account.institution})` : 'Unknown';
  };

  const getTripName = (tripId: number | null): string => {
    if (!tripId) return '-';
    const trip = trips.find(t => t.trip_id === tripId);
    return trip ? trip.trip_name : '-';
  };

  const handleAddNewCategory = async (name: string, transactionType: 'expense' | 'income') => {
    if (!name.trim()) return;
    
    try {
      const newCategory = await api.createCategory({
        category_name: name.trim(),
        category_type: transactionType,
      });
      setCategories([...categories, newCategory]);
      
      // Update the editing transaction with the new category
      if (editingTransaction) {
        setEditingTransaction({
          ...editingTransaction,
          category: newCategory.category_name,
        });
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    }
  };


  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        minHeight: '100vh',
      }}
    >
      <Container maxWidth={1280} sx={{ px: { xs: 2, sm: 3, lg: 4 } }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
          <CloudUpload sx={{ 
            color: colors.card_accent, 
            fontSize: 28,
          }} />
          <Typography
            variant="h5"
            sx={{
              background: `linear-gradient(135deg, ${colors.card_text} 0%, ${colors.card_accent} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '1.35rem', md: '1.5rem' },
              letterSpacing: '-0.01em',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            CSV Import
          </Typography>
        </Stack>

        {/* Upload Section */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${hexToRgba(colors.card_bg, 0.6)} 0%, ${hexToRgba(colors.card_subtext, 0.03)} 100%)`,
            borderRadius: 3,
            p: 3,
            mb: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
          }}
        >
          <Stack spacing={3}>
            {/* Account Selector */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: colors.card_subtext }}>Select Account (CSV Source)</InputLabel>
              <Select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value as number | '');
                  setFile(null);
                  setParsed(null);
                }}
                label="Select Account (CSV Source)"
                sx={{
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  },
                }}
              >
                {accounts.map((account) => (
                  <MenuItem key={account.account_id} value={account.account_id}>
                    {account.account_name} ({account.institution}) - {account.currency_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* File Upload */}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="csv-upload"
              disabled={!selectedAccountId}
            />
            <label htmlFor="csv-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                disabled={loading || !selectedAccountId}
                sx={{
                  backgroundColor: colors.card_accent,
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.8),
                  },
                  '&:disabled': {
                    backgroundColor: colors.card_subtext,
                  },
                }}
              >
                Select CSV File
              </Button>
            </label>
            {file && (
              <Box>
                <Typography sx={{ color: colors.card_text, mb: 1 }}>
                  Selected: {file.name}
                </Typography>
                <Button
                  onClick={handleUpload}
                  disabled={loading || !selectedAccountId}
                  variant="outlined"
                  sx={{
                    borderColor: colors.card_accent,
                    color: colors.card_accent,
                    '&:hover': {
                      borderColor: colors.card_accent,
                      backgroundColor: hexToRgba(colors.card_accent, 0.1),
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Process CSV'}
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>

        {parsed && (
          <>
            {/* Summary Alert */}
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                backgroundColor: colors.card_bg,
                color: colors.card_text,
              }}
            >
              Format detected: <strong>{parsed.format_detected}</strong> | 
              Found {parsed.transactions.length} confident transactions and {parsed.uncertain.length} needing review
              {parsed.errors.length > 0 && ` | ${parsed.errors.length} parsing errors`}
            </Alert>

            {/* Errors Alert - Show prominently if there are errors */}
            {parsed.errors.length > 0 && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  backgroundColor: hexToRgba('#F57C00', 0.1),
                  border: `1px solid ${hexToRgba('#F57C00', 0.3)}`,
                  color: colors.card_text,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  ⚠️ {parsed.errors.length} row(s) failed to parse
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Some rows in your CSV could not be processed. Check the errors section below for details.
                </Typography>
              </Alert>
            )}

            {parsed.transactions.length > 0 && (
              <TransactionTable
                transactions={parsed.transactions}
                accounts={accounts}
                trips={trips}
                categories={categories}
                isUncertain={false}
                onUpdateTransaction={handleUpdateTransaction}
                onDelete={handleDeleteConfident}
                onImport={() => handleConfirm(parsed.transactions)}
                importing={importing}
                onAddCategory={handleAddNewCategory}
              />
            )}

            {parsed.uncertain.length > 0 && (
              <TransactionTable
                transactions={parsed.uncertain}
                accounts={accounts}
                trips={trips}
                categories={categories}
                isUncertain={true}
                onUpdateTransaction={handleUpdateTransaction}
                onDelete={handleDeleteUncertain}
                onImport={() => handleConfirm(parsed.uncertain)}
                importing={importing}
                onAddCategory={handleAddNewCategory}
              />
            )}

            <ErrorDisplay errors={parsed.errors} />
          </>
        )}

        {/* Edit Transaction Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colors.card_bg,
              color: colors.card_text,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
            Edit Transaction
          </DialogTitle>
          <DialogContent>
            {editingTransaction && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.card_subtext }}>Account</InputLabel>
                  <Select
                    value={editingTransaction.account_id || ''}
                    onChange={(e) => {
                      if (editingTransaction) {
                        setEditingTransaction({
                          ...editingTransaction,
                          account_id: e.target.value as number,
                        });
                      }
                    }}
                    label="Account"
                    sx={{
                      color: colors.card_text,
                      backgroundColor: colors.card_bg,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                      },
                    }}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.account_id} value={account.account_id}>
                        {account.account_name} ({account.institution}) - {account.currency_code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.card_subtext }}>Transaction Type</InputLabel>
                  <Select
                    value={editingTransaction.transaction_type}
                    onChange={(e) => {
                      if (editingTransaction) {
                        setEditingTransaction({
                          ...editingTransaction,
                          transaction_type: e.target.value,
                          // Clear transfer_to_account_id if not a transfer
                          transfer_to_account_id: e.target.value === 'transfer' ? editingTransaction.transfer_to_account_id : null,
                        });
                      }
                    }}
                    label="Transaction Type"
                    sx={{
                      color: colors.card_text,
                      backgroundColor: colors.card_bg,
                    }}
                  >
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                  </Select>
                </FormControl>
                {editingTransaction.transaction_type === 'transfer' && (
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: colors.card_subtext }}>Transfer To Account (Optional)</InputLabel>
                    <Select
                      value={editingTransaction.transfer_to_account_id || ''}
                      onChange={(e) => {
                        if (editingTransaction) {
                          setEditingTransaction({
                            ...editingTransaction,
                            transfer_to_account_id: e.target.value || null,
                          });
                        }
                      }}
                      label="Transfer To Account (Optional)"
                      sx={{
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                      }}
                    >
                      <MenuItem value="">No Account Selected</MenuItem>
                      {accounts
                        .filter(acc => acc.account_id !== editingTransaction.account_id)
                        .map((account) => (
                          <MenuItem key={account.account_id} value={account.account_id}>
                            {account.account_name} ({account.institution}) - {account.currency_code}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
                <TextField
                  fullWidth
                  label="Category"
                  value={editingTransaction.category || ''}
                  onChange={(e) => {
                    if (editingTransaction) {
                      setEditingTransaction({
                        ...editingTransaction,
                        category: e.target.value,
                      });
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: colors.card_text,
                      backgroundColor: colors.card_bg,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Merchant"
                  value={editingTransaction.merchant || ''}
                  onChange={(e) => {
                    if (editingTransaction) {
                      setEditingTransaction({
                        ...editingTransaction,
                        merchant: e.target.value,
                      });
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: colors.card_text,
                      backgroundColor: colors.card_bg,
                    },
                  }}
                />
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.card_subtext }}>Trip</InputLabel>
                  <Select
                    value={editingTransaction.trip_id || ''}
                    onChange={(e) => {
                      if (editingTransaction) {
                        setEditingTransaction({
                          ...editingTransaction,
                          trip_id: e.target.value || null,
                        });
                      }
                    }}
                    label="Trip"
                    sx={{
                      color: colors.card_text,
                      backgroundColor: colors.card_bg,
                    }}
                  >
                    <MenuItem value="">No Trip</MenuItem>
                    {trips.map((trip) => (
                      <MenuItem key={trip.trip_id} value={trip.trip_id}>
                        {trip.trip_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: colors.card_subtext }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="contained"
              sx={{
                backgroundColor: colors.card_accent,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_accent, 0.8),
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CSVImport;

