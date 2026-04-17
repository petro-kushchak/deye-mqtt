import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { useInverter } from '../context/InverterContext';
import { useTheme } from '../context/ThemeContext';
import { formatVoltage, formatCurrent, formatPower } from '../utils/formatters';

function PVStrings() {
  const { currentInverter } = useInverter();
  const { colors } = useTheme();

  if (!currentInverter) return null;

  const pv1Data = {
    voltage: currentInverter.pv1_voltage,
    current: currentInverter.pv1_current,
    power: currentInverter.pv1_power,
  };

  const pv2Data = {
    voltage: currentInverter.pv2_voltage,
    current: currentInverter.pv2_current,
    power: currentInverter.pv2_power,
  };

  const renderPVCard = (label: string, data: { voltage: number; current: number; power: number }) => (
    <Grid item xs={12} md={6} lg={3}>
      <Card sx={{ 
        height: '100%', 
        bgcolor: colors.cardAlt,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 20px ${colors.warning}30`,
        },
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: colors.warning }}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>Voltage</Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold' }}>{formatVoltage(data.voltage)} V</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>Current</Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold' }}>{formatCurrent(data.current)} A</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>Power</Typography>
              <Typography variant="body2" sx={{ color: colors.text, fontWeight: 'bold' }}>{formatPower(data.power)} W</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Grid container spacing={3}>
      {renderPVCard('PV1', pv1Data)}
      {renderPVCard('PV2', pv2Data)}
    </Grid>
  );
}

export default PVStrings;