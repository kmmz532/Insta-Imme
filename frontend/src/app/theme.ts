import { createTheme } from '@mui/material/styles';

/** Insta-Imme ダークテーマ - Instagram風グラデーションアクセント */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E040FB',
      light: '#FF79FF',
      dark: '#AA00C7',
    },
    secondary: {
      main: '#FF6D00',
      light: '#FF9E40',
      dark: '#C43E00',
    },
    background: {
      default: '#0A0A0F',
      paper: '#14141F',
    },
    error: {
      main: '#FF5252',
    },
    success: {
      main: '#69F0AE',
    },
    text: {
      primary: '#F5F5F5',
      secondary: '#A0A0B0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '10px 24px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #E040FB 0%, #FF6D00 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF79FF 0%, #FF9E40 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(20, 20, 31, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
  },
});
