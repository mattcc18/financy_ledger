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
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { Transaction, Account, Budget, Trip } from '../../services/api';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors } from './types';

interface ExpenseDialogProps {
  open: boolean;
  editingExpense: Transaction | null;
  formData: {
    transaction_date: string;
    account_id: number;
    merchant: string;
    category: string;
    amount: number;
    description: string | null;
    trip_id: number | null;
  };
  selectedBudgetId: string;
  keepOpen: boolean;
  saving: boolean;
  availableCategories: string[];
  accounts: Account[];
  budgets: Budget[];
  trips?: Trip[];
  colors: ExpenseTrackingColors;
  onClose: () => void;
  onSave: () => void;
  onDelete: (transactionId: number) => void;
  onFormDataChange: (data: {
    transaction_date: string;
    account_id: number;
    merchant: string;
    category: string;
    amount: number;
    description: string | null;
    trip_id: number | null;
  }) => void;
  onSelectedBudgetIdChange: (budgetId: string) => void;
  onKeepOpenChange: (keepOpen: boolean) => void;
}

export const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  editingExpense,
  formData,
  selectedBudgetId,
  keepOpen,
  saving,
  availableCategories,
  accounts,
  budgets,
  trips = [],
  colors,
  onClose,
  onSave,
  onDelete,
  onFormDataChange,
  onSelectedBudgetIdChange,
  onKeepOpenChange,
}) => {
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
        {editingExpense ? 'Edit Expense' : 'Add Expense'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={formData.transaction_date}
            onChange={(e) => onFormDataChange({ ...formData, transaction_date: e.target.value })}
            InputLabelProps={{ 
              shrink: true,
              sx: { color: colors.card_subtext }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.card_accent,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.card_text,
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.card_subtext }}>Account</InputLabel>
            <Select
              value={formData.account_id}
              onChange={(e) => {
                onFormDataChange({
                  ...formData,
                  account_id: e.target.value as number,
                });
              }}
              label="Account"
              sx={{
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.card_accent,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: colors.card_bg,
                    '& .MuiMenuItem-root': {
                      color: colors.card_text,
                      '&:hover': {
                        backgroundColor: hexToRgba(colors.card_text, 0.1),
                      },
                      '&.Mui-selected': {
                        backgroundColor: hexToRgba(colors.card_accent, 0.2),
                        '&:hover': {
                          backgroundColor: hexToRgba(colors.card_accent, 0.3),
                        },
                      },
                    },
                  },
                },
              }}
            >
              {accounts.map((account) => (
                <MenuItem key={account.account_id} value={account.account_id} sx={{ color: colors.card_text }}>
                  {account.account_name} ({account.currency_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editingExpense && budgets.length > 0 && (
            <FormControl fullWidth>
              <InputLabel sx={{ color: colors.card_subtext }}>Select Budget</InputLabel>
              <Select
                value={selectedBudgetId}
                onChange={(e) => {
                  const budgetId = e.target.value as string;
                  onSelectedBudgetIdChange(budgetId);
                  onFormDataChange({ ...formData, category: '' });
                }}
                label="Select Budget"
                sx={{
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_accent,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: colors.card_bg,
                      '& .MuiMenuItem-root': {
                        color: colors.card_text,
                        '&:hover': {
                          backgroundColor: hexToRgba(colors.card_text, 0.1),
                        },
                        '&.Mui-selected': {
                          backgroundColor: hexToRgba(colors.card_accent, 0.2),
                          '&:hover': {
                            backgroundColor: hexToRgba(colors.card_accent, 0.3),
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" sx={{ color: colors.card_subtext }}>
                  <em>No Budget Selected</em>
                </MenuItem>
                {budgets.map((budget) => (
                  <MenuItem key={budget.budget_id} value={String(budget.budget_id)} sx={{ color: colors.card_text }}>
                    {budget.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!editingExpense && budgets.length === 0 && (
            <Box sx={{ p: 2, backgroundColor: hexToRgba(colors.card_subtext, 0.1), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ color: colors.card_subtext, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                No budgets available. Create a budget first to use budget categories.
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Merchant"
            value={formData.merchant}
            onChange={(e) => onFormDataChange({ ...formData, merchant: e.target.value })}
            InputLabelProps={{ 
              sx: { color: colors.card_subtext }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.card_accent,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.card_text,
              },
            }}
          />
          <Autocomplete
            freeSolo
            options={availableCategories}
            value={formData.category || ''}
            onChange={(event, newValue) => {
              const categoryValue = typeof newValue === 'string' ? newValue : (newValue || '');
              onFormDataChange({ ...formData, category: categoryValue });
            }}
            onInputChange={(event, newValue, reason) => {
              if (reason === 'input' || reason === 'clear') {
                onFormDataChange({ ...formData, category: newValue || '' });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                InputLabelProps={{ 
                  sx: { color: colors.card_subtext }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: colors.card_text,
                    backgroundColor: colors.card_bg,
                    '& fieldset': {
                      borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                    },
                    '&:hover fieldset': {
                      borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.card_accent,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: colors.card_text,
                  },
                }}
              />
            )}
            ListboxProps={{
              sx: {
                backgroundColor: colors.card_bg,
                '& .MuiAutocomplete-option': {
                  color: colors.card_text,
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_text, 0.1),
                  },
                  '&[aria-selected="true"]': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.2),
                    '&:hover': {
                      backgroundColor: hexToRgba(colors.card_accent, 0.3),
                    },
                  },
                },
              },
            }}
            PaperComponent={({ children, ...other }) => (
              <Box
                {...other}
                sx={{
                  backgroundColor: colors.card_bg,
                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.2)}`,
                }}
              >
                {children}
              </Box>
            )}
          />
          <TextField
            fullWidth
            type="number"
            label="Amount"
            value={formData.amount === 0 ? '' : formData.amount}
            onChange={(e) => {
              const value = e.target.value;
              onFormDataChange({ ...formData, amount: value === '' ? 0 : parseFloat(value) || 0 });
            }}
            onFocus={(e) => {
              e.target.select();
            }}
            inputProps={{ min: 0, step: 0.01 }}
            InputLabelProps={{ 
              sx: { color: colors.card_subtext }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.card_accent,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.card_text,
              },
            }}
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={formData.description || ''}
            onChange={(e) => onFormDataChange({ ...formData, description: e.target.value || null })}
            multiline
            rows={3}
            InputLabelProps={{ 
              sx: { color: colors.card_subtext }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover fieldset': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.card_accent,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.card_text,
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.card_subtext }}>Trip (Optional)</InputLabel>
            <Select
              value={formData.trip_id || ''}
              onChange={(e) => onFormDataChange({ ...formData, trip_id: e.target.value ? Number(e.target.value) : null })}
              label="Trip (Optional)"
              sx={{
                color: colors.card_text,
                backgroundColor: colors.card_bg,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.4)}`,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.card_accent,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: colors.card_bg,
                    '& .MuiMenuItem-root': {
                      color: colors.card_text,
                      '&:hover': {
                        backgroundColor: hexToRgba(colors.card_text, 0.1),
                      },
                      '&.Mui-selected': {
                        backgroundColor: hexToRgba(colors.card_accent, 0.2),
                        '&:hover': {
                          backgroundColor: hexToRgba(colors.card_accent, 0.3),
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="" sx={{ color: colors.card_subtext }}>
                <em>No Trip</em>
              </MenuItem>
              {trips.map((trip) => (
                <MenuItem key={trip.trip_id} value={trip.trip_id} sx={{ color: colors.card_text }}>
                  {trip.trip_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!editingExpense && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={keepOpen}
                  onChange={(e) => onKeepOpenChange(e.target.checked)}
                  sx={{
                    color: colors.card_accent,
                    '&.Mui-checked': {
                      color: colors.card_accent,
                    },
                  }}
                />
              }
              label="Keep dialog open to add another expense"
              sx={{
                color: colors.card_text,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: editingExpense ? 'space-between' : 'flex-end' }}>
        {editingExpense && (
          <Button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this expense?')) {
                onDelete(editingExpense.transaction_id);
                onClose();
              }
            }}
            sx={{
              color: '#f44336',
              fontFamily: 'Inter, -apple-system, sans-serif',
              '&:hover': {
                backgroundColor: hexToRgba('#f44336', 0.1),
              },
            }}
          >
            Delete
          </Button>
        )}
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} sx={{ color: colors.card_subtext }}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={saving || !formData.merchant || !formData.category || formData.amount <= 0}
            sx={{
              backgroundColor: colors.card_accent,
              color: '#FFFFFF',
              fontFamily: 'Inter, -apple-system, sans-serif',
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.8),
              },
              '&:disabled': {
                backgroundColor: colors.card_subtext,
              },
            }}
          >
            {saving ? <CircularProgress size={20} /> : editingExpense ? 'Update' : 'Add'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

