import React from 'react';
import { Transaction } from '../../services/api';
import { getBorderOpacity, hexToRgba } from '../budget/utils';
import {
  Home,
  ShoppingBag,
  Restaurant,
  LocalGroceryStore,
  Flight,
  DirectionsBus,
  Mail,
  Business,
  ShoppingCart,
  AttachMoney,
  CurrencyExchange,
  Receipt,
} from '@mui/icons-material';

// Helper to convert hex color to rgba string for hover effects
const hexToRgbaString = (hex: string, opacity: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
    return `rgba(128, 128, 128, ${opacity})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const getCardStyles = (
  colors: any,
  accentColor: string,
  hoverColor?: string
) => ({
  background: colors.card_bg,
  borderRadius: 3,
  border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
  p: 2.5,
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  '&:hover': {
    borderColor: (hoverColor || accentColor) + '40',
    boxShadow: 2,
  },
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

export const getIconBoxStyles = (accentColor: string) => ({
  width: 36,
  height: 36,
  borderRadius: 2,
  backgroundColor: `${accentColor}20`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const getLabelStyles = (colors: any) => ({
  color: colors.card_subtext,
  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.8rem' },
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.03em',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
  mb: 0.5,
});

export const getValueStyles = (colors: any, color?: string) => ({
  color: color || colors.card_text,
  fontWeight: 600,
  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
});

export const getCaptionStyles = (colors: any, color?: string) => ({
  color: color || colors.card_subtext,
  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem' },
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
  fontWeight: 400,
  mt: 0.5,
});

export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: { [key: string]: number }
): number => {
  if (fromCurrency === toCurrency) return amount;
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[rateKey] || 1;
  return amount * rate;
};

export const formatPeriod = (
  start: Date,
  end: Date
): string => {
  const startDay = start.getDate();
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  
  // Add ordinal suffix
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(startDay)} ${startMonth} - ${getOrdinal(endDay)} ${endMonth}`;
};

export const getPeriodDates = (
  selectedMonth: string,
  frequency: 'weekly' | 'monthly',
  startDay: number
): { start: Date; end: Date } => {
  const [year, month] = selectedMonth.split('-').map(Number);
  let periodStart: Date;
  let periodEnd: Date;
  
  if (frequency === 'monthly') {
    if (startDay === 1) {
      periodEnd = new Date(year, month, 0);
      periodEnd.setHours(23, 59, 59, 999);
      periodStart = new Date(year, month - 1, startDay);
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodEnd = new Date(year, month, startDay - 1);
      periodEnd.setHours(23, 59, 59, 999);
      periodStart = new Date(year, month - 1, startDay);
      periodStart.setHours(0, 0, 0, 0);
    }
  } else {
    // Weekly
    const lastDayOfSelectedMonth = new Date(year, month, 0).getDate();
    if (lastDayOfSelectedMonth >= startDay) {
      periodStart = new Date(year, month - 1, startDay);
    } else {
      periodStart = new Date(year, month - 1, lastDayOfSelectedMonth);
    }
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
    const selectedMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    if (periodEnd > selectedMonthEnd) {
      periodEnd.setTime(selectedMonthEnd.getTime());
    }
  }
  
  return { start: periodStart, end: periodEnd };
};

// Get color for category
export const getCategoryColor = (category: string, index: number, colorPalette: string, donutColors: string[]) => {
  const budgetCategoryColors: { [key: string]: string } = {
    'needs': colorPalette === 'Dark Mode' ? '#60A5FA' : '#E53935',
    'wants': colorPalette === 'Dark Mode' ? '#10B981' : '#00897B',
    'savings': colorPalette === 'Dark Mode' ? '#F59E0B' : '#1976D2',
  };
  
  const lowerCategory = category.toLowerCase();
  if (budgetCategoryColors[lowerCategory]) {
    return budgetCategoryColors[lowerCategory];
  }
  
  // Default colors if donutColors is empty or undefined
  const defaultColors = colorPalette === 'Dark Mode' 
    ? ['#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    : ['#1976D2', '#00897B', '#F57C00', '#E53935', '#7B1FA2', '#C2185B'];
  
  const colors = (donutColors && donutColors.length > 0) ? donutColors : defaultColors;
  return colors[index % colors.length];
};

// Get icon for category
export const getCategoryIcon = (category: string): React.ReactElement => {
  const lowerCategory = category.toLowerCase();
  const iconMap: { [key: string]: React.ReactElement } = {
    'rent': React.createElement(Home),
    'home': React.createElement(Home),
    'groceries': React.createElement(LocalGroceryStore),
    'grocery': React.createElement(LocalGroceryStore),
    'restaurants': React.createElement(Restaurant),
    'restaurant': React.createElement(Restaurant),
    'wants': React.createElement(ShoppingBag),
    'shopping': React.createElement(ShoppingCart),
    'travel': React.createElement(Flight),
    'transport': React.createElement(DirectionsBus),
    'transportation': React.createElement(DirectionsBus),
    'bills': React.createElement(Mail),
    'services': React.createElement(Business),
    'needs': React.createElement(Home),
    'savings': React.createElement(AttachMoney),
  };
  
  if (iconMap[lowerCategory]) {
    return iconMap[lowerCategory];
  }
  
  // Try partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
      return icon;
    }
  }
  
  return React.createElement(Receipt);
};

// Get color for currency
export const getCurrencyColor = (currency: string, index: number, colorPalette: string, donutColors: string[]) => {
  const currencyColors: { [key: string]: string } = {
    'GBP': colorPalette === 'Dark Mode' ? '#10B981' : '#00897B',
    'EUR': colorPalette === 'Dark Mode' ? '#3B82F6' : '#1976D2',
    'USD': colorPalette === 'Dark Mode' ? '#8B5CF6' : '#7B1FA2',
    'CHF': colorPalette === 'Dark Mode' ? '#F59E0B' : '#F57C00',
  };
  
  if (currencyColors[currency]) {
    return currencyColors[currency];
  }
  
  return donutColors[index % donutColors.length];
};

// Get icon for currency
export const getCurrencyIcon = (currency: string): React.ReactElement => {
  return React.createElement(CurrencyExchange);
};



