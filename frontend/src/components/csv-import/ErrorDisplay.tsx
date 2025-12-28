import React from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { getDashboardPalette } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgba } from '../dashboard/utils';

interface ErrorDisplayProps {
  errors: string[];
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors }) => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

  if (errors.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${hexToRgba('#F44336', 0.1)} 0%, ${hexToRgba('#F44336', 0.05)} 100%)`,
        borderRadius: 4,
        p: 3,
        border: `1px solid ${hexToRgba('#F44336', 0.3)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Warning sx={{ color: '#F44336' }} />
        <Typography
          variant="h6"
          sx={{
            color: '#F44336',
            fontWeight: 600,
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          Parsing Errors ({errors.length})
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        sx={{
          color: colors.card_subtext,
          mb: 2,
          fontStyle: 'italic',
        }}
      >
        These rows could not be parsed. They will not be imported. You may need to add them manually.
      </Typography>
      <Box
        sx={{
          maxHeight: 300,
          overflowY: 'auto',
          backgroundColor: hexToRgba(colors.card_bg, 0.5),
          borderRadius: 2,
          p: 2,
        }}
      >
        <Stack spacing={1}>
          {errors.map((error, idx) => (
            <Typography 
              key={idx} 
              sx={{ 
                color: colors.card_text, 
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                backgroundColor: hexToRgba('#F44336', 0.1),
                p: 1,
                borderRadius: 1,
              }}
            >
              {error}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default ErrorDisplay;

