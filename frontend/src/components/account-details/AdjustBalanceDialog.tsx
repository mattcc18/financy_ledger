import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import { Account, Balance } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { ExpenseTrackingColors } from '../expenses/types';
import { getBorderOpacity, hexToRgba } from '../dashboard/utils';

interface AdjustBalanceDialogProps {
  open: boolean;
  onClose: () => void;
  onAdjust: () => void;
  account: Account | null;
  currentBalance: Balance | null;
  formData: {
    actual_balance: string;
    transaction_date: string;
    description: string;
  };
  onFormDataChange: (data: Partial<AdjustBalanceDialogProps['formData']>) => void;
  saving: boolean;
  colors: ExpenseTrackingColors;
}

export const AdjustBalanceDialog: React.FC<AdjustBalanceDialogProps> = ({
  open,
  onClose,
  onAdjust,
  account,
  currentBalance,
  formData,
  onFormDataChange,
  saving,
  colors,
}) => {
  const actual = parseFloat(formData.actual_balance);
  const current = currentBalance?.balance || 0;
  const diff = actual - current;
  const diffFormatted = currencyFormat(Math.abs(diff), account?.currency_code || '');

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
        Adjust Investment Balance
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                mb: 1,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Current Balance (from transactions)
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: colors.card_text,
                fontWeight: 600,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              {account && currentBalance
                ? currencyFormat(currentBalance.balance, account.currency_code)
                : 'N/A'}
            </Typography>
          </Box>

          <TextField
            label="Actual Balance"
            type="number"
            fullWidth
            required
            value={formData.actual_balance}
            onChange={(e) => onFormDataChange({ actual_balance: e.target.value })}
            helperText={`Enter the actual balance from your investment account statement (${account?.currency_code || ''})`}
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

          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => onFormDataChange({ description: e.target.value })}
            placeholder="e.g., Market adjustment based on monthly statement"
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

          {formData.actual_balance && currentBalance && (
            <Box sx={{ p: 2, backgroundColor: hexToRgba(colors.card_accent, 0.1), borderRadius: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  mb: 0.5,
                }}
              >
                Adjustment Preview:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 600,
                }}
              >
                {diff > 0
                  ? `Market Gain: +${diffFormatted}`
                  : diff < 0
                  ? `Market Loss: -${diffFormatted}`
                  : 'No adjustment needed'}
              </Typography>
            </Box>
          )}
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
          onClick={onAdjust}
          variant="contained"
          disabled={saving || !formData.actual_balance}
          sx={{
            backgroundColor: colors.card_accent,
            '&:hover': {
              backgroundColor: colors.card_accent,
              opacity: 0.9,
            },
            '&:disabled': {
              backgroundColor: colors.card_subtext + getBorderOpacity(0.3),
              color: colors.card_subtext,
            },
          }}
        >
          {saving ? 'Adjusting...' : 'Adjust Balance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

