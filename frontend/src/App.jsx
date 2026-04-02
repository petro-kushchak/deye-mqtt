import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Container, Grid, Typography, Card, CardContent, Chip, Alert, CircularProgress, AppBar, Toolbar, Tabs, Tab } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import theme from './theme';
import EnergyFlow from './components/EnergyFlow.jsx';
import StatCard from './components/StatCard.jsx';

function App() {
  const [config, setConfig] = useState(null);
  const [inverters, setInverters] = useState({});
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [backendVersion, setBackendVersion] = useState(null);

  useEffect(() => {
    fetch('/config.json')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({ backendUrl: '', backendWsUrl: '', accessKey: '' }));
  }, []);

  const apiUrl = config?.backendUrl || '';
  const accessKey = config?.accessKey || '';
  const wsUrl = config?.backendWsUrl || (config?.backendUrl ? config.backendUrl.replace(/^http/, 'ws') : `ws://${window.location.host}/ws`);
  const wsUrlWithKey = accessKey ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}access_key=${accessKey}` : wsUrl;

  const enrichMetrics = (metrics) => ({
    ...metrics,
    pv_power: metrics.pv_power,
    pv1_power: metrics.pv1_power || 0,
    pv2_power: metrics.pv2_power || 0,
    pv1_voltage: metrics.pv1_voltage || 0,
    pv2_voltage: metrics.pv2_voltage || 0,
    pv1_current: metrics.pv1_current || 0,
    pv2_current: metrics.pv2_current || 0,
    battery_soc: metrics.battery_soc|| 0,
    battery_power: metrics.battery_power || 0,
    grid_power: metrics.grid_power || 0,
    total_load_power: metrics.total_load_power || 0,
    battery_status: metrics.battery_status || 'Stand-by',
  });

  useEffect(() => {
    if (!config) return;
    const versionUrl = accessKey ? `${apiUrl}/api/version?access_key=${accessKey}` : `${apiUrl}/api/version`;
    fetch(versionUrl)
      .then(res => res.json())
      .then(data => setBackendVersion(data.version))
      .catch(() => setBackendVersion('unknown'));
  }, [config, apiUrl, accessKey]);

  useEffect(() => {
    if (!config) return;
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(wsUrlWithKey);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (Array.isArray(data) && data.length > 0) {
            const metrics = data[0];
            const serial = metrics.serial || 'unknown';
            const enrichedMetrics = enrichMetrics(metrics);
            
            setInverters(prev => {
              const updated = { ...prev, [serial]: enrichedMetrics };
              if (!selectedInverter) {
                setSelectedInverter(serial);
              }
              return updated;
            });
            setLastUpdate(new Date());
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [config, wsUrlWithKey]);

  const status = selectedInverter ? inverters[selectedInverter] : null;
  const inverterSerials = Object.keys(inverters);
  const hasMetrics = status && status.pv_power !== undefined;

  const getInverterStatus = () => {
    if (!status) return { label: 'Unknown', color: 'default' };
    const runningStatus = status['Running Status'] || 'Stand-by';
    const colors = {
      'Stand-by': 'default',
      'Self-checking': 'info',
      'Normal': 'success',
      'FAULT': 'error',
    };
    return { label: runningStatus, color: colors[runningStatus] || 'default' };
  };

  const inverterStatus = getInverterStatus();

  if (!config || (!connected && Object.keys(inverters).length === 0)) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2, bgcolor: '#f5f5f5' }}>
          <CircularProgress />
          <Typography sx={{ color: '#616161' }}>Connecting to inverter...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 4 }}>
        <AppBar position="fixed" elevation={1} sx={{ bgcolor: '#e0e0e0', zIndex: (theme) => theme.zIndex.appBar }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                size="small" 
                label={connected ? 'Connected' : 'Disconnected'} 
                color={connected ? 'success' : 'error'}
                sx={{ mr: 1 }}
              />
              Solar Dashboard
            </Typography>
            <Chip 
              label={inverterStatus.label} 
              color={inverterStatus.color} 
              size="small" 
              sx={{ mr: 2 }}
            />
            {lastUpdate && (
              <Typography variant="caption" sx={{ color: '#616161' }}>
                {lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
          </Toolbar>
          {inverterSerials.length > 1 && (
            <Tabs 
              value={selectedInverter} 
              onChange={(e, val) => setSelectedInverter(val)}
              sx={{ bgcolor: '#e0e0e0', minHeight: 40 }}
              textColor="primary"
              indicatorColor="primary"
            >
              {inverterSerials.map(serial => (
                <Tab 
                  key={serial} 
                  value={serial} 
                  label={serial.slice(-6)} 
                  sx={{ minHeight: 40, fontSize: '0.8rem' }}
                />
              ))}
            </Tabs>
          )}
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: inverterSerials.length > 1 ? 16 : 12 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!hasMetrics && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              icon={<WarningAmberIcon fontSize="inherit" />}
            >
              No inverter data available. Make sure the inverter is connected.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 2, color: '#616161' }}>
                Power Overview
              </Typography>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Solar Production"
                value={status?.pv_power || 0}
                unit="W"
                color="#ff9800"
                subLabel={`PV1: ${status?.pv1_power || 0}W | PV2: ${status?.pv2_power || 0}W`}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
                label="Battery"
                value={Math.abs(status?.battery_power || 0)}
                unit="W"
                color={status?.battery_power < 0 ? '#4caf50' : '#ff9800'}
                subLabel={`SOC: ${status?.battery_soc || 0}% | ${status?.battery_status || 'Stand-by'}`}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<GridOnIcon sx={{ fontSize: 40 }} />}
                label="Grid"
                value={Math.abs(status?.grid_power || 0)}
                unit="W"
                color={status?.grid_power > 0 ? '#4caf50' : status?.grid_power < 0 ? '#ff9800' : '#9e9e9e'}
                subLabel={status?.grid_power < 0 ? 'Exporting' : status?.grid_power > 0 ? 'Importing' : 'Idle'}
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<HomeIcon sx={{ fontSize: 40 }} />}
                label="Home Load"
                value={status?.total_load_power || 0}
                unit="W"
                color="#0288d1"
                subLabel="Current consumption"
              />
            </Grid>

            <Grid item xs={12} xl={8}>
              <EnergyFlow data={status || {}} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 2, color: '#616161', mt: 2 }}>
                PV String Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: '#e65100' }}>
                    PV1
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Voltage</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv1_voltage || 0).toFixed(1)} V</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Current</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv1_current || 0).toFixed(1)} A</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Power</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv1_power || 0).toFixed(0)} W</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ height: '100%', bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: '#e65100' }}>
                    PV2
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Voltage</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv2_voltage || 0).toFixed(1)} V</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Current</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv2_current || 0).toFixed(1)} A</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Power</Typography>
                      <Typography variant="body2" sx={{ color: '#212121', fontWeight: 'bold' }}>{(status?.pv2_power || 0).toFixed(0)} W</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} xl={4}>
              <Card sx={{ height: '100%', bgcolor: '#e0e0e0' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: '#212121' }}>
                    System Info
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Serial</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{selectedInverter || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Work Mode</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{status?.['work_mode'] || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Grid Status</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{status?.['grid_connected_status'] || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Battery Voltage</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{(status?.['battery_voltage'] || 0).toFixed(1)} V</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Battery Temperature</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{(status?.['battery_temperature'] || 0).toFixed(1)} °C</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>DC Temperature</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{(status?.['dc_temperature'] || 0).toFixed(1)} °C</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>AC Temperature</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{(status?.['ac_temperature'] || 0).toFixed(1)} °C</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Grid Frequency</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{((status?.['grid_frequency'] || 0) / 100).toFixed(2)} Hz</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#616161' }}>Backend Version</Typography>
                      <Typography variant="body2" sx={{ color: '#212121' }}>{backendVersion || '...'}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 2, color: '#616161', mt: 2 }}>
                Energy Statistics
              </Typography>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Daily Production"
                value={(status?.['daily_production'] || 0)}
                unit="kWh"
                color="#ff9800"
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<SolarPowerIcon sx={{ fontSize: 40 }} />}
                label="Total Production"
                value={(status?.['total_production'] || 0) / 1000}
                unit="MWh"
                color="#ffb300"
                subLabel="All time"
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<HomeIcon sx={{ fontSize: 40 }} />}
                label="Daily Load"
                value={(status?.['daily_load_consumption'] || 0)}
                unit="kWh"
                color="#0288d1"
              />
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <StatCard
                icon={<BatteryChargingFullIcon sx={{ fontSize: 40 }} />}
                label="Daily Battery Charge"
                value={(status?.['daily_battery_charge'] || 0)}
                unit="kWh"
                color="#4caf50"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
