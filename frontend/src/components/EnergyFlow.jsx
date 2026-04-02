import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BoltIcon from '@mui/icons-material/Bolt';
import GridOnIcon from '@mui/icons-material/GridOn';
import HomeIcon from '@mui/icons-material/Home';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const EnergyFlow = ({ data }) => {
  const {
    pv_power = 0,
    pv1_power = 0,
    pv2_power = 0,
    battery_power = 0,
    battery_soc = 0,
    grid_power = 0,
    total_load_power = 0,
    battery_status = 'Stand-by',
  } = data;

  const absBatteryPower = Math.abs(battery_power);
  const isBatteryCharging = battery_power < 0;
  const isBatteryDischarging = battery_power > 0;
  const isGridExporting = grid_power < 0;
  const isGridImporting = grid_power > 0;

  const getBatteryColor = () => {
    if (isBatteryCharging) return '#4caf50';
    if (isBatteryDischarging) return '#ff9800';
    return '#9e9e9e';
  };

  const getBatteryIcon = () => {
    if (isBatteryCharging) return <BatteryChargingFullIcon sx={{ fontSize: 28 }} />;
    if (isBatteryDischarging) return <BoltIcon sx={{ fontSize: 28 }} />;
    return <BatteryFullIcon sx={{ fontSize: 28 }} />;
  };

  const getGridColor = () => {
    if (isGridExporting) return '#4caf50';
    if (isGridImporting) return '#ff9800';
    return '#9e9e9e';
  };

  const NodeBox = ({ icon, label, value, unit, color, subValue }) => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      bgcolor: '#ffffff',
      border: `2px solid ${color}`,
      borderRadius: 1,
      px: 2,
      py: 1,
      minWidth: 110,
      boxShadow: `0 2px 8px ${color}30`,
    }}>
      <Box sx={{ color: color, mb: 0.5 }}>{icon}</Box>
      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#616161' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color: '#212121' }}>
        {typeof value === 'number' ? value.toFixed(0) : value}
        <Typography component="span" variant="caption" sx={{ ml: 0.5, color: '#616161', fontSize: '0.7rem' }}>
          {unit}
        </Typography>
      </Typography>
      {subValue && (
        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#757575' }}>
          {subValue}
        </Typography>
      )}
    </Box>
  );

  const Arrow = ({ direction, color, active, showLabel, label }) => {
    const Icon = direction === 'up' ? ArrowUpwardIcon 
               : direction === 'down' ? ArrowDownwardIcon 
               : ArrowForwardIcon;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? color : '#bdbdbd',
          animation: active ? 'pulse 1.5s ease-in-out infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.6 },
            '50%': { opacity: 1 },
          },
        }}>
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        {showLabel && (
          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: active ? color : '#bdbdbd' }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%', minHeight: 360 }}>
      <CardContent sx={{ height: '100%', pb: '16px !important' }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: '#616161' }}>
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
              color="#ff9800"
              subValue={`${pv1_power}W + ${pv2_power}W`}
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
            />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              border: '3px solid #0288d1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 12px rgba(2, 136, 209, 0.25)',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#0288d1' }}>
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
            />
          </Box>

          <Box sx={{ gridColumn: 3, gridRow: 3, display: 'flex', justifyContent: 'center' }}>
            <NodeBox
              icon={<HomeIcon sx={{ fontSize: 24 }} />}
              label="Load"
              value={total_load_power}
              unit="W"
              color="#0288d1"
            />
          </Box>

          <Box sx={{ gridColumn: 1, gridRow: 2, display: 'flex', justifyContent: 'flex-end', pr: 2 }}>
            <Arrow direction="down" color="#ff9800" active={pv_power > 0} showLabel label="PV→Inv" />
          </Box>

          <Box sx={{ gridColumn: 3, gridRow: 2, display: 'flex', justifyContent: 'flex-start', pl: 2 }}>
            <Arrow direction={isBatteryCharging ? 'up' : 'down'} color={getBatteryColor()} active={absBatteryPower > 0} showLabel label={isBatteryCharging ? 'Inv→Bat' : 'Bat→Inv'} />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 3, display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Arrow direction="down" color="#0288d1" active={total_load_power > 0} showLabel label="→Load" />
          </Box>

          <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', justifyContent: 'center', pb: 1 }}>
            <Arrow direction={isGridImporting ? 'down' : 'up'} color={getGridColor()} active={Math.abs(grid_power) > 0} showLabel label={isGridImporting ? '→Inv' : 'Inv→'} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnergyFlow;
