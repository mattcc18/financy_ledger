import { useCallback } from 'react';
import { getPeriodDates } from '../utils';

export const usePeriodNavigation = (
  selectedMonth: string,
  frequency: 'weekly' | 'monthly',
  startDay: number,
  onMonthChange: (month: string) => void
) => {
  const navigateToPreviousPeriod = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (frequency === 'monthly') {
      // Move to previous month
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      onMonthChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
    } else {
      // For weekly, move back 7 days from the current period start
      const { start } = getPeriodDates(selectedMonth, frequency, startDay);
      const prevPeriodStart = new Date(start);
      prevPeriodStart.setDate(start.getDate() - 7);
      const prevYear = prevPeriodStart.getFullYear();
      const prevMonth = prevPeriodStart.getMonth() + 1;
      onMonthChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
    }
  }, [selectedMonth, frequency, startDay, onMonthChange]);

  const navigateToNextPeriod = useCallback(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (frequency === 'monthly') {
      // Move to next month
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      onMonthChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
    } else {
      // For weekly, move forward 7 days from the current period end
      const { end } = getPeriodDates(selectedMonth, frequency, startDay);
      const nextPeriodStart = new Date(end);
      nextPeriodStart.setDate(end.getDate() + 1);
      const nextYear = nextPeriodStart.getFullYear();
      const nextMonth = nextPeriodStart.getMonth() + 1;
      onMonthChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
    }
  }, [selectedMonth, frequency, startDay, onMonthChange]);

  return {
    navigateToPreviousPeriod,
    navigateToNextPeriod,
  };
};



