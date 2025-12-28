import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  IconButton,
  Box,
} from '@mui/material';
import { iconMap, availableIcons, hexToRgba } from './utils';

interface IconPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  colors: {
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
}

export const IconPickerDialog: React.FC<IconPickerDialogProps> = ({
  open,
  onClose,
  onSelect,
  colors,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
        Choose Icon
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {availableIcons.map((iconKey) => (
            <Grid item xs={3} sm={2} key={iconKey}>
              <IconButton
                onClick={() => {
                  onSelect(iconKey);
                  onClose();
                }}
                sx={{
                  width: 56,
                  height: 56,
                  border: `2px solid ${colors.card_subtext}30`,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: colors.card_accent,
                    backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  },
                }}
              >
                <Box sx={{ color: colors.card_text, fontSize: 28 }}>
                  {iconMap[iconKey]}
                </Box>
              </IconButton>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};



