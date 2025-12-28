import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { api, Goal } from '../services/api';
import { currencyFormat } from '../utils/formatting';
import { getDashboardPalette, PALETTE_BACKGROUNDS } from '../config/colorPalettes';
import { useTheme } from '../contexts/ThemeContext';
import { useDashboard } from '../contexts/DashboardContext';
import { hexToRgba, getBorderOpacity } from '../components/dashboard/utils';

const GoalsPage: React.FC = () => {
  const { colorPalette } = useTheme();
  const { selectedCurrency } = useDashboard();
  const colors = getDashboardPalette(colorPalette);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'savings',
    target_amount: '',
    current_amount: '',
    currency: 'EUR',
    target_date: '',
    description: '',
    icon: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const goalsData = await api.getGoals();
      setGoals(goalsData);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        goal_type: goal.goal_type,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        currency: goal.currency,
        target_date: goal.target_date || '',
        description: goal.description || '',
        icon: goal.icon || '',
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        goal_type: 'savings',
        target_amount: '',
        current_amount: '',
        currency: 'EUR',
        target_date: '',
        description: '',
        icon: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    if (!formData.name.trim() || !formData.target_amount) {
      setError('Name and target amount are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const goalData = {
        name: formData.name,
        goal_type: formData.goal_type,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        currency: formData.currency,
        target_date: formData.target_date || null,
        description: formData.description || null,
        icon: formData.icon || null,
      };

      if (editingGoal) {
        await api.updateGoal(editingGoal.goal_id, goalData);
      } else {
        await api.createGoal(goalData);
      }

      await loadGoals();
      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      setSaving(true);
      setError(null);
      await api.deleteGoal(goalId);
      await loadGoals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setSaving(false);
    }
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return colors.cash;
    if (progress >= 75) return colors.card_accent;
    if (progress >= 50) return '#FFA500';
    return '#EF4444';
  };

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
          pt: { xs: 10, sm: 11 },
          pb: 6,
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: PALETTE_BACKGROUNDS[colorPalette],
        pt: { xs: 10, sm: 11 },
        pb: 6,
        px: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                color: colors.card_text,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              Goals
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: colors.card_accent,
                '&:hover': {
                  backgroundColor: colors.card_accent,
                  opacity: 0.9,
                },
              }}
            >
              New Goal
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <Grid container spacing={3}>
            {goals.map((goal) => {
              const progress = calculateProgress(goal);
              const progressColor = getProgressColor(progress);
              const daysRemaining = goal.target_date
                ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Grid item xs={12} sm={6} md={4} key={goal.goal_id}>
                  <Card
                    sx={{
                      backgroundColor: colors.card_bg,
                      borderRadius: 4,
                      border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Header with Edit/Delete */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: colors.card_text,
                              fontWeight: 700,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                              mb: 0.5,
                            }}
                          >
                            {goal.name}
                          </Typography>
                          <Chip
                            label={goal.goal_type}
                            size="small"
                            sx={{
                              backgroundColor: hexToRgba(colors.card_accent, 0.2),
                              color: colors.card_text,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          />
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(goal)}
                            sx={{ color: colors.card_subtext }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteGoal(goal.goal_id)}
                            sx={{ color: '#EF4444' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {/* Progress */}
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.card_subtext,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            Progress
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.card_text,
                              fontWeight: 600,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            {progress.toFixed(1)}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: hexToRgba(colors.card_subtext, 0.1),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: progressColor,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>

                      {/* Amounts */}
                      <Box sx={{ mb: 2 }}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.card_subtext,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              Current
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: colors.card_text,
                                fontWeight: 600,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              {currencyFormat(goal.current_amount, goal.currency)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.card_subtext,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              Target
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: colors.card_text,
                                fontWeight: 600,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              {currencyFormat(goal.target_amount, goal.currency)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.card_subtext,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              Remaining
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: goal.target_amount - goal.current_amount > 0 ? '#EF4444' : colors.cash,
                                fontWeight: 600,
                                fontFamily: 'Inter, -apple-system, sans-serif',
                              }}
                            >
                              {currencyFormat(Math.max(0, goal.target_amount - goal.current_amount), goal.currency)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>

                      {/* Target Date */}
                      {goal.target_date && (
                        <Box sx={{ mt: 'auto' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.card_subtext,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                            }}
                          >
                            {daysRemaining !== null && daysRemaining > 0
                              ? `${daysRemaining} days remaining`
                              : daysRemaining === 0
                              ? 'Due today'
                              : `Overdue by ${Math.abs(daysRemaining)} days`}
                          </Typography>
                        </Box>
                      )}

                      {/* Description */}
                      {goal.description && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.card_subtext,
                              fontFamily: 'Inter, -apple-system, sans-serif',
                              fontStyle: 'italic',
                            }}
                          >
                            {goal.description}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Alert severity="info">No goals found. Create a goal to get started.</Alert>
        )}

        {/* Create/Edit Goal Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colors.card_bg,
            },
          }}
        >
          <DialogTitle sx={{ color: colors.card_text, fontFamily: 'Inter, -apple-system, sans-serif' }}>
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Goal Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.card_subtext }}>Goal Type</InputLabel>
                <Select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  sx={{
                    color: colors.card_text,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + getBorderOpacity(0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + getBorderOpacity(0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                  }}
                >
                  <MenuItem value="savings">Savings</MenuItem>
                  <MenuItem value="investment">Investment</MenuItem>
                  <MenuItem value="debt">Debt</MenuItem>
                  <MenuItem value="purchase">Purchase</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Target Amount"
                fullWidth
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
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
                label="Current Amount"
                fullWidth
                type="number"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
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
              <FormControl fullWidth>
                <InputLabel sx={{ color: colors.card_subtext }}>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  sx={{
                    color: colors.card_text,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + getBorderOpacity(0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_subtext + getBorderOpacity(0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.card_accent,
                    },
                  }}
                >
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="CHF">CHF</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Target Date (Optional)"
                fullWidth
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
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
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={saving} sx={{ color: colors.card_text }}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveGoal}
              variant="contained"
              disabled={saving || !formData.name.trim() || !formData.target_amount}
              sx={{
                backgroundColor: colors.card_accent,
                '&:hover': {
                  backgroundColor: colors.card_accent,
                  opacity: 0.9,
                },
                '&.Mui-disabled': {
                  backgroundColor: colors.card_subtext + '40',
                },
              }}
            >
              {saving ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default GoalsPage;



