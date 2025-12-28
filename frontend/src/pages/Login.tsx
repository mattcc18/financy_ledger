import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';

const Login: React.FC = () => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            backgroundColor: colors.card_bg,
            borderRadius: 4,
            border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
            boxShadow: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: colors.card_text,
                  textAlign: 'center',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Sign In
              </Typography>

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: colors.card_text,
                        backgroundColor: colors.card_bg,
                        '& fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.3),
                        },
                        '&:hover fieldset': {
                          borderColor: colors.card_subtext + getBorderOpacity(0.5),
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.card_accent,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.card_subtext,
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.card_accent,
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                      backgroundColor: colors.card_accent,
                      '&:hover': {
                        backgroundColor: colors.card_accent,
                        opacity: 0.9,
                      },
                      py: 1.5,
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Stack>
              </form>

              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: colors.card_subtext,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  style={{
                    color: colors.card_accent,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;

