import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { getDashboardPalette } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';

interface BudgetDialogsProps {
  newBudgetDialogOpen: boolean;
  renameBudgetDialogOpen: boolean;
  newBudgetName: string;
  renameBudgetName: string;
  newBudgetCurrency: string;
  renameBudgetCurrency: string;
  creatingBudget: boolean;
  error: string | null;
  onNewBudgetClose: () => void;
  onRenameBudgetClose: () => void;
  onNewBudgetNameChange: (name: string) => void;
  onRenameBudgetNameChange: (name: string) => void;
  onNewBudgetCurrencyChange: (currency: string) => void;
  onRenameBudgetCurrencyChange: (currency: string) => void;
  onCreateBudget: (e?: React.MouseEvent) => void;
  onRenameBudget: () => void;
  onErrorClear: () => void;
}

export const BudgetDialogs: React.FC<BudgetDialogsProps> = ({
  newBudgetDialogOpen,
  renameBudgetDialogOpen,
  newBudgetName,
  renameBudgetName,
  newBudgetCurrency,
  renameBudgetCurrency,
  creatingBudget,
  error,
  onNewBudgetClose,
  onRenameBudgetClose,
  onNewBudgetNameChange,
  onRenameBudgetNameChange,
  onNewBudgetCurrencyChange,
  onRenameBudgetCurrencyChange,
  onCreateBudget,
  onRenameBudget,
  onErrorClear,
}) => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

  return (
    <>
      {/* New Budget Dialog */}
      <Dialog
        open={newBudgetDialogOpen}
        onClose={() => {
          if (!creatingBudget) {
            onNewBudgetClose();
          }
        }}
        PaperProps={{
          sx: {
            backgroundColor: colors.card_bg,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_text }}>
          Create New Budget
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontFamily: 'Inter, -apple-system, sans-serif' }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Budget Name"
              fullWidth
              variant="outlined"
              value={newBudgetName}
              onChange={(e) => {
                onNewBudgetNameChange(e.target.value);
                onErrorClear();
              }}
              placeholder={`Budget ${new Date().getFullYear()}`}
              disabled={creatingBudget}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !creatingBudget) {
                  onCreateBudget();
                }
              }}
              sx={{
                fontFamily: 'Inter, -apple-system, sans-serif',
                '& .MuiOutlinedInput-root': {
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
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
            <FormControl fullWidth margin="dense">
              <InputLabel sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_subtext }}>Currency</InputLabel>
              <Select
                value={newBudgetCurrency}
                onChange={(e) => onNewBudgetCurrencyChange(e.target.value)}
                label="Currency"
                disabled={creatingBudget}
                sx={{
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: colors.card_text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_subtext + '40',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_subtext + '60',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_accent,
                  },
                }}
              >
                <MenuItem value="EUR" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>EUR</MenuItem>
                <MenuItem value="GBP" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>GBP</MenuItem>
                <MenuItem value="USD" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>USD</MenuItem>
                <MenuItem value="CHF" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>CHF</MenuItem>
                <MenuItem value="CAD" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>CAD</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            type="button"
            onClick={() => {
              onNewBudgetClose();
            }}
            disabled={creatingBudget}
            sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_text }}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCreateBudget(e);
            }}
            variant="contained"
            disabled={creatingBudget}
            sx={{
              fontFamily: 'Inter, -apple-system, sans-serif',
              backgroundColor: colors.card_accent,
              '&:hover': {
                backgroundColor: colors.card_accent,
                opacity: 0.9,
              },
            }}
          >
            {creatingBudget ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Budget Dialog */}
      <Dialog
        open={renameBudgetDialogOpen}
        onClose={onRenameBudgetClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.card_bg,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_text }}>
          Edit Budget
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Budget Name"
              fullWidth
              variant="outlined"
              value={renameBudgetName}
              onChange={(e) => onRenameBudgetNameChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onRenameBudget();
                }
              }}
              sx={{
                fontFamily: 'Inter, -apple-system, sans-serif',
                '& .MuiOutlinedInput-root': {
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
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
            <FormControl fullWidth margin="dense">
              <InputLabel sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_subtext }}>Currency</InputLabel>
              <Select
                value={renameBudgetCurrency}
                onChange={(e) => onRenameBudgetCurrencyChange(e.target.value)}
                label="Currency"
                sx={{
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: colors.card_text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_subtext + '40',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_subtext + '60',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.card_accent,
                  },
                }}
              >
                <MenuItem value="EUR" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>EUR</MenuItem>
                <MenuItem value="GBP" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>GBP</MenuItem>
                <MenuItem value="USD" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>USD</MenuItem>
                <MenuItem value="CHF" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>CHF</MenuItem>
                <MenuItem value="CAD" sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>CAD</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={onRenameBudgetClose}
            sx={{ fontFamily: 'Inter, -apple-system, sans-serif', color: colors.card_text }}
          >
            Cancel
          </Button>
          <Button 
            onClick={onRenameBudget}
            variant="contained"
            sx={{
              fontFamily: 'Inter, -apple-system, sans-serif',
              backgroundColor: colors.card_accent,
              '&:hover': {
                backgroundColor: colors.card_accent,
                opacity: 0.9,
              },
            }}
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};



