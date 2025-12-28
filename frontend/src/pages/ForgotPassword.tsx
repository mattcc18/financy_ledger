import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { api } from '../services/api';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { getBorderOpacity } from '../components/dashboard/utils';

const ForgotPassword: React.FC = () => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await api.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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
                Reset Password
              </Typography>

              {success && (
                <Alert severity="success">
                  If an account with that email exists, a password reset link has been sent to your email.
                </Alert>
              )}

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {!success ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.card_subtext,
                      textAlign: 'center',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                    }}
                  >
                    Enter your email address and we'll send you a link to reset your password.
                  </Typography>

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
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </Stack>
                  </form>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  fullWidth
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
                  Back to Login
                </Button>
              )}

              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: colors.card_subtext,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Remember your password?{' '}
                <Link
                  to="/login"
                  style={{
                    color: colors.card_accent,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPassword;

