import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Menu as MenuIcon } from '@mui/icons-material';
import { PALETTE_TEXT_COLORS, PALETTE_SUBTEXT_COLORS } from '../../config/colorPalettes';
import { hexToRgba } from './utils';
import { Budget as ApiBudget } from '../../services/api';

interface BudgetHeaderProps {
  colorPalette: string;
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  budgets: ApiBudget[];
  selectedBudgetId: number | '';
  budgetCurrency: string;
  onBudgetChange: (budgetId: number) => void;
  onRenameClick: () => void;
  onNewBudgetClick: () => void;
  onDeleteClick: () => void;
  getBorderOpacity: (opacity: number) => string;
}

export const BudgetHeader: React.FC<BudgetHeaderProps> = ({
  colorPalette,
  colors,
  budgets,
  selectedBudgetId,
  budgetCurrency,
  onBudgetChange,
  onRenameClick,
  onNewBudgetClick,
  onDeleteClick,
  getBorderOpacity,
}) => {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: PALETTE_TEXT_COLORS[colorPalette],
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, -apple-system, sans-serif',
              background: `linear-gradient(135deg, ${PALETTE_TEXT_COLORS[colorPalette]} 0%, ${colors.card_accent} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Budget Planner
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: PALETTE_SUBTEXT_COLORS[colorPalette],
              fontSize: '1rem',
              fontWeight: 400,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Plan your monthly income and expenses
          </Typography>
        </Box>

        {/* Mobile Menu Button */}
        {isMobile ? (
          <>
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{
                backgroundColor: colors.card_bg,
                border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                color: colors.card_text,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  borderColor: colors.card_accent + '40',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchorEl}
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: colors.card_bg,
                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  minWidth: 200,
                  mt: 1,
                },
              }}
            >
              {/* Budget Selector in Menu */}
              <MenuItem disabled sx={{ color: colors.card_subtext, fontSize: '0.75rem', fontWeight: 600 }}>
                Budget
              </MenuItem>
              {budgets.map((budget) => (
                <MenuItem
                  key={budget.budget_id}
                  selected={selectedBudgetId === budget.budget_id}
                  onClick={() => {
                    onBudgetChange(budget.budget_id);
                    handleMobileMenuClose();
                  }}
                  sx={{
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '&.Mui-selected': {
                      backgroundColor: hexToRgba(colors.card_accent, 0.1),
                      color: colors.card_accent,
                    },
                    '&:hover': {
                      backgroundColor: hexToRgba(colors.card_accent, 0.05),
                    },
                  }}
                >
                  {budget.name}
                </MenuItem>
              ))}
              
              <Divider sx={{ my: 1, borderColor: colors.card_subtext + '20' }} />
              
              {/* Edit */}
              <MenuItem
                onClick={() => {
                  handleMobileMenuClose();
                  onRenameClick();
                }}
                sx={{
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  '&:hover': {
                    backgroundColor: hexToRgba(colors.card_accent, 0.1),
                  },
                }}
              >
                <Edit sx={{ mr: 1, fontSize: '1.2rem' }} />
                Edit Budget
              </MenuItem>
              
              {/* Add */}
              <MenuItem
                onClick={() => {
                  handleMobileMenuClose();
                  onNewBudgetClick();
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
                New Budget
              </MenuItem>
              
              {/* Delete */}
              {budgets.length > 1 && (
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    onDeleteClick();
                  }}
                  sx={{
                    color: '#F44336',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    '&:hover': {
                      backgroundColor: hexToRgba('#F44336', 0.1),
                    },
                  }}
                >
                  <Delete sx={{ mr: 1, fontSize: '1.2rem' }} />
                  Delete Budget
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          /* Desktop View - Budget Selector and Actions */
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FormControl 
              variant="outlined" 
              size="small"
              sx={{ 
                minWidth: { xs: 150, sm: 200 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colors.card_bg,
                  '& fieldset': {
                    borderColor: `${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.card_accent + '40',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.card_accent,
                  },
                },
              }}
            >
              <InputLabel sx={{ color: colors.card_subtext, fontFamily: 'Inter, -apple-system, sans-serif' }}>
                Budget
              </InputLabel>
              <Select
                value={selectedBudgetId || ''}
                onChange={(e) => onBudgetChange(e.target.value as number)}
                label="Budget"
                sx={{
                  color: colors.card_text,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  '& .MuiSelect-icon': {
                    color: colors.card_subtext,
                  },
                }}
              >
                {budgets.map((budget) => (
                  <MenuItem 
                    key={budget.budget_id} 
                    value={budget.budget_id}
                    sx={{ fontFamily: 'Inter, -apple-system, sans-serif' }}
                  >
                    {budget.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              onClick={onRenameClick}
              sx={{
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
                color: colors.card_accent,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_accent, 0.2),
                },
              }}
            >
              <Edit />
            </IconButton>
            <IconButton
              onClick={onNewBudgetClick}
              sx={{
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
                color: colors.card_accent,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_accent, 0.2),
                },
              }}
            >
              <Add />
            </IconButton>
            {budgets.length > 1 && (
              <IconButton
                onClick={onDeleteClick}
                sx={{
                  backgroundColor: hexToRgba('#F44336', 0.1),
                  color: '#F44336',
                  '&:hover': {
                    backgroundColor: hexToRgba('#F44336', 0.2),
                  },
                }}
              >
                <Delete />
              </IconButton>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};



