import React from 'react';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { getBorderOpacity, hexToRgba } from '../budget/utils';

interface DateRangeNavigatorProps {
  filterStartDate: string;
  filterEndDate: string;
  onPrevious: () => void;
  onNext: () => void;
  colors: any;
}

const DateRangeNavigator: React.FC<DateRangeNavigatorProps> = ({
  filterStartDate,
  filterEndDate,
  onPrevious,
  onNext,
  colors,
}) => {
  if (!filterStartDate || !filterEndDate) return null;

  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
      <Box sx={{ maxWidth: 400, width: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            onClick={onPrevious}
            sx={{
              backgroundColor: colors.card_bg,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              color: colors.card_text,
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
                borderColor: colors.card_accent + '40',
              },
            }}
            size="small"
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </IconButton>
          
          <Box
            sx={{
              flex: 1,
              px: 1.5,
              py: 0.75,
              backgroundColor: colors.card_bg,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                color: colors.card_text,
                fontSize: '0.75rem',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontWeight: 500,
              }}
            >
              {new Date(filterStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(filterEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
          
          <IconButton
            onClick={onNext}
            sx={{
              backgroundColor: colors.card_bg,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              color: colors.card_text,
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: hexToRgba(colors.card_accent, 0.1),
                borderColor: colors.card_accent + '40',
              },
            }}
            size="small"
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default DateRangeNavigator;

