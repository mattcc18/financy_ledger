import React from 'react';
import { Stack, Box, Typography, IconButton, Button, Menu, MenuItem, FormControl, InputLabel, Select, Divider, TextField, InputAdornment } from '@mui/material';
import { Add, Menu as MenuIcon, CalendarToday, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors, Budget } from './types';
import { PALETTE_TEXT_COLORS, PALETTE_SUBTEXT_COLORS } from '../../config/colorPalettes';

interface ExpenseTrackingHeaderProps {
  colors: ExpenseTrackingColors;
  colorPalette: string;
  displayCurrency: string;
  budgets: Budget[];
  comparisonBudgetId: string | null;
  filterStartDate: string;
  filterEndDate: string;
  onCurrencyChange: (currency: string) => void;
  onBudgetSelect: (budgetId: string | null) => void;
  onAddExpense: () => void;
  onFilterStartDateChange: (date: string) => void;
  onFilterEndDateChange: (date: string) => void;
}

export const ExpenseTrackingHeader: React.FC<ExpenseTrackingHeaderProps> = ({
  colors,
  colorPalette,
  displayCurrency,
  budgets,
  comparisonBudgetId,
  filterStartDate,
  filterEndDate,
  onCurrencyChange,
  onBudgetSelect,
  onAddExpense,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onPreviousMonth,
  onNextMonth,
}) => {
  const [settingsAnchor, setSettingsAnchor] = React.useState<null | HTMLElement>(null);

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }} flexWrap="wrap" spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                color: PALETTE_TEXT_COLORS[colorPalette],
                fontWeight: 700,
                fontSize: { xs: '2rem', sm: '2.5rem' },
                letterSpacing: '-0.02em',
                fontFamily: 'Inter, -apple-system, sans-serif',
                background: `linear-gradient(135deg, ${PALETTE_TEXT_COLORS[colorPalette]} 0%, ${colors.card_accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                flex: 1,
              }}
            >
              Expense Tracker
            </Typography>
            <IconButton
              onClick={(e) => setSettingsAnchor(e.currentTarget)}
              sx={{
                backgroundColor: colors.card_bg,
                border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                color: colors.card_text,
                ml: 1,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  borderColor: colors.card_accent + '40',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
          <Typography
            variant="body1"
            sx={{
              color: PALETTE_SUBTEXT_COLORS[colorPalette],
              fontSize: '1rem',
              fontWeight: 400,
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 1.5,
            }}
          >
            Track and analyze your spending
          </Typography>
        </Box>
      </Stack>
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: colors.card_bg,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onAddExpense();
            setSettingsAnchor(null);
          }}
          sx={{
            color: colors.card_accent,
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: hexToRgba(colors.card_accent, 0.1),
            },
          }}
        >
          <Add sx={{ mr: 1, fontSize: '1.2rem' }} />
          Add Expense
        </MenuItem>
        <Divider sx={{ borderColor: colors.card_subtext + '20' }} />
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              color: colors.card_text,
              fontWeight: 600,
              fontSize: '0.75rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Filter Preferences
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: colors.card_subtext }}>Currency</InputLabel>
              <Select
                value={displayCurrency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                label="Currency"
                sx={{
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  },
                }}
              >
                {['GBP', 'EUR', 'USD', 'CHF', 'CAD'].map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: colors.card_subtext }}>Budget</InputLabel>
              <Select
                value={comparisonBudgetId || ''}
                onChange={(e) => onBudgetSelect(e.target.value || null)}
                label="Budget"
                sx={{
                  color: colors.card_text,
                  backgroundColor: colors.card_bg,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  },
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {budgets.map((budget) => (
                  <MenuItem key={budget.budget_id} value={String(budget.budget_id)}>
                    {budget.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Divider sx={{ borderColor: colors.card_subtext + '20', my: 1 }} />
            <Typography
              sx={{
                color: colors.card_text,
                fontWeight: 600,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                mb: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Date Range
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography
                  sx={{
                    color: colors.card_subtext,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    mb: 0.5,
                    fontWeight: 500,
                  }}
                >
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => onFilterStartDateChange(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 18, color: colors.card_subtext }} />
                      </Box>
                    ),
                  }}
                  inputProps={{
                    sx: {
                      color: colors.card_text,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      cursor: 'pointer',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colors.card_bg,
                      cursor: 'pointer',
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
                  }}
                />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: colors.card_subtext,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    mb: 0.5,
                    fontWeight: 500,
                  }}
                >
                  End Date
                </Typography>
                <TextField
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => onFilterEndDateChange(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 18, color: colors.card_subtext }} />
                      </Box>
                    ),
                  }}
                  inputProps={{
                    sx: {
                      color: colors.card_text,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      cursor: 'pointer',
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colors.card_bg,
                      cursor: 'pointer',
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
                  }}
                />
              </Box>
            </Stack>
            {(filterStartDate || filterEndDate) && (
              <Button
                size="small"
                onClick={() => {
                  onFilterStartDateChange('');
                  onFilterEndDateChange('');
                }}
                sx={{
                  mt: 1,
                  color: colors.card_subtext,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.1),
                    color: colors.card_accent,
                  },
                }}
              >
                Clear Date Range
              </Button>
            )}
          </Stack>
        </Box>
      </Menu>
    </Box>
  );
};



