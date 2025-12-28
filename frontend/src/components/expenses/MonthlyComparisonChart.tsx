import React, { useState } from 'react';
import { Grid, Paper, Stack, Box, Typography, IconButton } from '@mui/material';
import { BarChart, PieChart, SwapHoriz } from '@mui/icons-material';
import { BarChart as RechartsBarChart, PieChart as RechartsPieChart, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors, CategoryChartData } from './types';
import { Budget } from '../../services/api';
import { MonthlyComparisonData } from './hooks/useMonthlyComparison';

interface MonthlyComparisonChartProps {
  monthlyComparisonData: MonthlyComparisonData | null;
  comparisonBudgetId: string | null;
  budgets: Budget[];
  displayCurrency: string;
  frequency: 'weekly' | 'monthly';
  colors: ExpenseTrackingColors;
  colorPalette: string;
  gridSize?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  categoryChartData?: CategoryChartData | null;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  monthlyComparisonData,
  comparisonBudgetId,
  budgets,
  displayCurrency,
  frequency,
  colors,
  colorPalette,
  gridSize = { xs: 12, md: 6 },
  categoryChartData,
}) => {
  const [chartFlipped, setChartFlipped] = useState<boolean>(false);
  
  if (!monthlyComparisonData) return null;

  const selectedBudget = comparisonBudgetId ? budgets.find(b => String(b.budget_id) === comparisonBudgetId) : null;
  const totalBudgetAmount = selectedBudget 
    ? (selectedBudget.categories || []).reduce((sum: number, cat: any) => sum + (cat.budgeted_amount || 0), 0)
    : null;

  return (
    <Grid item xs={gridSize.xs || 12} sm={gridSize.sm} md={gridSize.md || 6} lg={gridSize.lg} xl={gridSize.xl}>
      <Box
        sx={{
          perspective: '1000px',
          position: 'relative',
          width: '100%',
          height: { xs: 'auto', md: 500 },
          minHeight: { xs: 400, md: 500 },
        }}
      >
        {/* Front Side - Monthly Comparison Bar Chart */}
        <Paper
          onClick={() => categoryChartData && setChartFlipped(!chartFlipped)}
          elevation={0}
          sx={{
            cursor: categoryChartData ? 'pointer' : 'default',
            background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            overflow: 'visible',
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            position: { xs: 'relative', md: 'absolute' },
            width: '100%',
            height: { xs: 'auto', md: '100%' },
            minHeight: { xs: 400, md: 500 },
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: chartFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s',
            display: { xs: chartFlipped ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
            '&:hover': {
              borderColor: colors.card_subtext + '30',
              boxShadow: 3,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: colorPalette === 'Dark Mode'
                ? `linear-gradient(90deg, #60A5FA 0%, #10B981 50%, #F59E0B 100%)`
                : `linear-gradient(90deg, #1976D2 0%, #42A5F5 50%, #64B5F6 100%)`,
              borderRadius: '4px 4px 0 0',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '80px',
              background: `radial-gradient(circle, ${hexToRgba(colors.card_text, 0.05)} 0%, transparent 70%)`,
              borderRadius: '50%',
            },
          }}
        >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
          <BarChart sx={{ color: colors.card_accent, fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{
              color: colors.card_text,
              fontWeight: 600,
              fontSize: '1.1rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {frequency === 'monthly' ? 'Monthly' : 'Weekly'} Comparison
          </Typography>
        </Stack>
        <Box sx={{ flex: 1, minHeight: { xs: 350, md: 400 }, width: '100%', position: 'relative', zIndex: 1 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={350}>
            <RechartsBarChart
              data={monthlyComparisonData.labels.map((label, index) => ({
                period: label,
                amount: monthlyComparisonData.values[index],
                isCurrent: monthlyComparisonData.isCurrentPeriod?.[index] || false,
              }))}
              margin={{ top: 20, right: 30, bottom: 70, left: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.card_subtext + '20'} />
              <XAxis
                dataKey="period"
                tick={{ fill: colors.card_subtext, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif' }}
                axisLine={{ stroke: colors.card_subtext + '40', strokeWidth: 1.5 }}
              />
              <YAxis
                tick={{ fill: colors.card_subtext, fontSize: 11, fontFamily: 'Inter, -apple-system, sans-serif' }}
                axisLine={{ stroke: colors.card_subtext + '40', strokeWidth: 1.5 }}
                label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: colors.card_subtext, fontSize: 12, fontFamily: 'Inter, -apple-system, sans-serif', fontWeight: 600 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${colors.card_subtext}`,
                  borderRadius: '8px',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontSize: '11px',
                }}
                formatter={(value: number) => currencyFormat(value, displayCurrency)}
                labelStyle={{ fontWeight: 600, color: '#000000' }}
              />
              {totalBudgetAmount && (
                <ReferenceLine
                  y={totalBudgetAmount}
                  stroke={colors.card_accent}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `Budget: ${currencyFormat(totalBudgetAmount, displayCurrency)}`, position: 'right', fill: colors.card_subtext, fontSize: 10, fontFamily: 'Inter, -apple-system, sans-serif' }}
                />
              )}
              <Bar
                dataKey="amount"
                fill={colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2'}
                stroke={colorPalette === 'Dark Mode' ? '#3B82F6' : '#1565C0'}
                strokeWidth={1.5}
                radius={[6, 6, 0, 0]}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {monthlyComparisonData.labels.map((label, index) => {
                  const isCurrent = monthlyComparisonData.isCurrentPeriod?.[index] || false;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isCurrent 
                        ? (colorPalette === 'Dark Mode' ? '#10B981' : '#42A5F5') // Green/Blue for current period
                        : (colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2')} // Original color for others
                      stroke={isCurrent
                        ? (colorPalette === 'Dark Mode' ? '#059669' : '#2196F3')
                        : (colorPalette === 'Dark Mode' ? '#3B82F6' : '#1565C0')}
                    />
                  );
                })}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </Box>
        {categoryChartData && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setChartFlipped(!chartFlipped);
            }}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              backgroundColor: hexToRgba(colors.card_text, 0.1),
              color: colors.card_text,
              zIndex: 10,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_text, 0.2),
              },
            }}
          >
            <SwapHoriz />
          </IconButton>
        )}
      </Paper>
      
      {/* Back Side - Category Pie Chart */}
      {categoryChartData && (
        <Paper
          onClick={() => setChartFlipped(!chartFlipped)}
          sx={{
            cursor: 'pointer',
            background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            overflow: 'visible',
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            position: { xs: 'relative', md: 'absolute' },
            width: '100%',
            height: { xs: 'auto', md: '100%' },
            minHeight: { xs: 400, md: 500 },
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: chartFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            transition: 'transform 0.6s',
            display: { xs: chartFlipped ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            '&:hover': {
              borderColor: colors.card_subtext + '30',
              boxShadow: 3,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: colorPalette === 'Dark Mode'
                ? `linear-gradient(90deg, #60A5FA 0%, #10B981 50%, #F59E0B 100%)`
                : `linear-gradient(90deg, #1976D2 0%, #42A5F5 50%, #64B5F6 100%)`,
              borderRadius: '4px 4px 0 0',
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
            <PieChart sx={{ color: colors.card_accent, fontSize: 22 }} />
            <Typography
              variant="h6"
              sx={{
                color: colors.card_text,
                fontWeight: 600,
                fontSize: '1.1rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              {categoryChartData.viewType === 'currency' ? 'Expenses by Currency' : categoryChartData.viewType === 'merchant' ? 'Expenses by Merchant' : 'Expenses by Category'}
            </Typography>
          </Stack>
          <Box sx={{ height: { xs: 350, md: 320 }, width: '100%', position: 'relative', zIndex: 1 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <RechartsPieChart>
                <Pie
                  data={categoryChartData.labels.map((label, index) => ({
                    name: label,
                    value: categoryChartData.values[index],
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {categoryChartData.labels.map((label, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={categoryChartData.colors[index]}
                      stroke={colors.card_bg}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${colors.card_subtext}`,
                    borderRadius: '8px',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => {
                    const index = categoryChartData.labels.indexOf(name);
                    const hoverText = categoryChartData.hoverText[index];
                    if (hoverText) {
                      // Parse HTML hover text and return plain text parts
                      const parts = hoverText.split('<br>');
                      return parts;
                    }
                    return [`${name}: ${currencyFormat(value, displayCurrency)}`];
                  }}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    fill: colors.card_text,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  {currencyFormat(categoryChartData.total, displayCurrency)}
                </text>
              </RechartsPieChart>
            </ResponsiveContainer>
          </Box>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setChartFlipped(!chartFlipped);
            }}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              backgroundColor: hexToRgba(colors.card_text, 0.1),
              color: colors.card_text,
              zIndex: 10,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_text, 0.2),
              },
            }}
          >
            <SwapHoriz />
          </IconButton>
        </Paper>
      )}
      </Box>
    </Grid>
  );
};



