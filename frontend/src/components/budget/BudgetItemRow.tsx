import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Stack,
  Box,
  Divider,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { getIconForCategory, getIconForIncomeSource, hexToRgba, getBorderOpacity } from './utils';
import { BudgetCategory, IncomeSource } from './types';

interface BudgetItemRowProps {
  item: BudgetCategory | IncomeSource;
  index: number;
  isEditing: boolean;
  isEditingName: boolean;
  isEditingAmount: boolean;
  editValue: string;
  colors: {
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  accentColor: string;
  budgetCurrency: string;
  onNameClick: () => void;
  onAmountClick: () => void;
  onIconClick: () => void;
  onDelete: () => void;
  onEditChange: (value: string) => void;
  onEditBlur: () => void;
  onEditKeyPress: (e: React.KeyboardEvent) => void;
  canDelete: boolean;
  isIncome?: boolean;
}

export const BudgetItemRow: React.FC<BudgetItemRowProps> = ({
  item,
  index,
  isEditing,
  isEditingName,
  isEditingAmount,
  editValue,
  colors,
  accentColor,
  budgetCurrency,
  onNameClick,
  onAmountClick,
  onIconClick,
  onDelete,
  onEditChange,
  onEditBlur,
  onEditKeyPress,
  canDelete,
  isIncome = false,
}) => {
  const getIcon = () => {
    if (isIncome) {
      return getIconForIncomeSource(item as IncomeSource);
    }
    return getIconForCategory(item as BudgetCategory);
  };

  const getAmount = () => {
    if (isIncome) {
      return (item as IncomeSource).amount;
    }
    return (item as BudgetCategory).budgeted;
  };

  return (
    <React.Fragment>
      {index > 0 && <Divider sx={{ borderColor: `${colors.card_subtext}${getBorderOpacity(0.1)}` }} />}
      <ListItem
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          '&:hover': {
            backgroundColor: hexToRgba(colors.card_text, 0.03),
          },
          transition: 'background-color 0.2s ease',
        }}
      >
        {/* Icon */}
        <IconButton
          onClick={onIconClick}
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: hexToRgba(accentColor, 0.1),
            color: accentColor,
            mr: 1.5,
            p: 0,
            '&:hover': {
              backgroundColor: hexToRgba(accentColor, 0.2),
            },
          }}
        >
          <Box sx={{ fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getIcon()}
          </Box>
        </IconButton>

        {/* Name */}
        <ListItemText
          primary={
            isEditingName ? (
              <TextField
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onEditBlur}
                onKeyPress={onEditKeyPress}
                autoFocus
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  },
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    '&:before': { display: 'none' },
                    '&:after': { display: 'none' },
                  },
                }}
              />
            ) : (
              <Typography
                onClick={onNameClick}
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '1rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  cursor: 'text',
                }}
              >
                {item.name}
              </Typography>
            )
          }
        />

        {/* Amount */}
        <ListItemSecondaryAction>
          {isEditingAmount ? (
            <TextField
              type="number"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditBlur}
              onKeyPress={onEditKeyPress}
              autoFocus
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  textAlign: 'right',
                  width: 100,
                },
              }}
              sx={{
                '& .MuiInputBase-root': {
                  '&:before': { display: 'none' },
                  '&:after': { display: 'none' },
                },
              }}
            />
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                onClick={onAmountClick}
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '1rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  cursor: 'text',
                }}
              >
                {currencyFormat(getAmount(), budgetCurrency).replace(budgetCurrency, '').trim()}
              </Typography>
              {canDelete && (
                <IconButton
                  size="small"
                  onClick={onDelete}
                  sx={{
                    color: colors.card_subtext,
                    '&:hover': {
                      color: '#F44336',
                      backgroundColor: '#F4433620',
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Stack>
          )}
        </ListItemSecondaryAction>
      </ListItem>
    </React.Fragment>
  );
};



