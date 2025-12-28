import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  colorPalette: string;
  setColorPalette: (palette: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get initial theme from localStorage or default to Dark Mode
  const [colorPalette, setColorPaletteState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('colorPalette');
      return saved || 'Dark Mode';
    }
    return 'Dark Mode';
  });

  // Persist theme to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('colorPalette', colorPalette);
    }
  }, [colorPalette]);

  const setColorPalette = (palette: string) => {
    setColorPaletteState(palette);
  };

  return (
    <ThemeContext.Provider value={{ colorPalette, setColorPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};



