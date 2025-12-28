import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import { currencyFormat } from '../../utils/formatting';
import { BudgetTotals } from './types';
import { getOpacity, getBorderOpacity } from './utils';

interface SummaryCardProps {
  colors: {
    card_bg: string;
    card_text: string;
    card_subtext: string;
    card_accent: string;
  };
  income: number;
  totals: BudgetTotals;
  budgetCurrency: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  colors,
  income,
  totals,
  budgetCurrency,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${colors.card_text}${getOpacity(0.02)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        p: { xs: 2, sm: 2.5 },
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          borderColor: colors.card_accent + '40',
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Chip
          label="Summary"
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
            mb: 2,
            alignSelf: 'flex-start',
          }}
        />
        <Stack spacing={1.5}>
          {/* Income */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Income
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {currencyFormat(income, budgetCurrency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_subtext,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                100.0%
              </Typography>
            </Stack>
          </Stack>
          <Divider sx={{ borderColor: `${colors.card_subtext}${getBorderOpacity(0.1)}` }} />
          {/* Needs */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Needs
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {currencyFormat(totals.needs, budgetCurrency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_subtext,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                {totals.needsPercent.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
          {/* Wants */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Wants
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {currencyFormat(totals.wants, budgetCurrency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_subtext,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                {totals.wantsPercent.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
          {/* Savings */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Savings
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {currencyFormat(totals.savings, budgetCurrency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.card_subtext,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                {totals.savingsPercent.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
          <Divider sx={{ borderColor: `${colors.card_subtext}${getBorderOpacity(0.1)}` }} />
          {/* Remaining */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              sx={{
                color: colors.card_subtext,
                fontWeight: 500,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Remaining
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                variant="body2"
                sx={{
                  color: totals.remaining >= 0 ? '#4CAF50' : '#F44336',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {currencyFormat(totals.remaining, budgetCurrency)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: totals.remaining >= 0 ? '#4CAF50' : '#F44336',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  minWidth: 45,
                  textAlign: 'right',
                }}
              >
                {income > 0 ? ((totals.remaining / income) * 100).toFixed(1) : '0.0'}%
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};



