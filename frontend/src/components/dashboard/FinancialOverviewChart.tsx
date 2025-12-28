import React, { useState, useCallback, useMemo } from 'react';
import { Paper, Box, Typography, Stack, useMediaQuery, useTheme as useMUITheme } from '@mui/material';
import { BarChart } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { ChartData } from './types';
import { getDashboardPalette } from '../../config/colorPalettes';
import { hexToRgba, getBorderOpacity } from './utils';

interface FinancialOverviewChartProps {
  chartData: ChartData;
  selectedCurrency: string;
  colorPalette: string;
}

const FinancialOverviewChart: React.FC<FinancialOverviewChartProps> = ({
  chartData,
  selectedCurrency,
  colorPalette,
}) => {
  const colors = getDashboardPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [visibleTraces, setVisibleTraces] = useState<boolean[]>([true, true, true]); // [netWorth, cash, investment]

  // Convert date strings to Date objects for proper time-based scaling
  const dateObjects = chartData.dates.map(date => new Date(date));

  // Calculate min and max values based on visible traces only
  const getVisibleValues = useCallback(() => {
    const allValues: number[] = [];
    
    if (visibleTraces[0]) {
      allValues.push(...chartData.netWorthData.filter(val => val != null && !isNaN(val)));
    }
    if (visibleTraces[1]) {
      allValues.push(...chartData.cashData.filter(val => val != null && !isNaN(val)));
    }
    if (visibleTraces[2]) {
      allValues.push(...chartData.investmentData.filter(val => val != null && !isNaN(val)));
    }
    
    return allValues;
  }, [visibleTraces, chartData]);

  const visibleValues = getVisibleValues();
  const minValue = visibleValues.length > 0 ? Math.min(...visibleValues) : 0;
  const maxValue = visibleValues.length > 0 ? Math.max(...visibleValues) : 1000;
  
  // Add padding (5% above and below)
  const range = maxValue - minValue;
  const padding = range * 0.05;
  const yMin = Math.max(0, minValue - padding); // Don't go below 0
  const yMax = maxValue + padding;

  // Memoize layout to update when visibleTraces or y-axis range changes
  const layout = useMemo(() => ({
    template: 'none',
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    autosize: true,
    xaxis: {
      type: 'date',
      showgrid: false,
      showticklabels: true,
      tickfont: { color: colors.card_subtext, size: isMobile ? 8 : 10, family: 'Inter, -apple-system, sans-serif' },
      zeroline: false,
      dtick: 'M1', // Show one tick per month
      tickformat: '%b %Y',
      hoverformat: '%d %b %Y', // Show full date in hover (e.g., "15 Nov 2025")
      tickangle: isMobile ? -30 : -45,
    },
    yaxis: {
      title: {
        text: selectedCurrency,
        font: { size: isMobile ? 9 : 11, color: colors.card_subtext, family: 'Inter, -apple-system, sans-serif', weight: 500 },
      },
      showgrid: true,
      gridcolor: 'rgba(128,128,128,0.06)',
      gridwidth: 1,
      tickfont: { color: colors.card_subtext, size: isMobile ? 8 : 10, family: 'Inter, -apple-system, sans-serif' },
      zeroline: false,
      range: [yMin, yMax],
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: colorPalette === 'Dark Mode' ? '#FFFFFF' : '#FFFFFF',
      bordercolor: colorPalette === 'Dark Mode' ? colors.card_subtext : colors.card_subtext,
      font: {
        family: 'Inter, -apple-system, sans-serif',
        size: 11,
        color: colorPalette === 'Dark Mode' ? '#000000' : '#000000',
      },
    },
    margin: { 
      t: 10, 
      b: isMobile ? 60 : 50, 
      l: isMobile ? 35 : 70, 
      r: isMobile ? 10 : 30 
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'top',
      y: isMobile ? -0.2 : -0.15,
      xanchor: 'center',
      x: 0.5,
      bgcolor: 'rgba(0,0,0,0)',
      borderwidth: 0,
      font: { color: colors.card_text, size: isMobile ? 9 : 11, family: 'Inter, -apple-system, sans-serif', weight: 500 },
    },
  }), [visibleTraces, yMin, yMax, isMobile, colors, selectedCurrency, colorPalette]);

  // Handle trace visibility changes when legend items are clicked
  const handleRestyle = (update: any) => {
    if (update && 'visible' in update) {
      const newVisible = update.visible as boolean[];
      if (Array.isArray(newVisible) && newVisible.length === 3) {
        setVisibleTraces(newVisible);
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: colors.card_bg,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, position: 'relative', zIndex: 1 }}>
        <BarChart sx={{ color: colors.card_accent, fontSize: 22 }} />
        <Typography
          variant="h6"
          sx={{
            color: colors.card_text,
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1rem', md: '1.1rem' },
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          Financial Overview
        </Typography>
      </Stack>
      <Box sx={{ width: '100%', height: { xs: 260, sm: 380 }, position: 'relative' }}>
        <Plot
          data={[
            {
              x: dateObjects,
              y: chartData.netWorthData,
              type: 'scatter',
              mode: 'lines',
              name: 'Net Worth',
              visible: visibleTraces[0] ? true : 'legendonly',
              line: { 
                color: colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2', 
                width: colorPalette === 'Dark Mode' ? 4 : 3.5,
                shape: 'linear',
              },
              fill: 'tozeroy',
              fillcolor: colorPalette === 'Dark Mode' 
                ? `rgba(96, 165, 250, 0.18)`
                : `rgba(25, 118, 210, 0.12)`,
            },
            {
              x: dateObjects,
              y: chartData.cashData,
              type: 'scatter',
              mode: 'lines',
              name: 'Cash',
              visible: visibleTraces[1] ? true : 'legendonly',
              line: { 
                color: colors.cash, 
                width: colorPalette === 'Dark Mode' ? 3.5 : 3,
                shape: 'linear',
              },
              fill: 'tozeroy',
              fillcolor: `rgba(${parseInt(colors.cash.slice(1, 3), 16)}, ${parseInt(colors.cash.slice(3, 5), 16)}, ${parseInt(colors.cash.slice(5, 7), 16)}, ${colorPalette === 'Dark Mode' ? 0.18 : 0.12})`,
            },
            {
              x: dateObjects,
              y: chartData.investmentData,
              type: 'scatter',
              mode: 'lines',
              name: 'Investments',
              visible: visibleTraces[2] ? true : 'legendonly',
              line: { 
                color: colors.investment, 
                width: colorPalette === 'Dark Mode' ? 3.5 : 3,
                shape: 'linear',
              },
              fill: 'tozeroy',
              fillcolor: `rgba(${parseInt(colors.investment.slice(1, 3), 16)}, ${parseInt(colors.investment.slice(3, 5), 16)}, ${parseInt(colors.investment.slice(5, 7), 16)}, ${colorPalette === 'Dark Mode' ? 0.18 : 0.12})`,
            },
          ]}
          layout={layout}
          config={{ 
            displayModeBar: false,
            responsive: true,
            doubleClick: false,
            showTips: false,
            staticPlot: false,
          }}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          useResizeHandler={true}
          onRestyle={handleRestyle}
        />
      </Box>
    </Paper>
  );
};

export default FinancialOverviewChart;



