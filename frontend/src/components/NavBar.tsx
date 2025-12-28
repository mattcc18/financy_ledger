import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, Button, useMediaQuery, useTheme as useMUITheme } from '@mui/material';
import { Palette as PaletteIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getNavPalette, PALETTE_TEXT_COLORS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NavBar: React.FC = () => {
  const { colorPalette, setColorPalette } = useTheme();
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const navColors = getNavPalette(colorPalette);
  const muiTheme = useMUITheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const location = useLocation();
  const [themeAnchorEl, setThemeAnchorEl] = useState<null | HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleThemeClick = (event: React.MouseEvent<HTMLElement>) => {
    setThemeAnchorEl(event.currentTarget);
  };

  const handleThemeClose = () => {
    setThemeAnchorEl(null);
  };

  const handleThemeSelect = (theme: string) => {
    setColorPalette(theme);
    handleThemeClose();
  };

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Hide when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const themes = ['Light Mode', 'Dark Mode', 'Mint Fresh', 'Ocean Blue'];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: navColors.bg_solid,
        borderBottom: `1px solid ${navColors.border}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        willChange: 'transform',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Logo/Title - Clickable to go to Dashboard */}
        <Typography
          component={Link}
          to="/"
          variant="h6"
          sx={{
            color: navColors.title_color,
            textDecoration: 'none',
            fontFamily: 'Inter, -apple-system, sans-serif',
            fontWeight: 600,
            fontSize: '1.25rem',
            mr: 4,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          financy
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
        
        {/* Desktop View - Show all controls */}
        {!isMobile && (
          <>
            {/* Accounts Link */}
            <Button
              component={Link}
              to="/accounts"
              sx={{
                color: location.pathname === '/accounts' ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/accounts' ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              Accounts
            </Button>

            {/* Budget Link */}
            <Button
              component={Link}
              to="/budget"
              sx={{
                color: location.pathname.startsWith('/budget') ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname.startsWith('/budget') ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              Budget
            </Button>
            
            {/* Expenses Link */}
            <Button
              component={Link}
              to="/expenses"
              sx={{
                color: location.pathname === '/expenses' ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/expenses' ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              Expenses
            </Button>
            
            {/* Goals Link */}
            <Button
              component={Link}
              to="/goals"
              sx={{
                color: location.pathname === '/goals' ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/goals' ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              Goals
            </Button>

            {/* Data Entry Link */}
            <Button
              component={Link}
              to="/data-entry"
              sx={{
                color: location.pathname === '/data-entry' ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/data-entry' ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              Data Entry
            </Button>

            {/* CSV Import Link */}
            <Button
              component={Link}
              to="/csv-import"
              sx={{
                color: location.pathname === '/csv-import' ? navColors.title_color : navColors.button_color,
                fontFamily: 'Inter, -apple-system, sans-serif',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: location.pathname === '/csv-import' ? 600 : 500,
                mr: 2,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
            >
              CSV Import
            </Button>

            {/* User Email (if authenticated) */}
            {isAuthenticated && user?.email && (
              <Typography
                sx={{
                  color: navColors.button_color,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontSize: '0.875rem',
                  mr: 2,
                }}
              >
                {user.email}
              </Typography>
            )}

            {/* Logout Button */}
            {isAuthenticated && (
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: navColors.title_color,
                  mr: 1,
                  '&:hover': {
                    backgroundColor: navColors.button_hover,
                  },
                }}
                aria-label="logout"
              >
                <LogoutIcon />
              </IconButton>
            )}

            {/* Theme Icon Button */}
            <IconButton
              onClick={handleThemeClick}
              sx={{
                color: navColors.title_color,
                '&:hover': {
                  backgroundColor: navColors.button_hover,
                },
              }}
              aria-label="change theme"
            >
              <PaletteIcon />
            </IconButton>
            <Menu
              anchorEl={themeAnchorEl}
              open={Boolean(themeAnchorEl)}
              onClose={handleThemeClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  backgroundColor: navColors.bg_solid,
                  border: `1px solid ${navColors.border}`,
                  mt: 1,
                  minWidth: 200,
                },
              }}
            >
              {/* Theme Selector */}
              <Box sx={{ px: 2, py: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: navColors.title_color,
                    opacity: 0.7,
                    mb: 1,
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  Theme
                </Typography>
                {themes.map((theme) => (
                  <MenuItem
                    key={theme}
                    onClick={() => handleThemeSelect(theme)}
                    selected={colorPalette === theme}
                    sx={{
                      color: PALETTE_TEXT_COLORS[colorPalette],
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      fontSize: '0.875rem',
                      py: 0.75,
                      '&:hover': {
                        backgroundColor: navColors.button_hover,
                      },
                      '&.Mui-selected': {
                        backgroundColor: navColors.button_color + '20',
                        color: navColors.button_color,
                        '&:hover': {
                          backgroundColor: navColors.button_color + '30',
                        },
                      },
                    }}
                  >
                    <PaletteIcon sx={{ mr: 1.5, fontSize: 18 }} />
                    {theme}
                  </MenuItem>
                ))}
              </Box>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;

