import React from 'react';
import { Grid, Paper, Stack, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Metrics } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { getDashboardPalette } from '../../config/colorPalettes';
import { hexToRgba, getBorderOpacity } from './utils';

interface MetricsCardsProps {
  metrics: Metrics;
  selectedCurrency: string;
  colorPalette: string;
  momGrowth: { absolute: number; percent: number };
  monthlyExpense: number;
  emergencyMonths: number;
  emergencyFundMonthly: number;
  budgetStatus: { totalBudgeted: number; totalActual: number; remaining: number; isOverBudget: boolean; currency: string; color: string } | null;
  cashFlow: { moneyIn: number; moneyOut: number };
}

const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  selectedCurrency,
  colorPalette,
  momGrowth,
  monthlyExpense,
  emergencyMonths,
  emergencyFundMonthly,
  budgetStatus,
  cashFlow,
}) => {
  const colors = getDashboardPalette(colorPalette);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getCardStyles = (accentColor: string, hoverColor?: string) => ({
    background: colors.card_bg,
    borderRadius: 3,
    border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
    p: 2.5,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    cursor: accentColor === colors.card_accent ? 'pointer' : 'default',
    '&:hover': {
      borderColor: (hoverColor || accentColor) + '40',
      boxShadow: 2,
    },
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(isMobile && {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }),
  });

  const getLabelStyles = () => ({
    color: colors.card_subtext,
    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.8rem' },
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    mb: 0.5,
  });

  const getValueStyles = (color?: string) => ({
    color: color || colors.card_text,
    fontWeight: 600,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  });

  const getCaptionStyles = () => ({
    color: colors.card_subtext,
    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem' },
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    fontWeight: 400,
    mt: 0.5,
  });

  return (
    <Grid container spacing={2}>
      {/* Emergency Fund */}
      <Grid item xs={12} sm={6}>
        <Paper 
          elevation={0} 
          sx={getCardStyles(colors.card_accent)}
        >
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: '1.1rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 2,
            }}
          >
            Emergency Fund
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <Typography sx={getCaptionStyles()}>
              {currencyFormat(emergencyFundMonthly, selectedCurrency)}/mo
            </Typography>
            <Typography sx={getValueStyles()}>
              {emergencyMonths.toFixed(1)} mo
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Cash vs Investments */}
      <Grid item xs={12} sm={6}>
        <Paper 
          elevation={0} 
          sx={getCardStyles(colors.net_worth)}
        >
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: '1.1rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 2,
            }}
          >
            Allocation
          </Typography>
          
          {/* Custom Legend with amounts - Better spacing */}
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: colors.cash,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${hexToRgba(colors.cash, 0.2)}`,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.card_text,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Cash
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: colors.card_text,
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 700,
                }}
              >
                {currencyFormat(metrics.cash, selectedCurrency)}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: colors.investment,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${hexToRgba(colors.investment, 0.2)}`,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.card_text,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Investment
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: colors.card_text,
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 700,
                }}
              >
                {currencyFormat(metrics.investments, selectedCurrency)}
              </Typography>
            </Stack>
          </Stack>

          {/* Horizontal Bar Chart - At Bottom */}
          <Box
            sx={{
              width: '100%',
              height: 20,
              backgroundColor: hexToRgba(colors.card_subtext, 0.1),
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              mt: 1.5,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {[
              { value: metrics.cash, color: colors.cash, label: 'Cash' },
              { value: metrics.investments, color: colors.investment, label: 'Investment' },
            ].map((item, idx) => {
              const percentage = metrics.net_worth > 0 ? (item.value / metrics.net_worth) * 100 : 0;
              return (
                <Box
                  key={idx}
                  sx={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    transition: 'width 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:first-of-type': {
                      borderTopLeftRadius: 8,
                      borderBottomLeftRadius: 8,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                    },
                  }}
                >
                  {percentage > 15 && (
                    <Typography
                      sx={{
                        color: '#FFFFFF',
                        fontSize: '0.65rem',
                        fontFamily: 'Inter, -apple-system, sans-serif',
                        fontWeight: 600,
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {percentage.toFixed(0)}%
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Grid>

      {/* Budget Status & Amount Spent */}
      {budgetStatus && (
        <Grid item xs={12} sm={6}>
          <Paper 
            elevation={0} 
            sx={getCardStyles(budgetStatus.color)}
          >
            <Typography
              variant="h6"
              sx={{
                color: colors.card_text,
                fontWeight: 700,
                fontSize: '1.1rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                mb: 2,
              }}
            >
              Budget Status
            </Typography>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              <Box>
                <Typography sx={getCaptionStyles()}>
                  {budgetStatus.isOverBudget ? 'Overspent' : 'Remaining'}
                </Typography>
                <Typography sx={getValueStyles(budgetStatus.color)}>
                  {budgetStatus.isOverBudget ? '-' : ''}{currencyFormat(budgetStatus.remaining, budgetStatus.currency)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={getCaptionStyles()}>
                  Amount Spent
                </Typography>
                <Typography sx={getValueStyles()}>
                  {currencyFormat(budgetStatus.totalActual, budgetStatus.currency)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      )}

      {/* Cash Flow */}
      <Grid item xs={12} sm={6}>
        <Paper 
          elevation={0} 
          sx={getCardStyles(colors.card_accent)}
        >
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: '1.1rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 2,
            }}
          >
            Cash Flow
          </Typography>
          
          {/* Money In and Money Out Labels with Values */}
          <Stack spacing={1.5} sx={{ flex: 1, mb: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#10B981',
                    borderRadius: 1.5,
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${hexToRgba('#10B981', 0.2)}`,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.card_text,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Money In
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: colors.card_text,
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 700,
                }}
              >
                {currencyFormat(cashFlow.moneyIn, selectedCurrency)}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: '#EF4444',
                    borderRadius: 1.5,
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${hexToRgba('#EF4444', 0.2)}`,
                  }}
                />
                <Typography
                  sx={{
                    color: colors.card_text,
                    fontSize: '0.7rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Money Out
                </Typography>
              </Stack>
              <Typography
                sx={{
                  color: colors.card_text,
                  fontSize: '0.75rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 700,
                }}
              >
                {currencyFormat(cashFlow.moneyOut, selectedCurrency)}
              </Typography>
            </Stack>
          </Stack>

          {/* Horizontal Bar Chart - Two Bars Side by Side */}
          <Box
            sx={{
              width: '100%',
              height: 20,
              backgroundColor: hexToRgba(colors.card_subtext, 0.1),
              borderRadius: 2,
              overflow: 'hidden',
              display: 'flex',
              gap: 0.5,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {(() => {
              const maxValue = Math.max(cashFlow.moneyIn, cashFlow.moneyOut);
              const moneyInPercentage = maxValue > 0 ? (cashFlow.moneyIn / maxValue) * 100 : 0;
              const moneyOutPercentage = maxValue > 0 ? (cashFlow.moneyOut / maxValue) * 100 : 0;
              
              return (
                <>
                  <Box
                    sx={{
                      flex: moneyInPercentage,
                      height: '100%',
                      backgroundColor: '#10B981',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'flex 0.3s ease',
                    }}
                  >
                    {moneyInPercentage > 20 && (
                      <Typography
                        sx={{
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      >
                        {moneyInPercentage.toFixed(0)}%
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      flex: moneyOutPercentage,
                      height: '100%',
                      backgroundColor: '#EF4444',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'flex 0.3s ease',
                    }}
                  >
                    {moneyOutPercentage > 20 && (
                      <Typography
                        sx={{
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                      >
                        {moneyOutPercentage.toFixed(0)}%
                      </Typography>
                    )}
                  </Box>
                </>
              );
            })()}
          </Box>
        </Paper>
      </Grid>

    </Grid>
  );
};

export default MetricsCards;

