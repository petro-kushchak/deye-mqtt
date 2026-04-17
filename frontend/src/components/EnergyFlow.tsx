import { type ReactNode } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BoltIcon from '@mui/icons-material/Bolt';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { InverterMetrics } from '../types';

interface EnergyFlowProps {
  data: Partial<InverterMetrics>;
}

interface NodeBoxProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  unit: string;
  color: string;
  subValue?: string;
  colors: {
    text: string;
    textSecondary: string;
  };
}

interface ArrowProps {
  direction: 'up' | 'down' | 'forward';
  color: string;
  active: boolean;
  showLabel: boolean;
  label: string;
  arrowInactive: string;
}

const NodeBox = ({ icon, label, value, unit, color, subValue, colors }: NodeBoxProps) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    bgcolor: colors.backgroundAlt,
    border: `2px solid ${color}`,
    borderRadius: 1,
    px: 2,
    py: 1,
    minWidth: 110,
    boxShadow: `0 2px 8px ${color}30`,
  }}>
    <Box sx={{ color: color, mb: 0.5 }}>{icon}</Box>
    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: colors.textSecondary }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 700, color: colors.text }}>
      {typeof value === 'number' ? value.toFixed(0) : value}
      <Typography component="span" variant="caption" sx={{ ml: 0.5, color: colors.textSecondary, fontSize: '0.7rem' }}>
        {unit}
      </Typography>
    </Typography>
    {subValue && (
      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: colors.textSecondary }}>
        {subValue}
      </Typography>
    )}
  </Box>
);

const Arrow = ({ direction, color, active, showLabel, label, arrowInactive }: ArrowProps) => {
  const Icon = direction === 'up' ? ArrowUpwardIcon 
             : direction === 'down' ? ArrowDownwardIcon 
             : ArrowForwardIcon;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? color : arrowInactive,
        animation: active ? 'pulse 1.5s ease-in-out infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      }}>
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      {showLabel && (
        <Typography variant="caption" sx={{ fontSize: '0.55rem', color: active ? color : arrowInactive }}>
          {label}
        </Typography>
      )}
    </Box>
  );
};

const EnergyFlow = ({ data }: EnergyFlowProps) => {
  const { colors } = useTheme();
  const {
    pv_power = 0,
    pv1_power = 0,
    pv2_power = 0,
    battery_power = 0,
    battery_soc = 0,
    grid_power = 0,
    total_load_power = 0,
  } = data;

  const absBatteryPower = Math.abs(battery_power);
  const isBatteryCharging = battery_power < 0;
  const isBatteryDischarging = battery_power > 0;
  const isGridExporting = grid_power < 0;
  const isGridImporting = grid_power > 0;

  const getBatteryColor = () => {
    if (isBatteryCharging) return colors.success;
    if (isBatteryDischarging) return colors.warning;
    return colors.disabled;
  };

  const getBatteryIcon = () => {
    if (isBatteryCharging) return <BatteryChargingFullIcon sx={{ fontSize: 28 }} />;
    if (isBatteryDischarging) return <BoltIcon sx={{ fontSize: 28 }} />;
    return <BatteryFullIcon sx={{ fontSize: 28 }} />;
  };

  const getGridColor = () => {
    if (isGridExporting) return colors.success;
    if (isGridImporting) return colors.warning;
    return colors.disabled;
  };

  return (
    <Card sx={{ height: '100%', minHeight: 360,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 20px ${colors.info}30`,
      },
    }}>
      <CardContent sx={{ height: '100%', pb: '16px !important' }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: colors.textSecondary }}>
          Energy Flow
        </Typography>
        
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gridTemplateRows: 'auto 1fr auto',
          gap: 1,
          height: 'calc(100% - 50px)',
          alignItems: 'center',
        }}>
          <Box sx={{ gridColumn: 1, gridRow: 1, display: 'flex', justifyContent: 'center' }}>
            <NodeBox
              icon={<SolarPowerIcon sx={{ fontSize: 24 }} />}
              label="PV"
              value={pv_power}
              unit="W"
              color={colors.warning}
              subValue={`${pv1_power}W + ${pv2_power}W`}
              colors={colors}
            />
          </Box>

          <Box sx={{ gridColumn: 3, gridRow: 1, display: 'flex', justifyContent: 'center' }}>
            <NodeBox
              icon={getBatteryIcon()}
              label="Battery"
              value={absBatteryPower}
              unit="W"
              color={getBatteryColor()}
              subValue={`SOC: ${battery_soc}%`}
              colors={colors}
            />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: `3px solid ${colors.info}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: colors.backgroundAlt,
              boxShadow: `0 2px 12px ${colors.info}40`,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: colors.info }}>
                Inverter
              </Typography>
            </Box>
          </Box>

          <Box sx={{ gridColumn: 1, gridRow: 3, display: 'flex', justifyContent: 'center' }}>
            <NodeBox
              icon={<GridOnIcon sx={{ fontSize: 24 }} />}
              label="Grid"
              value={Math.abs(grid_power)}
              unit="W"
              color={getGridColor()}
              subValue={isGridImporting ? 'Import' : isGridExporting ? 'Export' : 'Idle'}
              colors={colors}
            />
          </Box>

          <Box sx={{ gridColumn: 3, gridRow: 3, display: 'flex', justifyContent: 'center' }}>
            <NodeBox
              icon={<HomeIcon sx={{ fontSize: 24 }} />}
              label="Load"
              value={total_load_power}
              unit="W"
              color={colors.info}
              colors={colors}
            />
          </Box>

          <Box sx={{ gridColumn: 1, gridRow: 2, display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
            <Arrow direction="down" color={colors.warning} active={pv_power > 0} showLabel label="PV→Inv" arrowInactive={colors.arrowInactive} />
          </Box>

          <Box sx={{ gridColumn: 3, gridRow: 2, display: 'flex', justifyContent: 'flex-start', pl: 2 }}>
            <Arrow direction={isBatteryCharging ? 'up' : 'down'} color={getBatteryColor()} active={absBatteryPower > 0} showLabel label={isBatteryCharging ? 'Inv→Bat' : 'Bat→Inv'} arrowInactive={colors.arrowInactive} />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 3, display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Arrow direction="down" color={colors.info} active={total_load_power > 0} showLabel label="→Load" arrowInactive={colors.arrowInactive} />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', justifyContent: 'center', pb: 1 }}>
            <Arrow direction={isGridImporting ? 'down' : 'up'} color={getGridColor()} active={Math.abs(grid_power) > 0} showLabel label={isGridImporting ? '→Inv' : 'Inv→'} arrowInactive={colors.arrowInactive} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnergyFlow;