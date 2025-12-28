import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { ViewList, ViewModule } from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity } from './utils';
import type { BudgetCategory } from './types';

interface BudgetMobileListProps {
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  categories: BudgetCategory[];
  chartView: 'all' | 'needs' | 'wants' | 'savings';
  budgetCurrency: string;
  colorPalette: string;
  onChartViewChange: (view: 'all' | 'needs' | 'wants' | 'savings') => void;
}

export const BudgetMobileList: React.FC<BudgetMobileListProps> = ({
  colors,
  categories,
  chartView,
  budgetCurrency,
  colorPalette,
  onChartViewChange,
}) => {
  const [viewMode, setViewMode] = useState<'expanded' | 'compressed'>('expanded');
  const [showPercentages, setShowPercentages] = useState(false);
  const isDarkMode = colorPalette === 'Dark Mode';
  
  // Category type colors
  const needsColor = isDarkMode ? '#60A5FA' : '#E53935';
  const wantsColor = isDarkMode ? '#10B981' : '#00897B';
  const savingsColor = isDarkMode ? '#F59E0B' : '#1976D2';

  // Calculate totals by type
  const totalsByType = React.useMemo(() => {
    const needs = categories.filter(c => c.type === 'needs').reduce((sum, c) => sum + c.budgeted, 0);
    const wants = categories.filter(c => c.type === 'wants').reduce((sum, c) => sum + c.budgeted, 0);
    const savings = categories.filter(c => c.type === 'savings').reduce((sum, c) => sum + c.budgeted, 0);
    const total = needs + wants + savings;
    return { needs, wants, savings, total };
  }, [categories]);

  // Filter categories based on chartView
  const filteredCategories = React.useMemo(() => {
    let filtered = categories;
    if (chartView === 'needs') {
      filtered = categories.filter(c => c.type === 'needs');
    } else if (chartView === 'wants') {
      filtered = categories.filter(c => c.type === 'wants');
    } else if (chartView === 'savings') {
      filtered = categories.filter(c => c.type === 'savings');
    }
    // Sort by amount descending
    return [...filtered].sort((a, b) => b.budgeted - a.budgeted);
  }, [categories, chartView]);

  // Calculate total for filtered categories
  const totalBudgeted = React.useMemo(() => {
    if (viewMode === 'compressed') {
      return totalsByType.total;
    }
    return filteredCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  }, [filteredCategories, viewMode, totalsByType]);

  const getCategoryColor = (type: 'needs' | 'wants' | 'savings') => {
    if (type === 'needs') return needsColor;
    if (type === 'wants') return wantsColor;
    return savingsColor;
  };

  // Compressed view data
  const compressedData = React.useMemo(() => {
    return [
      { name: 'Needs', amount: totalsByType.needs, type: 'needs' as const },
      { name: 'Wants', amount: totalsByType.wants, type: 'wants' as const },
      { name: 'Savings', amount: totalsByType.savings, type: 'savings' as const },
    ].sort((a, b) => b.amount - a.amount);
  }, [totalsByType]);

  const displayData = viewMode === 'compressed' ? compressedData : filteredCategories;
  const displayTotal = viewMode === 'compressed' ? totalsByType.total : totalBudgeted;

  if (displayData.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        background: colors.card_bg,
        borderRadius: 3,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Total Budgeted Header with Toggles */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 2,
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.75rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
                display: 'block',
              }}
            >
              Total Budgeted
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: colors.card_text,
                fontWeight: 700,
                fontSize: '1.75rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              {currencyFormat(displayTotal, budgetCurrency)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Percentage Toggle */}
            <IconButton
              size="small"
              onClick={() => setShowPercentages(!showPercentages)}
              sx={{
                color: showPercentages ? colors.card_accent : colors.card_subtext,
                p: 0.75,
                '&:hover': {
                  backgroundColor: `${colors.card_subtext}${getBorderOpacity(0.05)}`,
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                }}
              >
                %
              </Typography>
            </IconButton>
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode !== null) setViewMode(newMode);
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderColor: `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                  color: colors.card_text,
                  px: 1,
                  py: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: `${colors.card_accent}${getBorderOpacity(0.1)}`,
                    borderColor: colors.card_accent,
                    color: colors.card_accent,
                    '&:hover': {
                      backgroundColor: `${colors.card_accent}${getBorderOpacity(0.15)}`,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="expanded" aria-label="expanded view">
                <ViewList fontSize="small" />
              </ToggleButton>
              <ToggleButton value="compressed" aria-label="compressed view">
                <ViewModule fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Box>

      {/* Filter Buttons - Only show in expanded mode */}
      {viewMode === 'expanded' && (
        <Box
          sx={{
            px: 2.5,
            pb: 2,
          }}
        >
          <Stack direction="row" spacing={0.5}>
            {(['all', 'needs', 'wants', 'savings'] as const).map((view) => {
              const isSelected = chartView === view;
              return (
                <Button
                  key={view}
                  onClick={() => onChartViewChange(view)}
                  variant="outlined"
                  size="small"
                  sx={{
                    flex: 1,
                    borderColor: isSelected 
                      ? colors.card_accent 
                      : `${colors.card_subtext}${getBorderOpacity(0.2)}`,
                    color: isSelected ? colors.card_accent : colors.card_text,
                    backgroundColor: isSelected 
                      ? `${colors.card_accent}${getBorderOpacity(0.1)}` 
                      : 'transparent',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    py: 0.75,
                    '&:hover': {
                      borderColor: isSelected 
                        ? colors.card_accent 
                        : `${colors.card_subtext}${getBorderOpacity(0.3)}`,
                      backgroundColor: isSelected 
                        ? `${colors.card_accent}${getBorderOpacity(0.15)}` 
                        : `${colors.card_subtext}${getBorderOpacity(0.05)}`,
                    },
                  }}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Category List */}
      <Stack spacing={0}>
        {displayData.map((item, idx) => {
          // Handle both BudgetCategory and compressed data types
          const amount = 'budgeted' in item ? item.budgeted : item.amount;
          const name = item.name;
          const type = item.type;
          const percentage = displayTotal > 0 ? (amount / displayTotal) * 100 : 0;
          const categoryColor = getCategoryColor(type);
          const itemId = 'id' in item ? item.id : `${type}-${idx}`;
          
          return (
            <Box
              key={itemId}
              sx={{
                px: 2.5,
                py: 1.75,
                borderTop: `1px solid ${colors.card_subtext}${getBorderOpacity(0.08)}`,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: `${colors.card_subtext}${getBorderOpacity(0.03)}`,
                },
                transition: 'background-color 0.2s ease',
              }}
            >
              {/* Category Row Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.card_text,
                    fontSize: '0.9375rem',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                    fontWeight: 600,
                  }}
                >
                  {name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {showPercentages && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.card_subtext,
                        fontSize: '0.8125rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                        fontWeight: 500,
                      }}
                    >
                      {percentage.toFixed(1)}%
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.card_text,
                      fontSize: '0.9375rem',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                      fontWeight: 700,
                    }}
                  >
                    {currencyFormat(amount, budgetCurrency)}
                  </Typography>
                </Stack>
              </Stack>

              {/* Progress Indicator */}
              <Box
                sx={{
                  width: '100%',
                  height: 5,
                  backgroundColor: `${colors.card_subtext}${getBorderOpacity(0.1)}`,
                  borderRadius: 2.5,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: categoryColor,
                    borderRadius: 2.5,
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};



