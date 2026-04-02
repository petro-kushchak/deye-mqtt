import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#fb8c00',
    },
    error: {
      main: '#ef5350',
      light: '#e57373',
      dark: '#e53935',
    },
    background: {
      default: '#f5f5f5',
      paper: '#e0e0e0',
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
    divider: '#bdbdbd',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #bdbdbd',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#e0e0e0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          color: '#212121',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
