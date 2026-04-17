import { createTheme, type ThemeOptions } from '@mui/material/styles';

const lightColors = {
  background: '#f5f5f5',
  text: '#212121',
  textSecondary: '#616161',
};

const darkColors = {
  background: '#121212',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
};

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return {
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: colors.background,
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: colors.text,
        secondary: colors.textSecondary,
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  };
};

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));