import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { Box, Container, Grid, Typography, Alert, CircularProgress } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
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
          <Typography variant="h5" sx={{ mb: 2 }}>
            Power Overview
          </Typography>
        </Grid>

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

        <PVStrings />

        <Grid item xs={12} xl={4}>
          <SystemInfo />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mt: 2 }}>
            Energy Statistics
          </Typography>
        </Grid>

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