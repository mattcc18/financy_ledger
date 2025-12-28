import React from 'react';
import {
  Home,
  ShoppingBag,
  Savings,
  Restaurant,
  LocalGroceryStore,
  ElectricBolt,
  WaterDrop,
  Phone,
  Wifi,
  DirectionsCar,
  Flight,
  Movie,
  SportsEsports,
  MusicNote,
  FitnessCenter,
  School,
  HealthAndSafety,
  AccountBalance,
  TrendingUp,
} from '@mui/icons-material';
import { BudgetCategory, IncomeSource } from './types';

export const getOpacity = (opacity: number): string => {
  return Math.round(opacity * 255).toString(16).padStart(2, '0');
};

export const getBorderOpacity = (opacity: number): string => {
  return Math.round(opacity * 255).toString(16).padStart(2, '0');
};

export const hexToRgba = (hex: string | undefined, opacity: number): string => {
  if (!hex) {
    // Default to a neutral gray if hex is undefined
    return `rgba(128, 128, 128, ${opacity})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const iconMap: { [key: string]: React.ReactElement } = {
  'home': <Home />,
  'grocery': <LocalGroceryStore />,
  'restaurant': <Restaurant />,
  'utilities': <ElectricBolt />,
  'water': <WaterDrop />,
  'phone': <Phone />,
  'wifi': <Wifi />,
  'car': <DirectionsCar />,
  'flight': <Flight />,
  'movie': <Movie />,
  'gaming': <SportsEsports />,
  'music': <MusicNote />,
  'fitness': <FitnessCenter />,
  'school': <School />,
  'health': <HealthAndSafety />,
  'shopping': <ShoppingBag />,
  'savings': <Savings />,
  'bank': <AccountBalance />,
  'investment': <TrendingUp />,
};

export const availableIcons = Object.keys(iconMap);

export const getIconForCategory = (category: BudgetCategory): React.ReactElement => {
  if (category.icon && iconMap[category.icon]) {
    return iconMap[category.icon];
  }
  // Default icons by type
  if (category.type === 'needs') return <Home />;
  if (category.type === 'wants') return <ShoppingBag />;
  return <Savings />;
};

export const getIconForIncomeSource = (source: IncomeSource): React.ReactElement => {
  if (source.icon && iconMap[source.icon]) {
    return iconMap[source.icon];
  }
  // Default icon for income
  return <AccountBalance />;
};

export const getTypeConfig = (type: 'needs' | 'wants' | 'savings', totals: any, colorPalette: string = 'Light Mode') => {
  // Colors matching Financial Overview chart in dark mode
  const isDarkMode = colorPalette === 'Dark Mode';
  const needsColor = isDarkMode ? '#60A5FA' : '#FF6B6B'; // Blue (Net Worth) in dark, red in light
  const wantsColor = isDarkMode ? '#10B981' : '#4ECDC4'; // Green (Cash) in dark, teal in light
  const savingsColor = isDarkMode ? '#F59E0B' : '#95E1D3'; // Yellow/Orange (Investment) in dark, mint in light

  switch (type) {
    case 'needs':
      return {
        color: needsColor,
        accentColor: needsColor,
        label: 'NEEDS',
        total: totals.needs,
        percent: totals.needsPercent,
      };
    case 'wants':
      return {
        color: wantsColor,
        accentColor: wantsColor,
        label: 'WANTS',
        total: totals.wants,
        percent: totals.wantsPercent,
      };
    case 'savings':
      return {
        color: savingsColor,
        accentColor: savingsColor,
        label: 'SAVINGS',
        total: totals.savings,
        percent: totals.savingsPercent,
      };
  }
};



