import { useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { Box, Container, Grid, Typography, Alert, CircularProgress, Collapse, IconButton } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { lightTheme, darkTheme } from './theme';
import { ThemeProvider as AppThemeProvider, useTheme } from './context/ThemeContext';
import { InverterProvider, useInverter } from './context/InverterContext';
import EnergyFlow from './components/EnergyFlow';
import StatCard from './components/StatCard';
import Header from './components/Header';
import PVStrings from './components/PVStrings';
import SystemInfo from './components/SystemInfo';
import { formatPower, getGridStatus, getBatteryStatusLabel, getBatteryStatusColor } from './utils/formatters';

function Dashboard() {
  const { hasMetrics, currentInverter } = useInverter();
  const { colors } = useTheme();
  const [openPower, setOpenPower] = useState(() => localStorage.getItem('deye-section-power') !== 'false');
  const [openPV, setOpenPV] = useState(() => localStorage.getItem('deye-section-pv') !== 'false');
  const [openStats, setOpenStats] = useState(() => localStorage.getItem('deye-section-stats') !== 'false');

  const SectionHeader = ({ title, open, onToggle, storageKey }: { title: string; open: boolean; onToggle: () => void; storageKey: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Typography variant="h5" sx={{ flexGrow: 1 }}>
        {title}
      </Typography>
      <IconButton onClick={() => { onToggle(); localStorage.setItem(storageKey, (!open).toString()); }} size="small" sx={{ color: colors.textSecondary }}>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Box>
  );

  if (!hasMetrics) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 3 }}
        icon={<WarningAmberIcon fontSize="inherit" />}
      >
        No inverter data available. Make sure the inverter is connected.
      </Alert>
    );
  }

  const gridStatus = getGridStatus(currentInverter?.grid_power ?? 0);
  const batteryPower = currentInverter?.battery_power ?? 0;
  const batteryLabel = getBatteryStatusLabel(batteryPower);
  const batteryColor = getBatteryStatusColor(batteryPower);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SectionHeader title="Power Overview" open={openPower} onToggle={() => setOpenPower(!openPower)} storageKey="deye-section-power" />
        </Grid>

        <Collapse in={openPower} sx={{ width: '100%' }}>
          <Grid container spacing={3} sx={{ pl: 2, pr: 2 }}>
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Solar Production"
                value={formatPower(currentInverter?.pv_power)}
                unit="W"
                color={colors.warning}
                subLabel={`PV1: ${formatPower(currentInverter?.pv1_power)}W | PV2: ${formatPower(currentInverter?.pv2_power)}W`}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
                label="Battery"
                value={formatPower(Math.abs(batteryPower))}
                unit="W"
                color={batteryColor}
                subLabel={`SOC: ${formatPower(currentInverter?.battery_soc)}% | ${batteryLabel}`}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<GridOnIcon sx={{ fontSize: 40 }} />}
                label="Grid"
                value={formatPower(Math.abs(currentInverter?.grid_power ?? 0))}
                unit="W"
                color={gridStatus.color}
                subLabel={gridStatus.label}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<HomeIcon sx={{ fontSize: 40 }} />}
                label="Home Load"
                value={formatPower(currentInverter?.total_load_power)}
                unit="W"
                color={colors.info}
                subLabel="Current consumption"
              />
            </Grid>

            <Grid item xs={12} xl={8}>
              <EnergyFlow data={currentInverter ?? {}} />
            </Grid>

            <Grid item xs={12} xl={4}>
              <SystemInfo />
            </Grid>
          </Grid>
        </Collapse>

        <Grid item xs={12}>
          <SectionHeader title="PV Strings" open={openPV} onToggle={() => setOpenPV(!openPV)} storageKey="deye-section-pv" />
        </Grid>

        <Collapse in={openPV} sx={{ width: '100%' }}>
          <PVStrings />
        </Collapse>

        <Grid item xs={12}>
          <SectionHeader title="Energy Statistics" open={openStats} onToggle={() => setOpenStats(!openStats)} storageKey="deye-section-stats" />
        </Grid>

        <Collapse in={openStats} sx={{ width: '100%' }}>
          <Grid container spacing={3} sx={{ pl: 2, pr: 2 }}>
            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Daily Production"
                value={formatPower(currentInverter?.['daily_production'])}
                unit="kWh"
                color={colors.warning}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Total Production"
                value={formatPower(((currentInverter?.['total_production'] ?? 0) / 1000))}
                unit="MWh"
                color={colors.warning}
                subLabel="All time"
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<HomeIcon sx={{ fontSize: 40 }} />}
                label="Daily Load"
                value={formatPower(currentInverter?.['daily_load_consumption'])}
                unit="kWh"
                color={colors.info}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
                label="Daily Battery Charge"
                value={formatPower(currentInverter?.['daily_battery_charge'])}
                unit="kWh"
                color={colors.success}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Grid>
    </>
  );
}

function LoadingScreen() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
      <CircularProgress />
      <Typography>Connecting to inverter...</Typography>
    </Box>
  );
}

function AppContent() {
  const { configLoading, connected, hasMetrics, inverterSerials } = useInverter();
  const { colors } = useTheme();

  if (configLoading || (!connected && !hasMetrics)) {
    return (
      <>
        <CssBaseline />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: 4 }}>
        <Header />
        <Container maxWidth="xl" sx={{ mt: inverterSerials.length > 1 ? 16 : 12 }}>
          <Dashboard />
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