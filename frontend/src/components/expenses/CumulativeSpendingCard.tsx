import React from 'react';
import { Paper, Box, Typography, Stack } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors } from './types';

interface CumulativeSpendingCardProps {
  totalSpending: number;
  spendingOverTimeData: {
    dates: string[];
    amounts: number[];
  };
  displayCurrency: string;
  colors: ExpenseTrackingColors;
  colorPalette: string;
  spendingTrend?: {
    value: number;
    isPositive: boolean;
  } | null;
}

export const CumulativeSpendingCard: React.FC<CumulativeSpendingCardProps> = ({
  totalSpending,
  spendingOverTimeData,
  displayCurrency,
  colors,
  colorPalette,
  spendingTrend,
}) => {
  const lineColor = colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2';

  // Prepare data for Recharts
  const rechartsData = spendingOverTimeData.dates.map((date, index) => ({
    date: new Date(date),
    value: spendingOverTimeData.amounts[index],
    formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(lineColor, 0.05)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        p: 3,
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${hexToRgba(lineColor, 0.05)} 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      <Stack spacing={3}>
        {/* Header with title and total */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              color: colors.card_subtext,
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'Inter, -apple-system, sans-serif',
              mb: 0.5,
            }}
          >
            Cumulative Spending
          </Typography>
          <Typography
            variant="h3"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2rem' },
              fontFamily: 'Inter, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {currencyFormat(totalSpending, displayCurrency)}
          </Typography>
          
          {/* Trend Label */}
          {spendingTrend && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
              {spendingTrend.isPositive ? (
                <TrendingUp sx={{ fontSize: 14, color: '#EF4444' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 14, color: '#10B981' }} />
              )}
              <Typography
                sx={{
                  color: spendingTrend.isPositive ? '#EF4444' : '#10B981',
                  fontSize: '0.875rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontWeight: 500,
                }}
              >
                {spendingTrend.value.toFixed(1)}% vs previous period
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Line Graph */}
        {rechartsData.length > 0 && (
          <Box sx={{ mt: 3, pt: 1, height: 250, position: 'relative', zIndex: 1 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rechartsData}>
                <defs>
                  <linearGradient id="cumulativeSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={lineColor} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={hexToRgba(colors.card_subtext, 0.1)} opacity={0.3} />
                <XAxis 
                  dataKey="formattedDate"
                  stroke={hexToRgba(colors.card_subtext, 0.3)}
                  style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, -apple-system, sans-serif' }}
                  tick={{ fill: colors.card_subtext }}
                />
                <YAxis 
                  stroke={hexToRgba(colors.card_subtext, 0.3)}
                  style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, -apple-system, sans-serif' }}
                  tick={{ fill: colors.card_subtext }}
                  tickFormatter={(value) => {
                    // Format large numbers with K, M, etc.
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return value.toFixed(0);
                  }}
                />
                <Area
                  type="linear"
                  dataKey="value"
                  stroke="none"
                  fill={`url(#cumulativeSpendingGradient)`}
                  fillOpacity={1}
                  baseValue={0}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                  activeDot={false}
                  hide
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: colors.card_bg,
                    border: `1px solid ${hexToRgba(colors.card_subtext, 0.2)}`,
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    color: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => currencyFormat(value, displayCurrency)}
                  labelStyle={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}
                  trigger={['hover', 'click']}
                  filterNull={false}
                  content={(props) => {
                    if (!props.active || !props.payload || props.payload.length === 0) return null;
                    const linePayload = props.payload.find((entry: any) => 
                      entry.dataKey === 'value' && entry.stroke && entry.stroke === lineColor
                    ) || props.payload.find((entry: any) => 
                      entry.dataKey === 'value' && entry.stroke && entry.stroke !== 'none'
                    ) || props.payload[0];
                    
                    if (!linePayload || linePayload.value === undefined || linePayload.value === null) return null;
                    
                    return (
                      <Box
                        sx={{
                          backgroundColor: colors.card_bg,
                          border: `1px solid ${hexToRgba(colors.card_subtext, 0.2)}`,
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          p: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            color: colors.card_text,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontSize: '12px',
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {props.label}
                        </Typography>
                        <Typography
                          sx={{
                            color: colors.card_text,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            fontSize: '12px',
                          }}
                        >
                          {currencyFormat(linePayload.value as number, displayCurrency)}
                        </Typography>
                      </Box>
                    );
                  }}
                />
                <Line 
                  type="linear" 
                  dataKey="value" 
                  stroke={lineColor} 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};



