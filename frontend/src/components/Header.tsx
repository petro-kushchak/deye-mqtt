import { AppBar, Toolbar, Typography, Chip, Tabs, Tab, Box } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { getRunningStatusLabel } from '../utils/formatters';
import ThemeToggle from './ThemeToggle';

function Header() {
  const { connected, lastUpdate, selectedInverter, selectInverter, inverterSerials, config, currentInverter } = useInverter();
  const { colors } = useTheme();

  const runningStatus = currentInverter?.['Running Status'] ?? 'Stand-by';
  const { cardAlt: bgColor, border: borderColor } = colors;

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        bgcolor: bgColor, 
        borderBottom: `1px solid ${borderColor}`,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ bgcolor: bgColor }}>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, color: colors.text }}>
          <Chip
            size="small"
            label={connected ? 'Connected' : 'Disconnected'}
            sx={{ 
              bgcolor: connected ? colors.success : colors.error,
              color: '#fff'
            }}
          />
          <HomeIcon sx={{ color: colors.warning, ml: 1 }} />
          {config?.facilityName? config?.facilityName:  'Solar Dashboard' }
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