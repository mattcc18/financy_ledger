import React, { useState } from 'react';
import { Grid, Paper, Stack, Box, Typography, IconButton } from '@mui/material';
import { TrendingUp, PieChart, SwapHoriz } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors, CategoryChartData } from './types';

interface ChartsSectionProps {
  categoryChartData: CategoryChartData | null;
  spendingOverTimeData: {
    dates: string[];
    amounts: number[];
  } | null;
  displayCurrency: string;
  colors: ExpenseTrackingColors;
  colorPalette: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  categoryChartData,
  spendingOverTimeData,
  displayCurrency,
  colors,
  colorPalette,
}) => {
  const [chartFlipped, setChartFlipped] = useState<boolean>(false);

  if (!categoryChartData || !spendingOverTimeData) return null;

  return (
    <Grid item xs={12} md={6}>
        <Box
          sx={{
            perspective: '1000px',
            position: 'relative',
            width: '100%',
            height: 450,
          }}
        >
          {/* Front Side - Cumulative Spending */}
          <Paper
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
              borderRadius: 4,
              p: { xs: 2, sm: 3 },
              overflow: 'visible',
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: chartFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s',
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
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp sx={{ color: colors.card_accent, fontSize: 22 }} />
                <Typography
                  variant="h6"
                  sx={{
                    color: colors.card_text,
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  Cumulative Spending
                </Typography>
              </Stack>
              {categoryChartData && (
                <Typography
                  sx={{
                    color: colors.card_text,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  {currencyFormat(categoryChartData.total, displayCurrency)}
                </Typography>
              )}
            </Stack>
            <Box sx={{ height: 320, width: '100%', position: 'relative', zIndex: 1 }}>
              <Plot
                data={[
                  {
                    x: spendingOverTimeData.dates,
                    y: spendingOverTimeData.amounts,
                    type: 'scatter' as const,
                    mode: 'lines+markers' as const,
                    name: 'Cumulative Spending',
                    line: {
                      color: colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2',
                      width: colorPalette === 'Dark Mode' ? 3.5 : 2.5,
                      shape: 'linear' as const,
                    },
                    marker: {
                      color: colorPalette === 'Dark Mode' ? '#60A5FA' : '#1976D2',
                      size: 6,
                    },
                    fill: 'tozeroy' as const,
                    fillcolor: colorPalette === 'Dark Mode' 
                      ? 'rgba(96, 165, 250, 0.18)'
                      : 'rgba(25, 118, 210, 0.12)',
                  },
                ]}
                layout={{
                  template: 'none',
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  autosize: true,
                  xaxis: {
                    type: 'date',
                    showgrid: false,
                    tickfont: { color: colors.card_subtext, size: 10, family: 'Inter, -apple-system, sans-serif' },
                    zeroline: false,
                    hoverformat: '%d %b %Y',
                  },
                  yaxis: {
                    title: {
                      text: 'Cumulative Amount',
                      font: { size: 11, color: colors.card_subtext, family: 'Inter, -apple-system, sans-serif' },
                    },
                    showgrid: true,
                    gridcolor: 'rgba(128,128,128,0.06)',
                    tickfont: { color: colors.card_subtext, size: 10, family: 'Inter, -apple-system, sans-serif' },
                    zeroline: false,
                  },
                  hovermode: 'x unified',
                  hoverlabel: {
                    bgcolor: '#FFFFFF',
                    bordercolor: colors.card_subtext,
                    font: {
                      family: 'Inter, -apple-system, sans-serif',
                      size: 11,
                      color: '#000000',
                    },
                  },
                  margin: { t: 30, b: 50, l: 60, r: 20 },
                  showlegend: false,
                }}
                config={{
                  displayModeBar: false,
                  staticPlot: false,
                  responsive: true,
                  doubleClick: false,
                  showTips: false,
                }}
                style={{ width: '100%', height: '100%', position: 'absolute' }}
                useResizeHandler={true}
              />
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

          {/* Back Side - Category Breakdown */}
          <Paper
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_text, 0.02)} 100%)`,
              borderRadius: 4,
              p: { xs: 2, sm: 3 },
              overflow: 'visible',
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: chartFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
              transition: 'transform 0.6s',
              pointerEvents: 'auto',
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
            <Box sx={{ height: 320, width: '100%', position: 'relative', zIndex: 1 }}>
              <Plot
                data={[
                  {
                    type: 'pie',
                    labels: categoryChartData.labels,
                    values: categoryChartData.values,
                    marker: {
                      colors: categoryChartData.colors,
                      line: {
                        color: colors.card_bg,
                        width: 2,
                      },
                    },
                    textinfo: 'none',
                    hovertemplate: '%{customdata}<extra></extra>',
                    customdata: categoryChartData.hoverText,
                    hole: 0.7,
                  },
                ]}
                layout={{
                  autosize: true,
                  margin: { t: 10, b: 10, l: 10, r: 10 },
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
                      text: `<span style="font-size: 28px; font-weight: 700; color: ${colors.card_text}">${currencyFormat(categoryChartData.total, displayCurrency)}</span>`,
                      showarrow: false,
                      font: {
                        size: 16,
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
                  responsive: true,
                  doubleClick: false,
                }}
                style={{ width: '100%', height: '100%', position: 'absolute', pointerEvents: 'auto' }}
                useResizeHandler={true}
              />
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
        </Box>
    </Grid>
  );
};



