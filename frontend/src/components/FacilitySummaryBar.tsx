import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { formatPower, getGridStatus, getBatteryStatusColor, getBatteryStatusLabel, getRunningStatusLabel, getTimeAgo } from '../utils/formatters';
import type { FacilityState } from '../types';

interface MiniCardProps {
  facility: FacilityState;
  index: number;
  selected: boolean;
  onClick: () => void;
}

function MiniCard({ facility, index, selected, onClick }: MiniCardProps) {
  const { colors } = useTheme();
  const inv = facility.currentInverter;
  const gridStatus = getGridStatus(inv?.grid_power ?? 0);
  const batteryPower = inv?.battery_power ?? 0;
  const batteryColor = getBatteryStatusColor(batteryPower);
  const batteryLabel = getBatteryStatusLabel(batteryPower);
  const runningStatus = inv?.['Running Status'] ?? null;

  const isStale = facility.lastUpdate
    ? (new Date().getTime() - facility.lastUpdate.getTime()) > 120000
    : true;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: selected ? `2px solid ${colors.info}` : `1px solid ${colors.border}`,
        bgcolor: selected ? `${colors.info}10` : colors.cardAlt,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${colors.info}30`,
        },
        opacity: isStale ? 0.6 : 1,
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: facility.connected ? colors.success : colors.error,
              flexShrink: 0,
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.text, fontSize: '1rem', lineHeight: 1.3 }}>
              {facility.config.facilityName}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: '0.65rem', lineHeight: 1 }}>
              {getTimeAgo(facility.lastUpdate)}
            </Typography>
          </Box>
        </Box>

        {!facility.hasMetrics ? (
          <Typography variant="body2" sx={{ color: colors.textSecondary, py: 1 }}>
            {facility.connected ? 'Waiting for data...' : 'Disconnected'}
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            <MiniStat
              icon={<SolarPowerIcon sx={{ fontSize: 20 }} />}
              value={formatPower(inv?.pv_power)}
              unit="W"
              color={colors.warning}
            />
            <MiniStat
              icon={<BatteryChargingFullIcon sx={{ fontSize: 20 }} />}
              value={formatPower(Math.abs(batteryPower))}
              unit="W"
              color={batteryColor}
              sub={`${formatPower(inv?.battery_soc)}%`}
            />
            <MiniStat
              icon={<GridOnIcon sx={{ fontSize: 20 }} />}
              value={formatPower(Math.abs(inv?.grid_power ?? 0))}
              unit="W"
              color={gridStatus.color}
              sub={gridStatus.label}
            />
            <MiniStat
              icon={<HomeIcon sx={{ fontSize: 20 }} />}
              value={formatPower(inv?.total_load_power)}
              unit="W"
              color={colors.info}
            />
          </Grid>
        )}

        {runningStatus && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: runningStatus === 'Normal' ? colors.success : runningStatus === 'FAULT' ? colors.error : colors.textSecondary,
              fontSize: '0.75rem',
            }}
          >
            {getRunningStatusLabel(runningStatus)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  value: string;
  unit: string;
  color: string;
  sub?: string;
}

function MiniStat({ icon, value, unit, color, sub }: MiniStatProps) {
  const { colors } = useTheme();
  return (
    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: colors.text, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
        {value}
        <Typography component="span" variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.75rem', ml: 0.25, fontWeight: 400 }}>
          {unit}
        </Typography>
        {sub && (
          <Typography component="span" variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.7rem', ml: 0.5, fontWeight: 400 }}>
            {sub}
          </Typography>
        )}
      </Typography>
    </Grid>
  );
}

export default function FacilitySummaryBar() {
  const { facilities, selectedFacility, selectFacility } = useInverter();
  const { colors } = useTheme();

  if (facilities.length <= 1) return null;

  return (
    <Box
      sx={{
        px: { xs: 1, md: 2 },
        pb: 1,
        pt: 2,
      }}
    >
      <Grid container spacing={1.5}>
        {facilities.map((facility, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <MiniCard
              facility={facility}
              index={i}
              selected={i === selectedFacility}
              onClick={() => selectFacility(i)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
