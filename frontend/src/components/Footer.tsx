import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { getNavPalette, PALETTE_SUBTEXT_COLORS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';

const Footer: React.FC = () => {
  const { colorPalette } = useTheme();
  const navColors = getNavPalette(colorPalette);

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: navColors.bg_solid,
        borderTop: `1px solid ${navColors.border}`,
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: PALETTE_SUBTEXT_COLORS[colorPalette],
              fontSize: '0.875rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            © {new Date().getFullYear()} financy. All rights reserved.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: PALETTE_SUBTEXT_COLORS[colorPalette],
              fontSize: '0.875rem',
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            Your personal finance dashboard
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;



