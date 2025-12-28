import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { api, Account, Trip } from '../services/api';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { getBorderOpacity } from '../components/dashboard/utils';

interface TransactionFormData {
  account_id: number | '';
  from_account_id: number | '';
  to_account_id: number | '';
  amount: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  category: string;
  transaction_date: string;
  description: string;
  merchant: string;
  trip_id: number | '';
}

interface AccountFormData {
  account_name: string;
  account_type: string;
  institution: string;
  currency_code: string;
}

const DataEntry: React.FC = () => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<{ expense_categories: string[]; income_categories: string[] }>({
    expense_categories: [],
    income_categories: [],
  });

  const [transactionForm, setTransactionForm] = useState<TransactionFormData>({
    account_id: '',
    from_account_id: '',
    to_account_id: '',
    amount: '',
    transaction_type: 'expense',
    category: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: '',
    trip_id: '',
  });

  const [accountForm, setAccountForm] = useState<AccountFormData>({
    account_name: '',
    account_type: '',
    institution: '',
    currency_code: 'EUR',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [accountsData, tripsData, categoriesData] = await Promise.all([
        api.getAccounts(),
        api.getTrips(),
        api.getCategories(),
      ]);
      setAccounts(accountsData);
      setTrips(tripsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on transaction type
    if (transactionForm.transaction_type === 'transfer') {
      if (!transactionForm.from_account_id || !transactionForm.to_account_id || !transactionForm.amount) {
        setError('From account, To account, and amount are required');
        return;
      }
      if (transactionForm.from_account_id === transactionForm.to_account_id) {
        setError('Cannot transfer to the same account');
        return;
      }
    } else {
      if (!transactionForm.account_id || !transactionForm.amount) {
        setError('Account and amount are required');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (transactionForm.transaction_type === 'transfer') {
        // Use transfers API
        await api.createTransfer({
          from_account_id: transactionForm.from_account_id as number,
          to_account_id: transactionForm.to_account_id as number,
          amount: parseFloat(transactionForm.amount),
          date: transactionForm.transaction_date,
          description: transactionForm.description || null,
        });
        setSuccess('Transfer created successfully!');
      } else {
        // Use transactions API
        await api.createTransaction({
          account_id: transactionForm.account_id as number,
          amount: parseFloat(transactionForm.amount),
          transaction_type: transactionForm.transaction_type,
          category: transactionForm.category || null,
          transaction_date: transactionForm.transaction_date,
          description: transactionForm.description || null,
          merchant: (transactionForm.transaction_type === 'expense' || transactionForm.transaction_type === 'income') ? (transactionForm.merchant || null) : null,
          trip_id: transactionForm.trip_id ? (transactionForm.trip_id as number) : null,
        });
        setSuccess('Transaction created successfully!');
      }
      
      // Reset form
      setTransactionForm({
        account_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        transaction_type: 'expense',
        category: '',
        transaction_date: new Date().toISOString().split('T')[0],
        description: '',
        merchant: '',
        trip_id: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountForm.account_name || !accountForm.account_type || !accountForm.institution || !accountForm.currency_code) {
      setError('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await api.createAccount(accountForm);
      setSuccess('Account created successfully!');
      
      // Reset form
      setAccountForm({
        account_name: '',
        account_type: '',
        institution: '',
        currency_code: 'EUR',
      });

      // Reload accounts
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCategories =
    transactionForm.transaction_type === 'expense'
      ? categories.expense_categories
      : transactionForm.transaction_type === 'income'
      ? categories.income_categories
      : [];

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

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        px: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: colors.card_text,
            fontFamily: 'Inter, -apple-system, sans-serif',
            mb: 3,
          }}
        >
          Data Entry
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Card
          sx={{
            backgroundColor: colors.card_bg,
            borderRadius: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              '& .MuiTab-root': {
                color: colors.card_subtext,
                '&.Mui-selected': {
                  color: colors.card_accent,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: colors.card_accent,
              },
            }}
          >
            <Tab label="Create Transaction" />
            <Tab label="Create Account" />
          </Tabs>

          {/* Transaction Form */}
          {activeTab === 0 && (
            <CardContent>
              <form onSubmit={handleTransactionSubmit}>
                <Stack spacing={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: colors.card_subtext }}>Transaction Type</InputLabel>
                    <Select
                      value={transactionForm.transaction_type}
                      onChange={(e) => {
                        setTransactionForm({
                          ...transactionForm,
                          transaction_type: e.target.value as 'income' | 'expense' | 'transfer',
                          category: '', // Reset category when type changes
                          account_id: '', // Reset account fields when type changes
                          from_account_id: '',
                          to_account_id: '',
                        });
                      }}
                      sx={{
                        color: colors.card_text,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_accent,
                        },
                      }}
                    >
                      <MenuItem value="expense">Expense</MenuItem>
                      <MenuItem value="income">Income</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                    </Select>
                  </FormControl>

                  {transactionForm.transaction_type === 'transfer' ? (
                    <>
                      <FormControl fullWidth required>
                        <InputLabel sx={{ color: colors.card_subtext }}>From Account</InputLabel>
                        <Select
                          value={transactionForm.from_account_id}
                          onChange={(e) => setTransactionForm({ ...transactionForm, from_account_id: e.target.value as number | '' })}
                          sx={{
                            color: colors.card_text,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_subtext + getBorderOpacity(0.3),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_subtext + getBorderOpacity(0.5),
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_accent,
                            },
                          }}
                        >
                          {accounts.map((account) => (
                            <MenuItem key={account.account_id} value={account.account_id}>
                              {account.account_name} ({account.institution})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth required>
                        <InputLabel sx={{ color: colors.card_subtext }}>To Account</InputLabel>
                        <Select
                          value={transactionForm.to_account_id}
                          onChange={(e) => setTransactionForm({ ...transactionForm, to_account_id: e.target.value as number | '' })}
                          sx={{
                            color: colors.card_text,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_subtext + getBorderOpacity(0.3),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_subtext + getBorderOpacity(0.5),
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colors.card_accent,
                            },
                          }}
                        >
                          {accounts.map((account) => (
                            <MenuItem key={account.account_id} value={account.account_id}>
                              {account.account_name} ({account.institution})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  ) : (
                    <FormControl fullWidth required>
                      <InputLabel sx={{ color: colors.card_subtext }}>Account</InputLabel>
                      <Select
                        value={transactionForm.account_id}
                        onChange={(e) => setTransactionForm({ ...transactionForm, account_id: e.target.value as number | '' })}
                        sx={{
                          color: colors.card_text,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.5),
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_accent,
                          },
                        }}
                      >
                        {accounts.map((account) => (
                          <MenuItem key={account.account_id} value={account.account_id}>
                            {account.account_name} ({account.institution})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    label="Amount"
                    type="number"
                    fullWidth
                    required
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    required
                    value={transactionForm.transaction_date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  {transactionForm.transaction_type !== 'transfer' && availableCategories.length > 0 && (
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.card_subtext }}>Category</InputLabel>
                      <Select
                        value={transactionForm.category}
                        onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                        sx={{
                          color: colors.card_text,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.5),
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_accent,
                          },
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {availableCategories.map((cat) => (
                          <MenuItem key={cat} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {(transactionForm.transaction_type === 'expense' || transactionForm.transaction_type === 'income') && (
                    <TextField
                      label="Merchant (Optional)"
                      fullWidth
                      value={transactionForm.merchant}
                      onChange={(e) => setTransactionForm({ ...transactionForm, merchant: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colors.card_text,
                          backgroundColor: colors.card_bg,
                          '& fieldset': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.3),
                          },
                          '&:hover fieldset': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.5),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colors.card_accent,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: colors.card_subtext,
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: colors.card_accent,
                        },
                      }}
                    />
                  )}

                  {transactionForm.transaction_type === 'expense' && (
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: colors.card_subtext }}>Trip (Optional)</InputLabel>
                      <Select
                        value={transactionForm.trip_id}
                        onChange={(e) => setTransactionForm({ ...transactionForm, trip_id: e.target.value as number | '' })}
                        sx={{
                          color: colors.card_text,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.3),
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_subtext + getBorderOpacity(0.5),
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.card_accent,
                          },
                        }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {trips.map((trip) => (
                          <MenuItem key={trip.trip_id} value={trip.trip_id}>
                            {trip.trip_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                    value={transactionForm.description}
                    onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    sx={{
                      backgroundColor: colors.card_accent,
                      '&:hover': {
                        backgroundColor: colors.card_accent,
                        opacity: 0.9,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: colors.card_subtext + '40',
                      },
                    }}
                  >
                    {submitting
                      ? transactionForm.transaction_type === 'transfer'
                        ? 'Creating Transfer...'
                        : 'Creating...'
                      : transactionForm.transaction_type === 'transfer'
                      ? 'Create Transfer'
                      : 'Create Transaction'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          )}

          {/* Account Form */}
          {activeTab === 1 && (
            <CardContent>
              <form onSubmit={handleAccountSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Account Name"
                    fullWidth
                    required
                    value={accountForm.account_name}
                    onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <FormControl fullWidth required>
                    <InputLabel sx={{ color: colors.card_subtext }}>Account Type</InputLabel>
                    <Select
                      value={accountForm.account_type}
                      onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                      sx={{
                        color: colors.card_text,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_accent,
                        },
                      }}
                    >
                      <MenuItem value="Current">Current</MenuItem>
                      <MenuItem value="Savings">Savings</MenuItem>
                      <MenuItem value="Investment">Investment</MenuItem>
                      <MenuItem value="Credit Card">Credit Card</MenuItem>
                      <MenuItem value="Loan">Loan</MenuItem>
                      <MenuItem value="Pension">Pension</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Institution"
                    fullWidth
                    required
                    value={accountForm.institution}
                    onChange={(e) => setAccountForm({ ...accountForm, institution: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <FormControl fullWidth required>
                    <InputLabel sx={{ color: colors.card_subtext }}>Currency</InputLabel>
                    <Select
                      value={accountForm.currency_code}
                      onChange={(e) => setAccountForm({ ...accountForm, currency_code: e.target.value })}
                      sx={{
                        color: colors.card_text,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.card_accent,
                        },
                      }}
                    >
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="CHF">CHF</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    sx={{
                      backgroundColor: colors.card_accent,
                      '&:hover': {
                        backgroundColor: colors.card_accent,
                        opacity: 0.9,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: colors.card_subtext + '40',
                      },
                    }}
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default DataEntry;

