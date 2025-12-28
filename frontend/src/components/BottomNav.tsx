import React from 'react';
import { BottomNavigation, BottomNavigationAction, useMediaQuery, useTheme as useMUITheme } from '@mui/material';
import { Home, AccountBalance, AccountBalanceWallet, Receipt } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { getNavPalette } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';

const BottomNav: React.FC = () => {
  const { colorPalette } = useTheme();
  const navColors = getNavPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  // Determine current value based on pathname
  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return '/';
    if (path.startsWith('/accounts')) return '/accounts';
    if (path.startsWith('/budget')) return '/budget';
    if (path.startsWith('/expenses')) return '/expenses';
    return '/';
  };

  return (
    <BottomNavigation
      value={getCurrentValue()}
      onChange={handleChange}
      showLabels
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: navColors.bg_solid,
        borderTop: `1px solid ${navColors.border}`,
        boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.08)',
        height: 64,
        '& .MuiBottomNavigationAction-root': {
          color: navColors.button_color,
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
          minWidth: 0,
          padding: '6px 12px',
          '&.Mui-selected': {
            color: navColors.title_color,
            fontWeight: 600,
          },
        },
      }}
    >
      <BottomNavigationAction
        label="Dashboard"
        value="/"
        icon={<Home />}
      />
      <BottomNavigationAction
        label="Accounts"
        value="/accounts"
        icon={<AccountBalance />}
      />
      <BottomNavigationAction
        label="Budget"
        value="/budget"
        icon={<AccountBalanceWallet />}
      />
      <BottomNavigationAction
        label="Expenses"
        value="/expenses"
        icon={<Receipt />}
      />
    </BottomNavigation>
  );
};

export default BottomNav;

