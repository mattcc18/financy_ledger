import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { getDashboardPalette } from '../../../config/colorPalettes';

interface ExpenseDialogProps {
  open: boolean;
  value: string;
  selectedCurrency: string;
  colorPalette: string;
  onClose: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
}

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  open,
  value,
  selectedCurrency,
  colorPalette,
  onClose,
  onSave,
  onValueChange,
}) => {
  const colors = getDashboardPalette(colorPalette);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: colors.card_bg,
          borderRadius: 3,
          minWidth: 400,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: colors.card_text,
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontWeight: 600,
          pb: 1,
        }}
      >
        Set Monthly Expense
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label={`Monthly Expense (${selectedCurrency})`}
          type="number"
          fullWidth
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          variant="outlined"
          sx={{
            mt: 2,
            '& .MuiOutlinedInput-root': {
              color: colors.card_text,
              '& fieldset': {
                borderColor: colors.card_subtext + '40',
              },
              '&:hover fieldset': {
                borderColor: colors.card_subtext + '60',
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
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 2,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: colors.card_subtext,
            fontFamily: 'Inter, -apple-system, sans-serif',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{
            backgroundColor: colors.card_accent,
            color: colors.card_bg,
            fontFamily: 'Inter, -apple-system, sans-serif',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: colors.card_accent,
              opacity: 0.9,
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseDialog;



