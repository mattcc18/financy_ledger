import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import Plot from 'react-plotly.js';
import { currencyFormat } from '../../utils/formatting';
import { getOpacity, getBorderOpacity } from './utils';

interface PieChartData {
  labels: string[];
  values: number[];
  colors: string[];
  hoverText: string[];
  total: number;
}

interface ExpenseBreakdownChartProps {
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  pieChartData: PieChartData | null;
  chartView: 'all' | 'needs' | 'wants' | 'savings';
  budgetCurrency: string;
  colorPalette: string;
  onChartViewChange: (view: 'all' | 'needs' | 'wants' | 'savings') => void;
}

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  colors,
  pieChartData,
  chartView,
  budgetCurrency,
  colorPalette,
  onChartViewChange,
}) => {
  const isDarkMode = colorPalette === 'Dark Mode';
  // Colors matching Financial Overview chart in dark mode
  const needsColor = isDarkMode ? '#60A5FA' : '#E53935'; // Blue (Net Worth) in dark, red in light
  const wantsColor = isDarkMode ? '#10B981' : '#00897B'; // Green (Cash) in dark, teal in light
  const savingsColor = isDarkMode ? '#F59E0B' : '#1976D2'; // Yellow/Orange (Investment) in dark, blue in light
  if (!pieChartData || pieChartData.values.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${colors.card_accent}${getOpacity(0.05)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        p: { xs: 2, sm: 2.5 },
        pb: { xs: 2, sm: 2.5 },
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: colors.card_accent + '40',
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: isDarkMode 
            ? `linear-gradient(90deg, #60A5FA 0%, #10B981 50%, #F59E0B 100%)`
            : `linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 50%, #95E1D3 100%)`,
          borderRadius: '4px 4px 0 0',
          zIndex: 2,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${colors.card_accent}${getOpacity(0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Chip
            label="Expense Breakdown"
            size="small"
            variant="outlined"
            sx={{
              color: colors.card_subtext,
              borderColor: colors.card_subtext + '30',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              fontWeight: 500,
              height: 22,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          />
          <FormControl 
            variant="outlined" 
            size="small"
            sx={{ 
              minWidth: 120,
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
            <Select
              value={chartView}
              onChange={(e) => onChartViewChange(e.target.value as 'all' | 'needs' | 'wants' | 'savings')}
              sx={{
                color: colors.card_text,
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontSize: '0.75rem',
                height: 28,
                '& .MuiSelect-icon': {
                  color: colors.card_subtext,
                },
              }}
            >
              <MenuItem value="all" sx={{ fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '0.75rem' }}>All</MenuItem>
              <MenuItem value="needs" sx={{ fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '0.75rem' }}>Needs</MenuItem>
              <MenuItem value="wants" sx={{ fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '0.75rem' }}>Wants</MenuItem>
              <MenuItem value="savings" sx={{ fontFamily: 'Inter, -apple-system, sans-serif', fontSize: '0.75rem' }}>Savings</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Box sx={{ height: { xs: 400, sm: 500 }, width: '100%', position: 'relative', overflow: 'visible' }}>
          <Plot
            key={`${pieChartData.total}-${chartView}-${pieChartData.values.length}`}
            data={[
              {
                type: 'pie',
                labels: pieChartData.labels,
                values: pieChartData.values,
                marker: {
                  colors: pieChartData.colors,
                  line: {
                    color: colors.card_bg,
                    width: 2,
                  },
                },
                textinfo: 'label',
                textposition: 'outside',
                textfont: {
                  size: 13,
                  color: colors.card_text,
                  family: 'Inter, -apple-system, sans-serif',
                },
                hovertemplate: '%{customdata}<extra></extra>',
                customdata: pieChartData.hoverText,
                hole: 0.7,
                rotation: -90,
              },
            ]}
            layout={{
              autosize: true,
              margin: { t: 80, b: 80, l: 120, r: 80 },
              showlegend: false,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: {
                family: 'Inter, -apple-system, sans-serif',
                color: colors.card_text,
                size: 11,
              },
              annotations: [
                {
                  text: `<b>${currencyFormat(pieChartData.total, budgetCurrency)}</b><br><span style="font-size: 12px; color: ${colors.card_subtext}">${
                    chartView === 'all' ? 'Total Budgeted' :
                    chartView === 'needs' ? 'Total Needs' :
                    chartView === 'wants' ? 'Total Wants' :
                    'Total Savings'
                  }</span>`,
                  showarrow: false,
                  font: {
                    size: 20,
                    color: colors.card_text,
                    family: 'Inter, -apple-system, sans-serif',
                  },
                  x: 0.5,
                  y: 0.5,
                  xref: 'paper',
                  yref: 'paper',
                  align: 'center',
                },
              ],
            }}
            config={{
              displayModeBar: false,
              staticPlot: false,
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
        
        {/* Legend */}
        <Stack 
          direction="row" 
          spacing={2} 
          justifyContent="center" 
          alignItems="center"
          sx={{ mt: 2, flexWrap: 'wrap', gap: 1.5 }}
        >
          {/* Needs */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: needsColor,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.7rem',
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Needs
            </Typography>
          </Stack>
          
          {/* Wants */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: wantsColor,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.7rem',
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Wants
            </Typography>
          </Stack>
          
          {/* Savings */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: savingsColor,
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: colors.card_subtext,
                fontSize: '0.7rem',
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Savings
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};



