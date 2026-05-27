import { useState } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { Box, Container, Typography, Tabs, Tab, CircularProgress, IconButton } from '@mui/material';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { lightTheme, darkTheme } from './theme';
import { ThemeProvider as AppThemeProvider, useTheme } from './context/ThemeContext';
import { InverterProvider, useInverter } from './context/InverterContext';
import FacilitySummaryBar from './components/FacilitySummaryBar';
import FacilityDashboard from './components/FacilityDashboard';
import Header from './components/Header';

function AppContent() {
  const { configLoading, facilities, selectedFacility, selectFacility } = useInverter();
  const { colors } = useTheme();

  const [openPower, setOpenPower] = useState(() => localStorage.getItem('deye-section-power') !== 'false');
  const [openHistory, setOpenHistory] = useState(() => localStorage.getItem('deye-section-history') !== 'false');
  const [openPV, setOpenPV] = useState(() => localStorage.getItem('deye-section-pv') !== 'false');
  const [openStats, setOpenStats] = useState(() => localStorage.getItem('deye-section-stats') !== 'false');

  const allOpen = openPower && openHistory && openPV && openStats;

  const toggleAll = () => {
    const next = !allOpen;
    setOpenPower(next);
    setOpenHistory(next);
    setOpenPV(next);
    setOpenStats(next);
    localStorage.setItem('deye-section-power', String(next));
    localStorage.setItem('deye-section-history', String(next));
    localStorage.setItem('deye-section-pv', String(next));
    localStorage.setItem('deye-section-stats', String(next));
  };

  if (configLoading) {
    return (
      <>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading configuration...</Typography>
        </Box>
      </>
    );
  }

  const hasAnyData = facilities.some((f) => f.hasMetrics || f.connected);
  const currentFacility = facilities[selectedFacility] ?? null;

  const sectionToggles = {
    onTogglePower: () => { const v = !openPower; setOpenPower(v); localStorage.setItem('deye-section-power', String(v)); },
    onToggleHistory: () => { const v = !openHistory; setOpenHistory(v); localStorage.setItem('deye-section-history', String(v)); },
    onTogglePV: () => { const v = !openPV; setOpenPV(v); localStorage.setItem('deye-section-pv', String(v)); },
    onToggleStats: () => { const v = !openStats; setOpenStats(v); localStorage.setItem('deye-section-stats', String(v)); },
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: 4, pt: 8 }}>
        <Header />
        <FacilitySummaryBar />
        <Container maxWidth="xl" sx={{ mt: 2 }}>

          {facilities.length > 1 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tabs
                  value={selectedFacility}
                  onChange={(_e, val) => selectFacility(val)}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{ flexGrow: 1 }}
                >
                  {facilities.map((f, i) => (
                    <Tab
                      key={i}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: f.connected ? colors.success : colors.error,
                              flexShrink: 0,
                            }}
                          />
                          {f.config.facilityName}
                        </Box>
                      }
                      sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
                    />
                  ))}
                </Tabs>
                <IconButton onClick={toggleAll} size="small" sx={{ color: colors.textSecondary, ml: 1 }} title={allOpen ? 'Collapse all' : 'Expand all'}>
                  {allOpen ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                </IconButton>
              </Box>
            </Box>
          )}

          {!hasAnyData ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2, py: 8 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                Connecting to facilities...
              </Typography>
            </Box>
          ) : currentFacility ? (
            <FacilityDashboard
              key={selectedFacility}
              facility={currentFacility}
              openPower={openPower}
              openHistory={openHistory}
              openPV={openPV}
              openStats={openStats}
              {...sectionToggles}
            />
          ) : null}
        </Container>
      </Box>
    </>
  );
}

function ThemedApp() {
  const { mode } = useTheme();
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <AppContent />
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <InverterProvider>
        <ThemedApp />
      </InverterProvider>
    </AppThemeProvider>
  );
}

export default App;
