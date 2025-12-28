import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import { Account, Trip } from '../../services/api';
import { ExpenseTrackingColors } from '../expenses/types';
import { getBorderOpacity, hexToRgba } from '../dashboard/utils';

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  account: Account | null;
  allAccounts: Account[];
  trips: Trip[];
  categories: { expense_categories: string[]; income_categories: string[] };
  transactionType: 'expense' | 'income' | 'transfer';
  onTransactionTypeChange: (type: 'expense' | 'income' | 'transfer') => void;
  formData: {
    amount: string;
    category: string;
    transaction_date: string;
    description: string;
    merchant: string;
    trip_id: string;
    to_account_id: string;
    exchange_rate: string;
    fees: string;
  };
  onFormDataChange: (data: Partial<AddTransactionDialogProps['formData']>) => void;
  saving: boolean;
  colors: ExpenseTrackingColors;
}

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  open,
  onClose,
  onCreate,
  account,
  allAccounts,
  trips,
  categories,
  transactionType,
  onTransactionTypeChange,
  formData,
  onFormDataChange,
  saving,
  colors,
}) => {
  const toAccountId = formData.to_account_id ? parseInt(formData.to_account_id) : null;
  const toAccount = toAccountId ? allAccounts.find(acc => acc.account_id === toAccountId) : null;
  const isCurrencyExchange = toAccount && account && toAccount.currency_code !== account.currency_code;
  const isSameCurrency = toAccount && account && toAccount.currency_code === account.currency_code;
  const sourceAmount = parseFloat(formData.amount) || 0;
  const exchangeRate = parseFloat(formData.exchange_rate) || 0;
  const destinationAmount = sourceAmount * exchangeRate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Add Transaction
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.card_subtext }}>Transaction Type</InputLabel>
            <Select
              value={transactionType}
              onChange={(e) => onTransactionTypeChange(e.target.value as 'expense' | 'income' | 'transfer')}
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

          {transactionType === 'transfer' && (
            <>
              <FormControl fullWidth required>
                <InputLabel sx={{ color: colors.card_subtext }}>To Account</InputLabel>
                <Select
                  value={formData.to_account_id}
                  onChange={(e) => onFormDataChange({ to_account_id: e.target.value, exchange_rate: '', fees: '' })}
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
                  {allAccounts
                    .filter((acc) => acc.account_id !== account?.account_id)
                    .map((acc) => (
                      <MenuItem key={acc.account_id} value={acc.account_id.toString()}>
                        {acc.account_name} ({acc.currency_code})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {isCurrencyExchange && (
                <>
                  <Box sx={{ p: 2, backgroundColor: hexToRgba(colors.card_accent, 0.1), borderRadius: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.card_text,
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        mb: 1,
                        fontWeight: 600,
                      }}
                    >
                      Currency Exchange: {account?.currency_code} → {toAccount?.currency_code}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.card_subtext,
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        fontSize: '0.85rem',
                      }}
                    >
                      Amount entered below is in {account?.currency_code}. The destination amount will be calculated using the exchange rate.
                    </Typography>
                  </Box>

                  <TextField
                    label="Exchange Rate"
                    type="number"
                    fullWidth
                    required
                    value={formData.exchange_rate}
                    onChange={(e) => onFormDataChange({ exchange_rate: e.target.value })}
                    helperText={`Rate to convert 1 ${account?.currency_code || ''} to ${toAccount?.currency_code || ''}`}
                    inputProps={{ step: '0.0001', min: '0.0001' }}
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
                      '& .MuiFormHelperText-root': {
                        color: colors.card_subtext,
                      },
                    }}
                  />

                  {sourceAmount > 0 && exchangeRate > 0 && (
                    <Box sx={{ p: 2, backgroundColor: hexToRgba(colors.card_accent, 0.1), borderRadius: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          mb: 0.5,
                          fontWeight: 600,
                        }}
                      >
                        Exchange Preview:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.card_text,
                          fontFamily: 'Inter, -apple-system, sans-serif',
                        }}
                      >
                        {sourceAmount.toFixed(2)} {account?.currency_code} → {destinationAmount.toFixed(2)} {toAccount?.currency_code}
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    label="Fees (Optional)"
                    type="number"
                    fullWidth
                    value={formData.fees}
                    onChange={(e) => onFormDataChange({ fees: e.target.value })}
                    helperText={`Exchange fees in ${account?.currency_code || ''} (will be recorded as an expense)`}
                    inputProps={{ step: '0.01', min: '0' }}
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
                      '& .MuiFormHelperText-root': {
                        color: colors.card_subtext,
                      },
                    }}
                  />
                </>
              )}

              {isSameCurrency && (
                <TextField
                  label="Fees (Optional)"
                  type="number"
                  fullWidth
                  value={formData.fees}
                  onChange={(e) => onFormDataChange({ fees: e.target.value })}
                  helperText={`Transfer fees in ${account?.currency_code || ''} (will be recorded as an expense)`}
                  inputProps={{ step: '0.01', min: '0' }}
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
                    '& .MuiFormHelperText-root': {
                      color: colors.card_subtext,
                    },
                  }}
                />
              )}
            </>
          )}

          <TextField
            label={(() => {
              if (transactionType === 'transfer' && formData.to_account_id) {
                if (isCurrencyExchange) {
                  return `Amount (${account?.currency_code})`;
                }
              }
              return 'Amount';
            })()}
            type="number"
            fullWidth
            required
            value={formData.amount}
            onChange={(e) => onFormDataChange({ amount: e.target.value })}
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
            value={formData.transaction_date}
            onChange={(e) => onFormDataChange({ transaction_date: e.target.value })}
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

          {transactionType !== 'transfer' && (
            <>
              {(transactionType === 'expense' ? categories.expense_categories.length > 0 : categories.income_categories.length > 0) && (
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.card_subtext }}>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => onFormDataChange({ category: e.target.value })}
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
                    {(transactionType === 'expense' ? categories.expense_categories : categories.income_categories).map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Merchant (Optional)"
                fullWidth
                value={formData.merchant}
                onChange={(e) => onFormDataChange({ merchant: e.target.value })}
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

              {transactionType === 'expense' && (
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.card_subtext }}>Trip (Optional)</InputLabel>
                  <Select
                    value={formData.trip_id}
                    onChange={(e) => onFormDataChange({ trip_id: e.target.value })}
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
                      <MenuItem key={trip.trip_id} value={trip.trip_id.toString()}>
                        {trip.trip_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}

          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
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
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: colors.card_subtext,
            '&:hover': {
              backgroundColor: hexToRgba(colors.card_subtext, 0.1),
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onCreate}
          variant="contained"
          disabled={saving}
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
          {saving ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

