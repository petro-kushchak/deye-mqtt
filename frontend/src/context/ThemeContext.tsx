import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  colors: {
    background: string;
    backgroundAlt: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    cardAlt: string;
    success: string;
    warning: string;
    info: string;
    error: string;
    disabled: string;
    arrowInactive: string;
  };
}

const lightColors = {
  background: '#f5f5f5',
  backgroundAlt: '#ffffff',
  text: '#212121',
  textSecondary: '#616161',
  border: '#e0e0e0',
  card: '#ffffff',
  cardAlt: '#e8e8e8',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#0288d1',
  error: '#d32f2f',
  disabled: '#9e9e9e',
  arrowInactive: '#bdbdbd',
};

const darkColors = {
  background: '#121212',
  backgroundAlt: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  card: '#1e1e1e',
  cardAlt: '#2d2d2d',
  success: '#4caf50',
  warning: '#ff9800',
  info: '#0288d1',
  error: '#d32f2f',
  disabled: '#9e9e9e',
  arrowInactive: '#555555',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'deye-dashboard-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as ThemeMode) || 'light';
  });

  const colors = mode === 'dark' ? darkColors : lightColors;

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    const newColors = newMode === 'dark' ? darkColors : lightColors;
    
    // Update immediately before React renders
    document.body.style.backgroundColor = newColors.background;
    document.body.style.color = newColors.text;
    document.documentElement.style.backgroundColor = newColors.background;
    document.querySelector('header')?.setAttribute('style', `background-color: ${newColors.cardAlt} !important`);
    document.querySelector('.MuiToolbar-root')?.setAttribute('style', `background-color: ${newColors.cardAlt} !important`);
    
    setMode(newMode);
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      document.body.style.backgroundColor = colors.background;
      document.body.style.color = colors.text;
      document.documentElement.style.backgroundColor = colors.background;
    });
  }, [colors]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}