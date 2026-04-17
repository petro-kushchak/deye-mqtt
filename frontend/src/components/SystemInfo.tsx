import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { formatVoltage, formatTemperature, formatFrequency, getTimeAgo, isStale } from '../utils/formatters';

function SystemInfo() {
  const { selectedInverter, currentInverter, inverterLastSeen, config, apiUrl, accessKey } = useInverter();
  const { colors } = useTheme();
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    const versionUrl = accessKey ? `${apiUrl}/api/version?access_key=${accessKey}` : `${apiUrl}/api/version`;
    fetch(versionUrl)
      .then((res) => res.json())
      .then((data: { version?: string }) => setBackendVersion(data.version ?? null))
      .catch(() => setBackendVersion('unknown'));
  }, [config, apiUrl, accessKey]);

  if (!currentInverter) return null;

  const lastSeen = selectedInverter ? inverterLastSeen[selectedInverter] : null;
  const stale = isStale(lastSeen);

  return (
    <Card sx={{ height: '100%', bgcolor: colors.cardAlt,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 20px ${colors.info}30`,
      },
    }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, color: colors.text }}>
          System Info
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Serial</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{selectedInverter ?? 'N/A'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Last Seen</Typography>
            <Typography
              variant="body2"
              sx={{
                color: stale ? '#f44336' : colors.text,
                fontWeight: stale ? 'bold' : 'normal',
              }}
            >
              {getTimeAgo(lastSeen)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Work Mode</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{currentInverter.work_mode ?? 'N/A'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Grid Status</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{currentInverter.grid_connected_status ?? 'N/A'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Battery Voltage</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{formatVoltage(currentInverter.battery_voltage)} V</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Battery Temperature</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{formatTemperature(currentInverter.battery_temperature)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>DC Temperature</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{formatTemperature(currentInverter.dc_temperature)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>AC Temperature</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{formatTemperature(currentInverter.ac_temperature)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Grid Frequency</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{formatFrequency(currentInverter.grid_frequency)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>Backend Version</Typography>
            <Typography variant="body2" sx={{ color: colors.text }}>{backendVersion ?? '...'}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default SystemInfo;