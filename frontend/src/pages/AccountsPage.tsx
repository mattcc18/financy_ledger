import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  IconButton,
  Menu,
  Button,
} from '@mui/material';
import { MoreVert, Edit, Delete, AccountBalance } from '@mui/icons-material';
import { api, Account, Balance } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { useDashboard } from '../contexts/DashboardContext';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';
import {
  AccountCard,
  EditAccountDialog,
  CreateAccountDialog,
  DeleteAccountDialog,
} from '../components/accounts';

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { colorPalette } = useTheme();
  const { selectedCurrency, setSelectedCurrency } = useDashboard();
  const colors = getDashboardPalette(colorPalette);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, Balance>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNativeCurrency, setShowNativeCurrency] = useState(true);
  const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);
  const [selectedCurrenciesFilter, setSelectedCurrenciesFilter] = useState<string[]>([]);
  const [selectedTypesFilter, setSelectedTypesFilter] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'name' | 'balance' | 'institution'>('institution');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<Account>>({});
  const [editingInitialBalance, setEditingInitialBalance] = useState<number | null>(null);
  const [editingInitialBalanceDate, setEditingInitialBalanceDate] = useState<string>('');
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    account_name: '',
    account_type: 'Current',
    institution: '',
    currency_code: 'EUR',
  });
  const [newAccountInitialBalance, setNewAccountInitialBalance] = useState<number | null>(null);
  const [newAccountInitialBalanceDate, setNewAccountInitialBalanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableAccountTypes, setAvailableAccountTypes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [accountsData, balancesData] = await Promise.all([
        api.getAccounts(),
        api.getBalances(selectedCurrency),
      ]);

      setAccounts(accountsData);
      
      // Get unique account types from existing accounts
      const types = [...new Set(accountsData.map(a => a.account_type))];
      // Add common types if not present
      const commonTypes = ['Current', 'Savings', 'Investment', 'Cash', 'Checking', 'Pension', 'Crypto', 'Stocks'];
      const allTypes = [...new Set([...types, ...commonTypes])];
      setAvailableAccountTypes(allTypes.sort());
      
      // Create a map of account_name -> balance
      const balanceMap: Record<string, Balance> = {};
      balancesData.forEach(balance => {
        balanceMap[balance.account_name] = balance;
      });
      setBalances(balanceMap);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (accountId: number) => {
    navigate(`/account/${accountId}`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, account: Account) => {
    event.stopPropagation(); // Prevent card click
    setMenuAnchor(event.currentTarget);
    setSelectedAccount(account);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAccount(null);
  };

  const handleEditClick = async () => {
    if (selectedAccount) {
      // Store the account ID separately so it persists even if selectedAccount is cleared
      setEditingAccountId(selectedAccount.account_id);
      // Create a fresh copy of the account for editing
      setEditingAccount({
        account_name: selectedAccount.account_name,
        institution: selectedAccount.institution,
        account_type: selectedAccount.account_type,
        currency_code: selectedAccount.currency_code,
      });
      
      // Fetch existing initial balance transaction if it exists
      try {
        const transactions = await api.getTransactions(selectedAccount.account_id);
        const initialBalanceTx = transactions.find(
          tx => tx.category === 'Initial Balance'
        );
        if (initialBalanceTx) {
          setEditingInitialBalance(initialBalanceTx.amount);
          setEditingInitialBalanceDate(initialBalanceTx.transaction_date);
        } else {
          setEditingInitialBalance(null);
          setEditingInitialBalanceDate(new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error('Error fetching initial balance:', err);
        setEditingInitialBalance(null);
        setEditingInitialBalanceDate(new Date().toISOString().split('T')[0]);
      }
      
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null); // Close menu but keep selectedAccount
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!editingAccountId) {
      console.error('No account ID for editing');
      alert('No account selected for editing');
      return;
    }
    
    // Prepare update data - use editingAccount values
    const updateData: Partial<Account> = {};
    if (editingAccount.account_name !== undefined) {
      updateData.account_name = editingAccount.account_name;
    }
    if (editingAccount.institution !== undefined) {
      updateData.institution = editingAccount.institution;
    }
    if (editingAccount.account_type !== undefined) {
      updateData.account_type = editingAccount.account_type;
    }
    if (editingAccount.currency_code !== undefined) {
      updateData.currency_code = editingAccount.currency_code;
    }
    
    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0 && editingInitialBalance === null) {
      alert('No changes to save');
      return;
    }
    
    try {
      // Update account details if there are changes
      if (Object.keys(updateData).length > 0) {
        console.log('Updating account:', editingAccountId, 'with data:', updateData);
        await api.updateAccount(editingAccountId, updateData);
      }
      
      // Handle initial balance if provided
      if (editingInitialBalance !== null) {
        // Check if initial balance transaction exists
        const transactions = await api.getTransactions(editingAccountId);
        const existingInitialBalance = transactions.find(
          tx => tx.category === 'Initial Balance'
        );
        
        if (existingInitialBalance) {
          // Update existing initial balance transaction
          await api.updateTransaction(existingInitialBalance.transaction_id, {
            amount: editingInitialBalance,
            category: 'Initial Balance',
            transaction_type: 'income',
            description: 'Initial Balance',
            transaction_date: editingInitialBalanceDate || new Date().toISOString().split('T')[0],
          });
        } else {
          // Create new initial balance transaction
          await api.createTransaction({
            account_id: editingAccountId,
            amount: editingInitialBalance,
            transaction_type: 'income',
            category: 'Initial Balance',
            transaction_date: editingInitialBalanceDate || new Date().toISOString().split('T')[0],
            description: 'Initial Balance',
          });
        }
      }
      
      await loadData(); // Reload accounts
      setEditDialogOpen(false);
      setEditingAccount({});
      setEditingInitialBalance(null);
      setEditingInitialBalanceDate('');
      setEditingAccountId(null);
      setSelectedAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account';
      alert(errorMessage);
    }
  };

  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedAccount) {
      console.error('No account selected for deletion');
      alert('No account selected for deletion');
      return;
    }
    
    try {
      console.log('Deleting account:', selectedAccount.account_id);
      const result = await api.deleteAccount(selectedAccount.account_id);
      console.log('Delete result:', result);
      await loadData(); // Reload accounts
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      console.error('Error deleting account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      alert(errorMessage);
      // Keep dialog open on error so user can try again
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.account_name || !newAccount.institution || !newAccount.account_type || !newAccount.currency_code) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      // Create the account
      const createdAccount = await api.createAccount({
        account_name: newAccount.account_name!,
        account_type: newAccount.account_type!,
        institution: newAccount.institution!,
        currency_code: newAccount.currency_code!,
      });
      
      // Create initial balance transaction if provided (allow 0.00)
      if (newAccountInitialBalance !== null) {
        await api.createTransaction({
          account_id: createdAccount.account_id,
          amount: newAccountInitialBalance,
          transaction_type: 'income',
          category: 'Initial Balance',
          transaction_date: newAccountInitialBalanceDate || new Date().toISOString().split('T')[0],
          description: 'Initial Balance',
        });
      }
      
      await loadData(); // Reload accounts
      setCreateDialogOpen(false);
      setNewAccount({
        account_name: '',
        account_type: 'Current',
        institution: '',
        currency_code: 'EUR',
      });
      setNewAccountInitialBalance(null);
      setNewAccountInitialBalanceDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error creating account:', err);
      alert(err instanceof Error ? err.message : 'Failed to create account');
    }
  };


  const getDisplayBalance = (account: Account): number => {
    const balance = balances[account.account_name];
    if (!balance) return 0;
    
    if (showNativeCurrency) {
      return balance.amount || 0;
    }
    
    const balanceKey = `balance_${selectedCurrency.toLowerCase()}` as keyof Balance;
    const convertedBalance = (balance[balanceKey] as number);
    return convertedBalance !== undefined ? convertedBalance : balance.balance_eur || 0;
  };

  const getDisplayCurrency = (account: Account): string => {
    return showNativeCurrency ? account.currency_code : selectedCurrency;
  };

  // Filter and sort accounts
  const filteredAndSortedAccounts = useMemo(() => {
    let filtered = [...accounts];

    // Filter by institution
    if (selectedInstitutions.length > 0) {
      filtered = filtered.filter(acc => selectedInstitutions.includes(acc.institution));
    }

    // Filter by currency
    if (selectedCurrenciesFilter.length > 0) {
      filtered = filtered.filter(acc => selectedCurrenciesFilter.includes(acc.currency_code));
    }

    // Filter by type
    if (selectedTypesFilter.length > 0) {
      filtered = filtered.filter(acc => selectedTypesFilter.includes(acc.account_type));
    }

    // Sort
    if (sortOption === 'name') {
      filtered.sort((a, b) => a.account_name.localeCompare(b.account_name));
    } else if (sortOption === 'balance') {
      filtered.sort((a, b) => {
        const balanceA = getDisplayBalance(a);
        const balanceB = getDisplayBalance(b);
        return balanceB - balanceA;
      });
    } else if (sortOption === 'institution') {
      filtered.sort((a, b) => {
        if (a.institution !== b.institution) {
          return a.institution.localeCompare(b.institution);
        }
        return a.account_name.localeCompare(b.account_name);
      });
    }

    return filtered;
  }, [accounts, selectedInstitutions, selectedCurrenciesFilter, selectedTypesFilter, sortOption, balances, showNativeCurrency, selectedCurrency]);

  // Group accounts by institution when sorting by institution
  const groupedAccounts = useMemo(() => {
    if (sortOption !== 'institution') {
      return null;
    }

    const groups: Record<string, Account[]> = {};
    filteredAndSortedAccounts.forEach(account => {
      if (!groups[account.institution]) {
        groups[account.institution] = [];
      }
      groups[account.institution].push(account);
    });

    return groups;
  }, [filteredAndSortedAccounts, sortOption]);

  // Get unique values for filters
  const institutions = useMemo(() => [...new Set(accounts.map(a => a.institution))].sort(), [accounts]);
  const currencies = useMemo(() => [...new Set(accounts.map(a => a.currency_code))].sort(), [accounts]);
  const accountTypes = useMemo(() => [...new Set(accounts.map(a => a.account_type))].sort(), [accounts]);

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

  if (error) {
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
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

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
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AccountBalance sx={{ 
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
              Account Balances
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<AccountBalance />}
            sx={{
              backgroundColor: colors.card_accent,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.8),
              },
            }}
          >
            Create Account
          </Button>
        </Stack>
        
        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${hexToRgba(colors.card_bg, 0.6)} 0%, ${hexToRgba(colors.card_subtext, 0.03)} 100%)`,
            borderRadius: 3,
            p: 2,
            mb: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            width: '100%',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Display Currency Selector */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: colors.card_subtext,
                    '&.Mui-focused': {
                      color: colors.card_accent,
                    },
                  }}
                >
                  Display Currency
                </InputLabel>
                <Select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  label="Display Currency"
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '40',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '60',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.card_subtext,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.card_bg,
                        '& .MuiMenuItem-root': {
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.05),
                          },
                          '&.Mui-selected': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            color: colors.card_accent,
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.15),
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  {['EUR', 'GBP', 'USD', 'CHF', 'CAD'].map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Show Native Currency Toggle */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showNativeCurrency}
                    onChange={(e) => setShowNativeCurrency(e.target.checked)}
                    sx={{
                      color: colors.card_subtext,
                      '&.Mui-checked': {
                        color: colors.card_accent,
                      },
                    }}
                  />
                }
                label="Show Native Currency"
                sx={{
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontSize: '0.875rem',
                }}
              />
            </Grid>

            {/* Institution Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: colors.card_subtext,
                    '&.Mui-focused': {
                      color: colors.card_accent,
                    },
                  }}
                >
                  Institution
                </InputLabel>
                <Select
                  multiple
                  value={selectedInstitutions}
                  onChange={(e) => setSelectedInstitutions(e.target.value as string[])}
                  label="Institution"
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '40',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '60',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.card_subtext,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.card_bg,
                        '& .MuiMenuItem-root': {
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.05),
                          },
                          '&.Mui-selected': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            color: colors.card_accent,
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.15),
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  {institutions.map((inst) => (
                    <MenuItem key={inst} value={inst}>
                      {inst}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Currency Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: colors.card_subtext,
                    '&.Mui-focused': {
                      color: colors.card_accent,
                    },
                  }}
                >
                  Currency
                </InputLabel>
                <Select
                  multiple
                  value={selectedCurrenciesFilter}
                  onChange={(e) => setSelectedCurrenciesFilter(e.target.value as string[])}
                  label="Currency"
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '40',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '60',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.card_subtext,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.card_bg,
                        '& .MuiMenuItem-root': {
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.05),
                          },
                          '&.Mui-selected': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            color: colors.card_accent,
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.15),
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Type Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: colors.card_subtext,
                    '&.Mui-focused': {
                      color: colors.card_accent,
                    },
                  }}
                >
                  Type
                </InputLabel>
                <Select
                  multiple
                  value={selectedTypesFilter}
                  onChange={(e) => setSelectedTypesFilter(e.target.value as string[])}
                  label="Type"
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '40',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '60',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.card_subtext,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.card_bg,
                        '& .MuiMenuItem-root': {
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.05),
                          },
                          '&.Mui-selected': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            color: colors.card_accent,
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.15),
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  {accountTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sort Option */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    color: colors.card_subtext,
                    '&.Mui-focused': {
                      color: colors.card_accent,
                    },
                  }}
                >
                  Sort by
                </InputLabel>
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as 'name' | 'balance' | 'institution')}
                  label="Sort by"
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '40',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + '60',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.card_subtext,
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: colors.card_bg,
                        '& .MuiMenuItem-root': {
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.05),
                          },
                          '&.Mui-selected': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            color: colors.card_accent,
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.15),
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="name">Alphabetical</MenuItem>
                  <MenuItem value="balance">Largest to Smallest</MenuItem>
                  <MenuItem value="institution">Institution</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Account Cards Grid */}
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, ${hexToRgba(colors.card_bg, 0.6)} 0%, ${hexToRgba(colors.card_subtext, 0.02)} 100%)`,
            borderRadius: 4,
            p: 3,
            mb: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${hexToRgba(colors.card_accent, 0.05)} 0%, transparent 70%)`,
              borderRadius: '50%',
            },
          }}
        >
          {sortOption === 'institution' && groupedAccounts ? (
            // Grouped by institution
            <Stack spacing={4}>
              {Object.entries(groupedAccounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([institution, institutionAccounts]) => (
                  <Box key={institution}>
                    {/* Institution Header */}
                    <Typography
                      variant="h6"
                      sx={{
                        color: colors.card_text,
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        mb: 2,
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AccountBalance sx={{ color: colors.card_accent, fontSize: 20 }} />
                      {institution}
                    </Typography>
                    {/* Accounts Grid for this Institution */}
                    <Grid container spacing={2}>
                      {institutionAccounts.map((account) => {
                        const balance = getDisplayBalance(account);
                        const nativeBalance = balances[account.account_name]?.amount || 0;
                        const displayCurrency = getDisplayCurrency(account);

                        return (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={account.account_id}>
                            <AccountCard
                              account={account}
                              balance={balance}
                              nativeBalance={nativeBalance}
                              displayCurrency={displayCurrency}
                              showNativeCurrency={showNativeCurrency}
                              onCardClick={() => handleAccountClick(account.account_id)}
                              onMenuClick={(e) => handleMenuOpen(e, account)}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                ))}
            </Stack>
          ) : (
            // Regular grid layout
            <Grid
              container
              spacing={2}
              sx={{
                position: 'relative',
                zIndex: 1,
              }}
            >
              {filteredAndSortedAccounts.map((account) => {
                const balance = getDisplayBalance(account);
                const nativeBalance = balances[account.account_name]?.amount || 0;
                const displayCurrency = getDisplayCurrency(account);

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={account.account_id}>
                    <Card
                      elevation={0}
                      onClick={() => handleAccountClick(account.account_id)}
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_subtext, 0.02)} 100%)`,
                        borderRadius: 4,
                        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: colors.card_subtext + '30',
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '60px',
                          height: '60px',
                          background: `radial-gradient(circle, ${hexToRgba(colors.card_subtext, 0.05)} 0%, transparent 70%)`,
                          borderRadius: '50%',
                        },
                      }}
                    >
                      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                              <AccountBalance
                                sx={{
                                  color: colors.card_subtext,
                                  fontSize: 18,
                                }}
                              />
                              <Typography
                                variant="h6"
                                sx={{
                                  color: colors.card_text,
                                  fontWeight: 700,
                                  fontSize: '1.1rem',
                                  letterSpacing: '-0.01em',
                                  fontFamily: 'Inter, -apple-system, sans-serif',
                                }}
                              >
                                {account.institution}
                              </Typography>
                            </Stack>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, account)}
                              sx={{
                                color: colors.card_subtext,
                                '&:hover': {
                                  backgroundColor: hexToRgba(colors.card_subtext, 0.1),
                                },
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.card_subtext,
                              fontSize: '0.9rem',
                              fontWeight: 400,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            {account.account_name}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                            <Chip
                              icon={getAccountIcon(account.account_type)}
                              label={account.account_type}
                              size="small"
                              variant="outlined"
                              sx={{
                                color: colors.card_subtext,
                                borderColor: colors.card_subtext + '30',
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                height: 24,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                                '& .MuiChip-icon': {
                                  color: colors.card_subtext,
                                },
                              }}
                            />
                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: colors.card_text,
                                  fontWeight: 700,
                                  fontSize: { xs: '1rem', sm: '1.4rem' },
                                  letterSpacing: '-0.02em',
                                  fontFamily: 'Inter, -apple-system, sans-serif',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100%',
                                }}
                              >
                                {currencyFormat(balance, displayCurrency)}
                              </Typography>
                              {!showNativeCurrency && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: colors.card_subtext,
                                    fontSize: '0.75rem',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                  }}
                                >
                                  {currencyFormat(nativeBalance, account.currency_code)} native
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

              {filteredAndSortedAccounts.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No accounts found matching the selected filters.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>

        {/* Account Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: colors.card_bg,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            },
          }}
        >
          <MenuItem
            onClick={handleEditClick}
            sx={{
              color: colors.card_text,
              fontFamily: 'Inter, -apple-system, sans-serif',
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
              },
            }}
          >
            <Edit sx={{ mr: 1, fontSize: 18 }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={handleDeleteClick}
            sx={{
              color: '#F44336',
              fontFamily: 'Inter, -apple-system, sans-serif',
              '&:hover': {
                backgroundColor: hexToRgba('#F44336', 0.1),
              },
            }}
          >
            <Delete sx={{ mr: 1, fontSize: 18 }} />
            Delete
          </MenuItem>
        </Menu>

        <EditAccountDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingAccount({});
            setEditingInitialBalance(null);
            setEditingInitialBalanceDate('');
            setEditingAccountId(null);
            setSelectedAccount(null);
          }}
          onSave={handleSaveEdit}
          account={editingAccount}
          onAccountChange={setEditingAccount}
          initialBalance={editingInitialBalance}
          onInitialBalanceChange={setEditingInitialBalance}
          initialBalanceDate={editingInitialBalanceDate}
          onInitialBalanceDateChange={setEditingInitialBalanceDate}
          availableAccountTypes={availableAccountTypes}
        />

        <DeleteAccountDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSelectedAccount(null);
          }}
          onConfirm={handleConfirmDelete}
          account={selectedAccount}
        />

        <CreateAccountDialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setNewAccount({
              account_name: '',
              account_type: 'Current',
              institution: '',
              currency_code: 'EUR',
            });
            setNewAccountInitialBalance(null);
            setNewAccountInitialBalanceDate(new Date().toISOString().split('T')[0]);
          }}
          onCreate={handleCreateAccount}
          account={newAccount}
          onAccountChange={setNewAccount}
          initialBalance={newAccountInitialBalance}
          onInitialBalanceChange={setNewAccountInitialBalance}
          initialBalanceDate={newAccountInitialBalanceDate}
          onInitialBalanceDateChange={setNewAccountInitialBalanceDate}
          availableAccountTypes={availableAccountTypes}
        />
      </Container>
    </Box>
  );
};

export default AccountsPage;
