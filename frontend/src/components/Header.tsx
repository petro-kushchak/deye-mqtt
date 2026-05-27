import { AppBar, Toolbar, Typography, Chip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { getRunningStatusLabel } from '../utils/formatters';
import ThemeToggle from './ThemeToggle';

function Header() {
  const { currentFacility, configs, selectedFacility } = useInverter();
  const { colors } = useTheme();

  const lastUpdate = currentFacility?.lastUpdate ?? null;
  const currentInverter = currentFacility?.currentInverter ?? null;
  const facilityName = currentFacility?.config?.facilityName ?? 'Solar Dashboard';

  const runningStatus = currentInverter?.['Running Status'] ?? 'Stand-by';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: colors.cardAlt,
        borderBottom: `1px solid ${colors.border}`,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ bgcolor: colors.cardAlt }}>
        <Typography variant="h6" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1, color: colors.text }}>
          <HomeIcon sx={{ color: colors.warning }} />
          {facilityName}
          {configs.length > 1 && (
            <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 0.5 }}>
              ({selectedFacility + 1}/{configs.length})
            </Typography>
          )}
        </Typography>
        {currentInverter && (
          <Chip
            label={getRunningStatusLabel(runningStatus)}
            sx={{
              mr: 2,
              bgcolor: runningStatus === 'Normal' ? colors.success : runningStatus === 'FAULT' ? colors.error : colors.disabled,
              color: '#fff',
            }}
          />
        )}
        {lastUpdate && (
          <Typography variant="caption" sx={{ color: colors.textSecondary, mr: 1 }}>
            {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}

export default Header;
