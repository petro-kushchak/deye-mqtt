import { useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Collapse } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import { useInverter } from '../context/InverterContext';
import { useDataBuffer } from '../hooks/useDataBuffer';
import EnergyChart from './EnergyChart';

interface EnergyHistoryProps {
  open: boolean;
}

export default function EnergyHistory({ open }: EnergyHistoryProps) {
  const { colors } = useTheme();
  const { currentInverter, apiUrl, accessKey } = useInverter();
  const { addDataPoint, filteredData, timeRange, setTimeRange } = useDataBuffer(apiUrl, accessKey);
  const prevRef = useRef(currentInverter);

  useEffect(() => {
    if (currentInverter && currentInverter !== prevRef.current) {
      addDataPoint(currentInverter);
      prevRef.current = currentInverter;
    }
  }, [currentInverter, addDataPoint]);

  return (
    <Collapse in={open} sx={{ width: '100%' }}>
      <Card sx={{
        bgcolor: colors.cardAlt,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 20px ${colors.info}30`,
        },
      }}>
        <CardContent>
          {filteredData.length > 1 ? (
            <EnergyChart
              data={filteredData}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          ) : (
            <Typography variant="body2" sx={{ color: colors.textSecondary, textAlign: 'center', py: 4 }}>
              Collecting data... chart will appear once enough data points are available.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Collapse>
  );
}
