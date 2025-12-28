import React, { useState } from 'react';
import { Paper, Box, Typography, Stack, FormControl, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { currencyFormat } from '../../utils/formatting';
import { getDashboardPalette } from '../../config/colorPalettes';
import { hexToRgba, getBorderOpacity } from './utils';

interface NetWorthCardProps {
  netWorth: number;
  change: { absolute: number; percent: number };
  chartData: { dates: string[]; netWorthData: number[]; cashData: number[]; investmentData: number[] } | null;
  selectedCurrency: string;
  colorPalette: string;
}

const NetWorthCard: React.FC<NetWorthCardProps> = ({
  netWorth,
  change,
  chartData,
  selectedCurrency,
  colorPalette,
}) => {
  const colors = getDashboardPalette(colorPalette);
  const [viewType, setViewType] = useState<'netWorth' | 'cash' | 'investment'>('netWorth');

  const handleViewChange = (event: SelectChangeEvent) => {
    setViewType(event.target.value as 'netWorth' | 'cash' | 'investment');
  };

  // Get current value and data based on view type
  const getCurrentValue = () => {
    if (!chartData) return netWorth;
    if (viewType === 'cash' && chartData.cashData.length > 0) {
      return chartData.cashData[chartData.cashData.length - 1];
    }
    if (viewType === 'investment' && chartData.investmentData.length > 0) {
      return chartData.investmentData[chartData.investmentData.length - 1];
    }
    return netWorth;
  };

  const getChartData = () => {
    if (!chartData) return null;
    if (viewType === 'cash') return chartData.cashData;
    if (viewType === 'investment') return chartData.investmentData;
    return chartData.netWorthData;
  };

  const getLineColor = () => {
    if (viewType === 'cash') return colors.cash;
    if (viewType === 'investment') return colors.investment;
    return '#3B82F6'; // Blue for net worth
  };

  const getTitle = () => {
    if (viewType === 'cash') return 'Cash';
    if (viewType === 'investment') return 'Investments';
    return 'Net Worth';
  };

  const currentValue = getCurrentValue();
  const chartDataArray = getChartData();
  const lineColor = getLineColor();

  // Calculate change based on view type
  const calculateChange = () => {
    if (!chartData || !chartDataArray || chartDataArray.length < 2) {
      return { absolute: 0, percent: 0 };
    }
    const current = chartDataArray[chartDataArray.length - 1];
    const previous = chartDataArray[chartDataArray.length - 2];
    if (previous === 0) return { absolute: 0, percent: 0 };
    const absolute = current - previous;
    const percent = (absolute / previous) * 100;
    return { absolute, percent };
  };

  const viewChange = calculateChange();
  const changeColor = viewChange.absolute >= 0 ? colors.cash : '#EF4444';
  const changeSign = viewChange.absolute >= 0 ? '+' : '';

  // Prepare data for Recharts
  const rechartsData = chartData && chartDataArray
    ? chartData.dates.map((date, index) => ({
        date: new Date(date),
        value: chartDataArray[index],
        formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    : [];

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.net_worth, 0.05)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        p: 3,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          borderColor: colors.net_worth + '40',
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background: `radial-gradient(circle, ${hexToRgba(colors.net_worth, 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Title and Dropdown */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: '1.25rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {getTitle()}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={viewType}
              onChange={handleViewChange}
              sx={{
                color: colors.card_text,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                backgroundColor: colors.card_bg,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.card_subtext + '40',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.card_subtext + '60',
                },
                '& .MuiSvgIcon-root': {
                  color: colors.card_text,
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
                      '&.Mui-selected': {
                        backgroundColor: hexToRgba(colors.card_accent, 0.15),
                        color: colors.card_accent,
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="netWorth">Net Worth</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="investment">Investment</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Current Value */}
        <Box>
          <Typography
            variant="h3"
            sx={{
              color: colors.card_text,
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontFamily: 'Inter, -apple-system, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {currencyFormat(currentValue, selectedCurrency)}
          </Typography>

          {/* Change Indicator */}
          {viewChange.absolute !== 0 && (
            <Typography
              variant="body2"
              sx={{
                color: changeColor,
                fontSize: '0.875rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontWeight: 500,
                mt: 0.5,
              }}
            >
              {changeSign}{currencyFormat(Math.abs(viewChange.absolute), selectedCurrency)} change
            </Typography>
          )}
        </Box>

        {/* Line Graph */}
        {rechartsData.length > 0 && (
          <Box sx={{ mt: 3, pt: 1, height: 250 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rechartsData}>
                <defs>
                  <linearGradient id={`netWorthGradient-${viewType}`} x1="0" y1="0" x2="0" y2="1">
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
                  fill={`url(#netWorthGradient-${viewType})`}
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
                  formatter={(value: number) => currencyFormat(value, selectedCurrency)}
                  labelStyle={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}
                  trigger={['hover', 'click']}
                  filterNull={false}
                  content={(props) => {
                    if (!props.active || !props.payload || props.payload.length === 0) return null;
                    // Find the Line payload (has stroke property matching lineColor, or first payload that's not from Area)
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
                          {currencyFormat(linePayload.value as number, selectedCurrency)}
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

export default NetWorthCard;

