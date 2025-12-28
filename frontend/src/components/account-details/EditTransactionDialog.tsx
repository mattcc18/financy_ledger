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
} from '@mui/material';
import { Transaction, Trip } from '../../services/api';
import { ExpenseTrackingColors } from '../expenses/types';
import { getBorderOpacity, hexToRgba } from '../dashboard/utils';

interface EditTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  transaction: Transaction | null;
  trips: Trip[];
  categories: string[];
  formData: {
    amount: string;
    category: string;
    transaction_date: string;
    description: string;
    merchant: string;
    trip_id: string;
  };
  onFormDataChange: (data: Partial<EditTransactionDialogProps['formData']>) => void;
  saving: boolean;
  colors: ExpenseTrackingColors;
}

export const EditTransactionDialog: React.FC<EditTransactionDialogProps> = ({
  open,
  onClose,
  onSave,
  transaction,
  trips,
  categories,
  formData,
  onFormDataChange,
  saving,
  colors,
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
        Edit Transaction
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Amount"
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

          {categories.length > 0 && (
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
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {(transaction?.transaction_type === 'expense' || transaction?.transaction_type === 'income') && (
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
          )}

          {transaction?.transaction_type === 'expense' && (
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
          onClick={onSave}
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
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

