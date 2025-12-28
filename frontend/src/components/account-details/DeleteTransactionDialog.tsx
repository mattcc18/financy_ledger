import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Transaction, Account } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { ExpenseTrackingColors } from '../expenses/types';
import { hexToRgba } from '../dashboard/utils';

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
  account: Account | null;
  deleting: boolean;
  colors: ExpenseTrackingColors;
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  transaction,
  account,
  deleting,
  colors,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: colors.card_bg,
          color: colors.card_text,
        },
      }}
    >
      <DialogTitle sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
        Delete Transaction
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </Typography>
        {transaction && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: hexToRgba(colors.card_subtext, 0.1), borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: colors.card_subtext, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              {new Date(transaction.transaction_date).toLocaleDateString()} •{' '}
              {transaction.transaction_type} • {currencyFormat(Math.abs(transaction.amount), account?.currency_code || 'EUR')}
            </Typography>
          </Box>
        )}
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
          onClick={onConfirm}
          variant="contained"
          disabled={deleting}
          sx={{
            backgroundColor: '#EF4444',
            '&:hover': {
              backgroundColor: '#DC2626',
            },
            '&.Mui-disabled': {
              backgroundColor: colors.card_subtext + '40',
            },
          }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

