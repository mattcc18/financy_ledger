import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Paper, Stack, Box, Typography } from '@mui/material';
import { Flight } from '@mui/icons-material';
import { currencyFormat } from '../../utils/formatting';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import { ExpenseTrackingColors, TripData } from './types';
import { Transaction } from '../../services/api';

interface TripExpensesCardProps {
  tripData: TripData | null;
  tripExpenses: Transaction[];
  displayCurrency: string;
  colors: ExpenseTrackingColors;
  colorPalette: string;
}

export const TripExpensesCard: React.FC<TripExpensesCardProps> = ({
  tripData,
  tripExpenses: allTripExpenses,
  displayCurrency,
  colors,
  colorPalette,
}) => {
  const navigate = useNavigate();
  // Process trip data
  const tripsWithData = useMemo(() => {
    if (!tripData) return [];
    return tripData.labels.map((label, index) => {
      // Extract trip ID from label (format: "Trip {tripId}")
      const tripId = label.replace(/^Trip /, '');
      const latestDate = tripData.latestDates[tripId] || new Date(); // Fallback to current date if missing
      return {
        label,
        amount: tripData.values[index],
        count: tripData.counts[index],
        color: tripData.colors[index],
        latestDate,
      };
    }).filter(trip => trip.latestDate instanceof Date) // Filter out invalid dates
      .sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
  }, [tripData]);

  // Group trips by month
  const tripsByMonth = useMemo(() => {
    const grouped: { [monthKey: string]: typeof tripsWithData } = {};
    tripsWithData.forEach(trip => {
      // Ensure latestDate exists and is a valid Date object
      if (!trip.latestDate || !(trip.latestDate instanceof Date)) {
        return; // Skip trips with invalid dates
      }
      const monthKey = `${trip.latestDate.getFullYear()}-${String(trip.latestDate.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(trip);
    });
    return grouped;
  }, [tripsWithData]);

  const sortedMonths = useMemo(() => {
    return Object.keys(tripsByMonth).sort((a, b) => b.localeCompare(a));
  }, [tripsByMonth]);

  if (!tripData) return null;

  return (
    <>
      {/* Trip Expenses Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              background: colors.card_bg,
              borderRadius: 4,
              border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
              p: 3,
              height: 500,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              '&:hover': {
                borderColor: colors.card_subtext + '30',
                boxShadow: 3,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Flight sx={{ color: colors.card_accent, fontSize: 22 }} />
              <Typography
                variant="h6"
                sx={{
                  color: colors.card_text,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                Expenses by Trip
              </Typography>
            </Stack>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                pr: 1,
                pb: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: colorPalette === 'Dark Mode' ? '#1A1A1A' : '#F5F5F5',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: colors.card_subtext + '40',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: colors.card_subtext + '60',
                  },
                },
              }}
            >
              <Stack spacing={3}>
                {sortedMonths.map((monthKey) => {
                  const monthTrips = tripsByMonth[monthKey];
                  const monthDate = new Date(monthKey + '-01');
                  const monthLabel = monthDate.toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'long'
                  });

                  return (
                    <Box key={monthKey}>
                      <Typography
                        sx={{
                          color: colors.card_text,
                          fontWeight: 600,
                          fontSize: '1rem',
                          fontFamily: 'Inter, -apple-system, sans-serif',
                          mb: 1.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {monthLabel}
                      </Typography>
                      <Stack spacing={0.5}>
                        {monthTrips.map((trip) => {
                          const transactionText = trip.count === 1 ? 'transaction' : 'transactions';
                          return (
                            <Box
                              key={trip.label}
                              onClick={() => navigate(`/expenses/trip/${encodeURIComponent(trip.label)}`)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                p: 1.5,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: colorPalette === 'Dark Mode' ? '#2A2A2A' : '#FAFAFA',
                                },
                                transition: 'background-color 0.2s',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: hexToRgba(trip.color, 0.15),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: trip.color,
                                  flexShrink: 0,
                                }}
                              >
                                <Flight sx={{ fontSize: 20 }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  sx={{
                                    color: colors.card_text,
                                    fontWeight: 500,
                                    fontSize: '0.95rem',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                    mb: 0.25,
                                  }}
                                >
                                  {trip.label}
                                </Typography>
                                <Typography
                                  sx={{
                                    color: colors.card_subtext,
                                    fontSize: '0.75rem',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                  }}
                                >
                                  {trip.count} {transactionText}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                <Typography
                                  sx={{
                                    color: colors.card_text,
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    fontFamily: 'Inter, -apple-system, sans-serif',
                                  }}
                                >
                                  {currencyFormat(trip.amount, displayCurrency)}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

