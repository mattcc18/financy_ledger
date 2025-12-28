import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { getBorderOpacity } from '../components/dashboard/utils';

const ResetPassword: React.FC = () => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      // Also check hash fragment (Supabase sometimes uses #)
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const hashToken = hashParams.get('access_token') || hashParams.get('token');
      if (hashToken) {
        setToken(hashToken);
      } else {
        setError('No reset token found in URL');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setLoading(true);

    try {
      const response = await api.confirmPasswordReset(token, password);
      
      // If we got an access token, automatically log the user in
      if (response.access_token) {
        // Store token and user info
        localStorage.setItem('auth_token', response.access_token);
        localStorage.setItem('auth_user', JSON.stringify({
          user_id: response.user?.id || response.user?.user_id,
          email: response.user?.email
        }));
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Just show success and redirect to login
        setError(null);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
                Set New Password
              </Typography>

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    helperText="Must be at least 6 characters"
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
                      '& .MuiFormHelperText-root': {
                        color: colors.card_subtext,
                      },
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    disabled={loading || !token}
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
                    {loading ? 'Resetting...' : 'Reset Password'}
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
                <Link
                  to="/login"
                  style={{
                    color: colors.card_accent,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Back to Login
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;

