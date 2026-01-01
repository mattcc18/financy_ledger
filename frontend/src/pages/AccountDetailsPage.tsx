import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { api, Account, BalanceHistory, Transaction, Balance, Trip } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { getDashboardPalette, PALETTE_BACKGROUNDS, PALETTE_TEXT_COLORS, PALETTE_SUBTEXT_COLORS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';
import {
  DeleteTransactionDialog,
  EditTransactionDialog,
  AddTransactionDialog,
  AdjustBalanceDialog,
  TransactionList,
} from '../components/account-details';

const AccountDetailsPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { colorPalette } = useTheme();
  const { selectedCurrency } = useDashboard();
  const colors = getDashboardPalette(colorPalette);
  
  const [account, setAccount] = useState<Account | null>(null);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentBalance, setCurrentBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adjustBalanceDialogOpen, setAdjustBalanceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [adjustBalanceFormData, setAdjustBalanceFormData] = useState({
    actual_balance: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [categories, setCategories] = useState<{ expense_categories: string[]; income_categories: string[] }>({
    expense_categories: [],
    income_categories: [],
  });
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category: '',
    transaction_date: '',
    description: '',
    merchant: '',
    trip_id: '',
  });
  const [newTransactionFormData, setNewTransactionFormData] = useState({
    amount: '',
    category: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: '',
    trip_id: '',
    to_account_id: '',
    exchange_rate: '',
    fees: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keepDialogOpen, setKeepDialogOpen] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadAccountDetails(parseInt(accountId));
    }
  }, [accountId, selectedCurrency]);

  const loadAccountDetails = async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      // Load account details, current balance, transactions (includes expenses), trips, categories, and all accounts (for transfers)
      const [accounts, balancesData, txs, tripsData, categoriesData, allAccountsData] = await Promise.all([
        api.getAccounts(),
        api.getBalances(selectedCurrency),
        api.getTransactions(id),
        api.getTrips(),
        api.getCategories(),
        api.getAccounts(), // Load all accounts for transfer dropdown
      ]);

      const accountData = accounts.find(a => a.account_id === id);
      if (!accountData) {
        setError('Account not found');
        return;
      }

      setAccount(accountData);
      setTransactions(txs);
      setTrips(tripsData);
      setCategories(categoriesData);
      setAllAccounts(allAccountsData);
      console.log(`Loaded ${txs.length} transactions for account ${id}`);
      // Debug: Log transactions with trip_id
      const transactionsWithTrip = txs.filter(tx => tx.trip_id);
      console.log(`Transactions with trip_id: ${transactionsWithTrip.length}`);
      if (transactionsWithTrip.length > 0) {
        console.log('Sample transaction with trip:', transactionsWithTrip[0]);
        const matchingTrip = tripsData.find(t => Number(t.trip_id) === Number(transactionsWithTrip[0].trip_id));
        console.log('Matching trip found:', matchingTrip);
      }
      console.log('All trips:', tripsData.map(t => ({ id: t.trip_id, name: t.trip_name })));

      // Get current balance for this account
      const accountBalance = balancesData.find(b => b.account_name === accountData.account_name) || null;
      setCurrentBalance(accountBalance);
      console.log('Current balance for account:', accountBalance);

      // Load balance history for this account
      try {
        const accountHistory = await api.getAccountBalanceHistory(accountData.account_name, selectedCurrency);
        setBalanceHistory(accountHistory);
      } catch (err) {
        console.error('Error loading balance history:', err);
        // Continue without history
        setBalanceHistory([]);
      }
    } catch (err) {
      console.error('Error loading account details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    // For expenses, keep the amount as-is (negative). For income/transfers, use absolute value for display
    const displayAmount = transaction.transaction_type === 'expense' 
      ? transaction.amount.toString() 
      : Math.abs(transaction.amount).toString();
    setEditFormData({
      amount: displayAmount,
      category: transaction.category || '',
      transaction_date: transaction.transaction_date,
      description: transaction.description || '',
      merchant: transaction.merchant || '',
      trip_id: transaction.trip_id?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingTransaction(null);
    setEditFormData({
      amount: '',
      category: '',
      transaction_date: '',
      description: '',
      merchant: '',
      trip_id: '',
    });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleOpenAddDialog = () => {
    setNewTransactionFormData({
      amount: '',
      category: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      merchant: '',
      trip_id: '',
      to_account_id: '',
      exchange_rate: '',
      fees: '',
    });
    setNewTransactionType('expense');
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewTransactionFormData({
      amount: '',
      category: '',
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      merchant: '',
      trip_id: '',
      to_account_id: '',
      exchange_rate: '',
      fees: '',
    });
  };

  const handleCreateTransaction = async () => {
    if (!account) return;

    try {
      setSaving(true);
      setError(null);

      const amount = parseFloat(newTransactionFormData.amount);
      if (isNaN(amount) || amount === 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (newTransactionType === 'transfer') {
        // Use transfers API
        if (!newTransactionFormData.to_account_id) {
          setError('Please select a destination account');
          return;
        }

        const toAccountId = parseInt(newTransactionFormData.to_account_id);
        if (toAccountId === account.account_id) {
          setError('Cannot transfer to the same account');
          return;
        }

        // Check if currencies are different
        const toAccount = allAccounts.find(acc => acc.account_id === toAccountId);
        const isCurrencyExchange = toAccount && toAccount.currency_code !== account.currency_code;

        if (isCurrencyExchange) {
          // Use currency exchange API
          if (!newTransactionFormData.exchange_rate) {
            setError('Please enter an exchange rate');
            return;
          }

          const exchangeRate = parseFloat(newTransactionFormData.exchange_rate);
          if (isNaN(exchangeRate) || exchangeRate <= 0) {
            setError('Please enter a valid exchange rate');
            return;
          }

          const fees = newTransactionFormData.fees ? parseFloat(newTransactionFormData.fees) : 0;
          if (isNaN(fees) || fees < 0) {
            setError('Please enter a valid fee amount (or 0 for no fees)');
            return;
          }

          await api.createCurrencyExchange({
            from_account_id: account.account_id,
            to_account_id: toAccountId,
            amount: Math.abs(amount),
            exchange_rate: exchangeRate,
            fees: fees,
            date: newTransactionFormData.transaction_date,
            description: newTransactionFormData.description || null,
          });
        } else {
          // Use regular transfers API (same currency)
          const fees = newTransactionFormData.fees ? parseFloat(newTransactionFormData.fees) : 0;
          if (isNaN(fees) || fees < 0) {
            setError('Please enter a valid fee amount (or leave empty for no fees)');
            return;
          }

          await api.createTransfer({
            from_account_id: account.account_id,
            to_account_id: toAccountId,
            amount: Math.abs(amount),
            fees: fees,
            date: newTransactionFormData.transaction_date,
            description: newTransactionFormData.description || null,
          });
        }
      } else {
        // Use transactions API
        // For expenses, make amount negative
        const finalAmount = newTransactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount);

        await api.createTransaction({
          account_id: account.account_id,
          amount: finalAmount,
          transaction_type: newTransactionType,
          category: newTransactionFormData.category || null,
          transaction_date: newTransactionFormData.transaction_date,
          description: newTransactionFormData.description || null,
          merchant: newTransactionFormData.merchant || null,
          trip_id: newTransactionFormData.trip_id ? parseInt(newTransactionFormData.trip_id) : null,
        });
      }

      // Reload account details
      if (accountId) {
        await loadAccountDetails(parseInt(accountId));
      }
      
      // If keep open is checked, preserve account and date, clear other fields
      if (keepDialogOpen) {
        const preservedDate = newTransactionFormData.transaction_date;
        setNewTransactionFormData({
          amount: '',
          category: '',
          transaction_date: preservedDate, // Keep the date
          description: '',
          merchant: '',
          trip_id: '',
          to_account_id: '',
          exchange_rate: '',
          fees: '',
        });
        // Keep dialog open, don't call handleCloseAddDialog
      } else {
        handleCloseAddDialog();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!account) return;

    try {
      setSaving(true);
      setError(null);

      const actualBalance = parseFloat(adjustBalanceFormData.actual_balance);
      if (isNaN(actualBalance)) {
        setError('Please enter a valid balance');
        return;
      }

      await api.createMarketAdjustment({
        account_id: account.account_id,
        actual_balance: actualBalance,
        date: adjustBalanceFormData.transaction_date,
        description: adjustBalanceFormData.description || null,
      });

      // Reload account details
      if (accountId) {
        await loadAccountDetails(parseInt(accountId));
      }
      setAdjustBalanceDialogOpen(false);
      setAdjustBalanceFormData({
        actual_balance: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust balance');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      setSaving(true);
      setError(null);

      const amount = parseFloat(editFormData.amount);
      if (isNaN(amount) || amount === 0) {
        setError('Please enter a valid amount');
        return;
      }

      // For expenses, ensure amount is negative. For income, ensure it's positive. For transfers, keep sign as entered.
      let finalAmount = amount;
      if (editingTransaction.transaction_type === 'expense') {
        finalAmount = -Math.abs(amount); // Always negative for expenses
      } else if (editingTransaction.transaction_type === 'income') {
        finalAmount = Math.abs(amount); // Always positive for income
      }
      // For transfers, keep the sign as entered (could be positive or negative depending on direction)

      await api.updateTransaction(editingTransaction.transaction_id, {
        amount: finalAmount,
        category: editFormData.category || null,
        transaction_date: editFormData.transaction_date,
        description: editFormData.description || null,
        merchant: editFormData.merchant || null,
        trip_id: editFormData.trip_id ? parseInt(editFormData.trip_id) : null,
      });

      // Reload account details
      if (accountId) {
        await loadAccountDetails(parseInt(accountId));
      }
      handleCloseEditDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      await api.deleteTransaction(transactionToDelete.transaction_id);

      // Reload account details
      if (accountId) {
        await loadAccountDetails(parseInt(accountId));
      }
      handleCloseDeleteDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const availableCategories = editingTransaction
    ? editingTransaction.transaction_type === 'expense'
      ? categories.expense_categories
      : editingTransaction.transaction_type === 'income'
      ? categories.income_categories
      : []
    : [];

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {};
    transactions.forEach((tx) => {
      const dateKey = new Date(tx.transaction_date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tx);
    });
    // Sort dates in descending order (newest first)
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .reduce((acc, date) => {
        acc[date] = grouped[date];
        return acc;
      }, {} as { [key: string]: Transaction[] });
  }, [transactions]);

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          pb: 6,
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !account) {
    return (
      <Box
        sx={{
          flex: 1,
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          pb: 6,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error">{error || 'Account not found'}</Alert>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounts')} sx={{ mt: 2 }}>
            Back to Accounts
          </Button>
        </Container>
      </Box>
    );
  }

  // Get current balance value - prefer from currentBalance (from balances API), fallback to history
  const balanceValue = currentBalance
    ? (currentBalance as any)[`balance_${selectedCurrency.toLowerCase()}`] || currentBalance.balance_eur || 0
    : balanceHistory.length > 0
    ? ((balanceHistory[balanceHistory.length - 1] as any)[`balance_${selectedCurrency.toLowerCase()}`] || balanceHistory[balanceHistory.length - 1].balance_eur || 0)
    : 0;

  const nativeBalance = currentBalance?.amount || (balanceHistory.length > 0 ? balanceHistory[balanceHistory.length - 1]?.amount : 0);

  // Prepare chart data
  const chartDates = balanceHistory.map(b => new Date(b.balance_date));
  const chartAmounts = balanceHistory.map(b => {
    const key = `balance_${selectedCurrency.toLowerCase()}` as keyof BalanceHistory;
    return (b[key] as number) || b.balance_eur || b.amount;
  });

  // Determine chart color based on account type
  const isCashType = ['cash', 'checking', 'savings', 'current'].includes(account.account_type.toLowerCase());
  const chartColor = isCashType ? colors.cash : colors.investment;

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{
              mb: 2,
              color: colors.card_text,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
              },
            }}
          >
            Back to Accounts
          </Button>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: colors.card_text,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {account.account_name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.card_subtext,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {account.institution} • {account.account_type} • {account.currency_code}
          </Typography>
        </Box>

        {/* Layout: Two cards on left, graph on right */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Left: Balance Cards */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mt: 5 }}>
              {/* Current Balance Card */}
              <Card
                sx={{
                  backgroundColor: colors.card_bg,
                  borderRadius: 4,
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  mb: 2,
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.card_subtext,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      mb: 1.5,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    Current Balance ({selectedCurrency})
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: colors.card_text,
                      fontWeight: 700,
                      fontSize: '2rem',
                      letterSpacing: '-0.02em',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    {currencyFormat(balanceValue, selectedCurrency)}
                  </Typography>
                </CardContent>
              </Card>

              {/* Native Balance Card */}
              <Card
                sx={{
                  backgroundColor: colors.card_bg,
                  borderRadius: 4,
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CardContent>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.card_subtext,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      mb: 1.5,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    Native Balance ({account.currency_code})
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: colors.card_text,
                      fontWeight: 700,
                      fontSize: '2rem',
                      letterSpacing: '-0.02em',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    {currencyFormat(nativeBalance, account.currency_code)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right: Chart */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                backgroundColor: colors.card_bg,
                borderRadius: 4,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                height: '100%',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    color: colors.card_text,
                    fontWeight: 600,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    mb: 3,
                  }}
                >
                  Balance Over Time
                </Typography>
                {chartDates.length > 0 ? (
                  <Plot
                    data={[
                      {
                        x: chartDates,
                        y: chartAmounts,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Balance',
                        line: {
                          color: chartColor,
                          width: 2.5,
                          shape: 'linear',
                        },
                        fill: 'tozeroy',
                        fillcolor: hexToRgba(chartColor, 0.12),
                      },
                    ]}
                    layout={{
                      template: 'none',
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      height: 320,
                      xaxis: {
                        type: 'date',
                        title: {
                          text: 'Date',
                          font: { size: 11, color: colors.card_subtext, family: 'Inter, -apple-system, sans-serif', weight: 500 },
                        },
                        showgrid: true,
                        gridcolor: 'rgba(128,128,128,0.06)',
                        tickfont: { color: colors.card_subtext, size: 10, family: 'Inter, -apple-system, sans-serif' },
                        zeroline: false,
                        dtick: 'M1',
                        tickformat: '%b %Y',
                        hoverformat: '%d %b %Y',
                        tickangle: -45,
                      },
                      yaxis: {
                        title: {
                          text: selectedCurrency,
                          font: { size: 11, color: colors.card_subtext, family: 'Inter, -apple-system, sans-serif', weight: 500 },
                        },
                        showgrid: true,
                        gridcolor: 'rgba(128,128,128,0.06)',
                        tickfont: { color: colors.card_subtext, size: 10, family: 'Inter, -apple-system, sans-serif' },
                        zeroline: false,
                      },
                      hovermode: 'x unified',
                      hoverlabel: {
                        bgcolor: '#FFFFFF',
                        bordercolor: colors.card_subtext,
                        font: {
                          family: 'Inter, -apple-system, sans-serif',
                          size: 11,
                          color: '#000000',
                        },
                      },
                      margin: { t: 10, b: 50, l: 60, r: 20 },
                      showlegend: false,
                    }}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Alert severity="info">No balance history available</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Transactions Table */}
        <Box sx={{ mt: 6 }}>
          <Card
            sx={{
              backgroundColor: colors.card_bg,
              borderRadius: 4,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.card_text,
                    fontWeight: 600,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  Transactions ({transactions.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {account?.account_type === 'Investment' && (
                    <Button
                      startIcon={<Add />}
                      onClick={() => {
                        setAdjustBalanceFormData({
                          actual_balance: '',
                          transaction_date: new Date().toISOString().split('T')[0],
                          description: '',
                        });
                        setAdjustBalanceDialogOpen(true);
                      }}
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
                      Adjust Balance
                    </Button>
                  )}
                  <Button
                    startIcon={<Add />}
                    onClick={handleOpenAddDialog}
                    variant="contained"
                    sx={{
                      backgroundColor: colors.card_accent,
                      '&:hover': {
                        backgroundColor: colors.card_accent,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Add Transaction
                  </Button>
                </Box>
              </Box>
              <TransactionList
                transactions={transactions}
                transactionsByDate={transactionsByDate}
                account={account}
                trips={trips}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                colors={colors}
              />
            </CardContent>
          </Card>
        </Box>

        <AddTransactionDialog
          open={addDialogOpen}
          onClose={handleCloseAddDialog}
          onCreate={handleCreateTransaction}
          account={account}
          allAccounts={allAccounts}
          trips={trips}
          categories={categories}
          transactionType={newTransactionType}
          onTransactionTypeChange={setNewTransactionType}
          formData={newTransactionFormData}
          onFormDataChange={(data) => setNewTransactionFormData({ ...newTransactionFormData, ...data })}
          saving={saving}
          colors={colors}
          keepOpen={keepDialogOpen}
          onKeepOpenChange={setKeepDialogOpen}
        />

        <AdjustBalanceDialog
          open={adjustBalanceDialogOpen}
          onClose={() => setAdjustBalanceDialogOpen(false)}
          onAdjust={handleAdjustBalance}
          account={account}
          currentBalance={currentBalance}
          formData={adjustBalanceFormData}
          onFormDataChange={(data) => setAdjustBalanceFormData({ ...adjustBalanceFormData, ...data })}
          saving={saving}
          colors={colors}
        />

        <EditTransactionDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSaveEdit}
          transaction={editingTransaction}
          trips={trips}
          categories={availableCategories}
          formData={editFormData}
          onFormDataChange={(data) => setEditFormData({ ...editFormData, ...data })}
          saving={saving}
          colors={colors}
        />

        <DeleteTransactionDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          transaction={transactionToDelete}
          account={account}
          deleting={deleting}
          colors={colors}
        />
      </Container>
    </Box>
  );
};

export default AccountDetailsPage;

