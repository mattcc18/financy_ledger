import React, { useMemo } from 'react';
import { Paper, Box, Typography, Stack, useMediaQuery, useTheme as useMUITheme } from '@mui/material';
import { PieChart } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import { currencyFormat } from '../../utils/formatting';
import { getDashboardPalette } from '../../config/colorPalettes';
import { hexToRgba, getBorderOpacity } from './utils';

interface CashInvestmentDonutChartProps {
  cash: number;
  investments: number;
  netWorth: number;
  selectedCurrency: string;
  colorPalette: string;
}

const CashInvestmentDonutChart: React.FC<CashInvestmentDonutChartProps> = ({
  cash,
  investments,
  netWorth,
  selectedCurrency,
  colorPalette,
}) => {
  const colors = getDashboardPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));

  const cashPercent = netWorth > 0 ? (cash / netWorth) * 100 : 0;
  const investmentPercent = netWorth > 0 ? (investments / netWorth) * 100 : 0;

  const chartHeight = useMemo(() => {
    // Smaller size to fit in the narrower card (md={4} column)
    if (isMobile) return 200;
    if (isTablet) return 250;
    return 280;
  }, [isMobile, isTablet]);

  const donutData = [
    {
      values: [cash, investments],
      labels: ['Cash', 'Investments'],
      type: 'pie',
      hole: 0.7,
      marker: {
        colors: [colors.cash, colors.investment],
        line: {
          color: colorPalette !== 'Light Mode' ? colors.card_bg : '#FFFFFF',
          width: 3,
        },
      },
      textinfo: 'none',
      hovertemplate: '<b>%{label}</b><br>%{percent}<extra></extra>',
    },
  ];

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
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <PieChart sx={{ color: colors.card_accent, fontSize: 22 }} />
        <Typography
          variant="h6"
          sx={{
            color: colors.card_text,
            fontWeight: 600,
            fontSize: { xs: '1.1rem', sm: '1rem', md: '1.1rem' },
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          Allocation
        </Typography>
      </Stack>
      <Box sx={{ width: '100%', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: chartHeight }}>
        <Plot
          data={donutData}
          layout={{
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            height: chartHeight,
            width: chartHeight,
            margin: { t: 10, b: 10, l: 10, r: 10 },
            showlegend: false,
            annotations: [
              {
                text: `<b style="font-size: ${isMobile ? '14px' : isTablet ? '16px' : '18px'}; font-family: Inter, -apple-system, sans-serif; color: ${colors.card_text};">${currencyFormat(netWorth, selectedCurrency)}</b><br><span style="font-size: ${isMobile ? '8px' : '10px'}; font-family: Inter, -apple-system, sans-serif; color: ${colors.card_subtext};">Net Worth</span>`,
                x: 0.5,
                y: 0.5,
                showarrow: false,
                xref: 'paper',
                yref: 'paper',
                xanchor: 'middle',
                yanchor: 'middle',
                bgcolor: 'rgba(0,0,0,0)',
                bordercolor: 'rgba(0,0,0,0)',
              },
            ],
          }}
          config={{
            displayModeBar: false,
            responsive: false,
            doubleClick: false,
            showTips: false,
            staticPlot: false,
          }}
          style={{ width: `${chartHeight}px`, height: `${chartHeight}px`, maxWidth: '100%' }}
        />
      </Box>
      {/* Legend */}
      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.cash,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: colors.card_text,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Cash {cashPercent.toFixed(1)}%
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: colors.investment,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: colors.card_text,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Investments {investmentPercent.toFixed(1)}%
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CashInvestmentDonutChart;

