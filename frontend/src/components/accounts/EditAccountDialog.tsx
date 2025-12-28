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
import { Account } from '../../services/api';
import { getDashboardPalette } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgba } from '../dashboard/utils';

interface EditAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  account: Partial<Account>;
  onAccountChange: (account: Partial<Account>) => void;
  initialBalance: number | null;
  onInitialBalanceChange: (balance: number | null) => void;
  initialBalanceDate: string;
  onInitialBalanceDateChange: (date: string) => void;
  availableAccountTypes: string[];
}

const EditAccountDialog: React.FC<EditAccountDialogProps> = ({
  open,
  onClose,
  onSave,
  account,
  onAccountChange,
  initialBalance,
  onInitialBalanceChange,
  initialBalanceDate,
  onInitialBalanceDateChange,
  availableAccountTypes,
}) => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

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
        Edit Account
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Account Name"
            value={account.account_name || ''}
            onChange={(e) => onAccountChange({ ...account, account_name: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
              },
            }}
          />
          <TextField
            fullWidth
            label="Institution"
            value={account.institution || ''}
            onChange={(e) => onAccountChange({ ...account, institution: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
              },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.card_subtext }}>Account Type</InputLabel>
            <Select
              value={account.account_type || ''}
              onChange={(e) => onAccountChange({ ...account, account_type: e.target.value })}
              label="Account Type"
              sx={{
                color: colors.card_text,
                backgroundColor: colors.card_bg,
              }}
            >
              {availableAccountTypes.length > 0 ? (
                availableAccountTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem value="Current">Current</MenuItem>
                  <MenuItem value="Savings">Savings</MenuItem>
                  <MenuItem value="Investment">Investment</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Checking">Checking</MenuItem>
                  <MenuItem value="Pension">Pension</MenuItem>
                  <MenuItem value="Crypto">Crypto</MenuItem>
                  <MenuItem value="Stocks">Stocks</MenuItem>
                </>
              )}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.card_subtext }}>Currency</InputLabel>
            <Select
              value={account.currency_code || ''}
              onChange={(e) => onAccountChange({ ...account, currency_code: e.target.value })}
              label="Currency"
              sx={{
                color: colors.card_text,
                backgroundColor: colors.card_bg,
              }}
            >
              <MenuItem value="EUR">EUR</MenuItem>
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="CHF">CHF</MenuItem>
              <MenuItem value="CAD">CAD</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Initial Balance (Optional)"
            type="number"
            value={initialBalance !== null ? initialBalance : ''}
            onChange={(e) => {
              const value = e.target.value === '' ? null : parseFloat(e.target.value);
              onInitialBalanceChange(value);
            }}
            helperText="Set the starting balance for this account"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.card_text,
                backgroundColor: colors.card_bg,
              },
            }}
          />
          {initialBalance !== null && (
            <TextField
              fullWidth
              label="Initial Balance Date"
              type="date"
              value={initialBalanceDate}
              onChange={(e) => onInitialBalanceDateChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                },
              }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: colors.card_subtext }}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          type="button"
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
  );
};

export default EditAccountDialog;

