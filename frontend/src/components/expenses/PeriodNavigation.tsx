import React from 'react';
import { Stack, Typography, IconButton } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { formatPeriod, getPeriodDates } from './utils';
import { hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors } from './types';

interface PeriodNavigationProps {
  selectedMonth: string;
  frequency: 'weekly' | 'monthly';
  startDay: number;
  colors: ExpenseTrackingColors;
  onPrevious: () => void;
  onNext: () => void;
}

export const PeriodNavigation: React.FC<PeriodNavigationProps> = ({
  selectedMonth,
  frequency,
  startDay,
  colors,
  onPrevious,
  onNext,
}) => {
  const { start, end } = getPeriodDates(selectedMonth, frequency, startDay);
  const periodText = formatPeriod(start, end);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton
        onClick={onPrevious}
        size="small"
        sx={{
          color: colors.card_subtext,
          '&:hover': {
            backgroundColor: hexToRgba(colors.card_text, 0.1),
            color: colors.card_text,
          },
        }}
      >
        <ArrowBack fontSize="small" />
      </IconButton>
      <Typography
        sx={{
          color: colors.card_subtext,
          fontSize: '0.875rem',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontWeight: 500,
          minWidth: '140px',
          textAlign: 'center',
        }}
      >
        {periodText}
      </Typography>
      <IconButton
        onClick={onNext}
        size="small"
        sx={{
          color: colors.card_subtext,
          '&:hover': {
            backgroundColor: hexToRgba(colors.card_text, 0.1),
            color: colors.card_text,
          },
        }}
      >
        <ArrowForward fontSize="small" />
      </IconButton>
    </Stack>
  );
};



