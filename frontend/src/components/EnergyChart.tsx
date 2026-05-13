import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, CardContent, Select, MenuItem, FormControl, Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import type { DataPoint } from '../types';

interface EnergyChartProps {
  data: readonly DataPoint[];
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
}

const formatTime = (date: Date) => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const formatTooltipTime = (ts: number) => {
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string }>; label?: number }) => {
  if (!active || !payload || !label) return null;
  const time = formatTooltipTime(label);
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      px: 1.5,
      py: 1,
      boxShadow: 3,
    }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>{time}</Typography>
      {payload.map((entry, i) => (
        <Typography key={i} variant="caption" sx={{ display: 'block', color: entry.color }}>
          {entry.name}: {entry.value.toFixed(0)} W
        </Typography>
      ))}
    </Box>
  );
};

const rangeOptions = [1, 2, 3, 6, 12, 24];

export default function EnergyChart({ data, timeRange, onTimeRangeChange }: EnergyChartProps) {
  const { colors } = useTheme();
  const isDark = colors.background === '#121212';

  const chartData = data.map(d => ({
    time: d.timestamp.getTime(),
    ts: d.timestamp,
    PV: d.pv_power,
    Load: d.total_load_power,
    Battery: d.battery_power,
  }));

  return (
    <CardContent sx={{ pt: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>
          History
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as number)}
            sx={{
              fontSize: '0.8rem',
              color: colors.text,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
            }}
          >
            {rangeOptions.map(h => (
              <MenuItem key={h} value={h} sx={{ fontSize: '0.8rem' }}>{h}h</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey="time"
            domain={['auto', 'auto']}
            type="number"
            scale="time"
            tickFormatter={(ts) => formatTime(new Date(ts))}
            stroke={colors.textSecondary}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `${v}W`}
            stroke={colors.textSecondary}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: colors.text }}
          />
          <Line type="monotone" dataKey="PV" stroke="#ff9800" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Load" stroke={isDark ? '#64b5f6' : '#1976d2'} dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Battery" stroke={isDark ? '#81c784' : '#388e3c'} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  );
}
