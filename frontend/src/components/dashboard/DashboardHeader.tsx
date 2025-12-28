import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Menu,
  Divider,
  useMediaQuery,
  useTheme as useMUITheme,
} from '@mui/material';
import { Add, FilterList } from '@mui/icons-material';
import { Budget } from '../../services/api';
import { getDashboardPalette, PALETTE_TEXT_COLORS, PALETTE_SUBTEXT_COLORS } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { hexToRgba, getBorderOpacity } from './utils';

interface DashboardHeaderProps {
  budgets: Budget[];
  selectedBudgetId: string;
  onBudgetChange: (budgetId: string) => void;
  currencies: string[];
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => Promise<void>;
  currencyLoading: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  budgets,
  selectedBudgetId,
  onBudgetChange,
  currencies,
  selectedCurrency,
  onCurrencyChange,
  currencyLoading,
}) => {
  const { colorPalette } = useTheme();
  const { formatDateForDisplay } = useDashboard();
  const colors = getDashboardPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency !== selectedCurrency) {
      await onCurrencyChange(newCurrency);
    }
    setMobileMenuAnchorEl(null);
  };

  const handleBudgetChange = (budgetId: string) => {
    onBudgetChange(budgetId);
    setMobileMenuAnchorEl(null);
  };

  return (
    <Box sx={{ mb: 2, mt: { xs: 0, sm: 0.5, md: 0.5 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: PALETTE_TEXT_COLORS[colorPalette],
              fontWeight: 700,
              mb: { xs: 0.25, md: 0.5 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, -apple-system, sans-serif',
              background: `linear-gradient(135deg, ${PALETTE_TEXT_COLORS[colorPalette]} 0%, ${colors.card_accent} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome, Matthew
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: PALETTE_SUBTEXT_COLORS[colorPalette],
              fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
              fontWeight: 400,
              fontFamily: 'Inter, -apple-system, sans-serif',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Here's your financial overview
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
          {/* Mobile Menu Button */}
          {isMobile ? (
            <>
              <IconButton
                onClick={(e) => setMobileMenuAnchorEl(e.currentTarget)}
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
                <FilterList />
              </IconButton>
              <Menu
                anchorEl={mobileMenuAnchorEl}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={() => setMobileMenuAnchorEl(null)}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.card_bg,
                    border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                    minWidth: 200,
                    mt: 1,
                  },
                }}
              >
                {/* Currency in Menu */}
                {currencies.length > 0 && (
                  <>
                    <MenuItem disabled sx={{ color: colors.card_subtext, fontSize: '0.75rem', fontWeight: 600 }}>
                      Currency
                    </MenuItem>
                    {currencies.map((curr) => (
                      <MenuItem
                        key={curr}
                        selected={selectedCurrency === curr}
                        onClick={() => handleCurrencyChange(curr)}
                        disabled={currencyLoading}
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
                        {curr}
                      </MenuItem>
                    ))}
                  </>
                )}
                
                {/* Budget Selector in Menu */}
                {budgets.length > 0 && (
                  <>
                    <Divider sx={{ my: 1, borderColor: colors.card_subtext + '20' }} />
                    <MenuItem disabled sx={{ color: colors.card_subtext, fontSize: '0.75rem', fontWeight: 600 }}>
                      Budget
                    </MenuItem>
                    <MenuItem
                      selected={selectedBudgetId === ''}
                      onClick={() => handleBudgetChange('')}
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
                      None
                    </MenuItem>
                    {budgets.map((budget) => (
                      <MenuItem
                        key={budget.budget_id}
                        selected={selectedBudgetId === String(budget.budget_id)}
                        onClick={() => handleBudgetChange(String(budget.budget_id))}
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
                  </>
                )}
                
                {/* Add Data in Menu */}
                <Divider sx={{ my: 1, borderColor: colors.card_subtext + '20' }} />
                <MenuItem
                  component={Link}
                  to="/data-entry"
                  onClick={() => setMobileMenuAnchorEl(null)}
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
                  Add Data
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {/* Desktop Currency Selector */}
              {currencies.length > 0 && (
                <FormControl 
                  size="small"
                  sx={{
                    minWidth: 100,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: colors.card_bg,
                      height: 40,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      '&:hover': {
                        borderColor: colors.card_accent + '40',
                      },
                      '&.Mui-focused': {
                        borderColor: colors.card_accent,
                      },
                    },
                  }}
                >
                  <InputLabel 
                    sx={{
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      color: colors.card_subtext,
                      fontSize: '0.875rem',
                    }}
                  >
                    Currency
                  </InputLabel>
                  <Select
                    value={selectedCurrency}
                    label="Currency"
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    disabled={currencyLoading}
                    sx={{
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      color: colors.card_text,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '& .MuiSvgIcon-root': {
                        color: colors.card_subtext,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: colors.card_bg,
                          border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                          '& .MuiMenuItem-root': {
                            color: colors.card_text,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            },
                          },
                        },
                      },
                    }}
                  >
                    {currencies.map((curr) => (
                      <MenuItem key={curr} value={curr}>{curr}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {/* Budget Selector */}
              {budgets.length > 0 && (
                <FormControl 
                  size="small"
                  sx={{
                    minWidth: 150,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: colors.card_bg,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      height: 40,
                      '&:hover': {
                        borderColor: colors.card_accent + '40',
                      },
                    },
                  }}
                >
                  <InputLabel sx={{ color: colors.card_subtext, fontSize: '0.875rem' }}>
                    Budget
                  </InputLabel>
                  <Select
                    value={selectedBudgetId}
                    label="Budget"
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    sx={{
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      color: colors.card_text,
                      fontSize: '0.875rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '& .MuiSvgIcon-root': {
                        color: colors.card_subtext,
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: colors.card_bg,
                          border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                          '& .MuiMenuItem-root': {
                            color: colors.card_text,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            '&:hover': {
                              backgroundColor: hexToRgba(colors.card_accent, 0.1),
                            },
                          },
                        },
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
              )}
              
              {/* Current Date Display */}
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_subtext,
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: colors.card_bg,
                  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                As of {formatDateForDisplay(new Date().toISOString().split('T')[0])}
              </Typography>
              
              {/* Add Data Button */}
              <Button
                component={Link}
                to="/data-entry"
                variant="contained"
                startIcon={<Add />}
                sx={{
                  backgroundColor: colors.card_accent,
                  color: '#fff',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  height: 40,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: colors.card_accent,
                    opacity: 0.9,
                  },
                }}
              >
                Add Data
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default DashboardHeader;

