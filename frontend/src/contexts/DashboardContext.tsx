import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  currencies: string[];
  setCurrencies: (currencies: string[]) => void;
  availableDates: string[];
  setAvailableDates: (dates: string[]) => void;
  formatDateForDisplay: (date: string) => string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('GBP');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const formatDateForDisplay = (date: string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <DashboardContext.Provider value={{
      selectedCurrency,
      setSelectedCurrency,
      selectedDate,
      setSelectedDate,
      currencies,
      setCurrencies,
      availableDates,
      setAvailableDates,
      formatDateForDisplay,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};



