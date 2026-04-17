import { AppBar, Toolbar, Typography, Chip, Tabs, Tab, Box } from '@mui/material';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { getRunningStatusLabel } from '../utils/formatters';
import ThemeToggle from './ThemeToggle';

function Header() {
  const { connected, lastUpdate, selectedInverter, selectInverter, inverterSerials, config, currentInverter } = useInverter();
  const { colors } = useTheme();

  const runningStatus = currentInverter?.['Running Status'] ?? 'Stand-by';

  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: colors.cardAlt, zIndex: (theme) => theme.zIndex.appBar }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2, color: colors.text }}>
          <Chip
            size="small"
            label={connected ? 'Connected' : 'Disconnected'}
            sx={{ 
              mr: 1, 
              bgcolor: connected ? colors.success : colors.error,
              color: '#fff'
            }}
          />
          Solar Dashboard{config?.facilityName && `: ${config.facilityName}`}
        </Typography>
        <Chip
          label={getRunningStatusLabel(runningStatus)}
          sx={{ 
            mr: 2, 
            bgcolor: runningStatus === 'Normal' ? colors.success : runningStatus === 'FAULT' ? colors.error : colors.disabled,
            color: '#fff'
          }}
        />
        {lastUpdate && (
          <Typography variant="caption" sx={{ color: colors.textSecondary, mr: 1 }}>
            {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
        <ThemeToggle />
      </Toolbar>
      {inverterSerials.length > 1 && (
        <Tabs
          value={selectedInverter}
          onChange={(_e, val) => selectInverter(val)}
          sx={{ bgcolor: colors.cardAlt, minHeight: 40 }}
          textColor="primary"
          indicatorColor="primary"
        >
          {inverterSerials.map((serial) => (
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
  );
}

export default Header;