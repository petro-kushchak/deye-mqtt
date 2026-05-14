import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, CardContent, Select, MenuItem, FormControl, Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';
import type { DataPoint } from '../types';

interface EnergyChartProps {
  data: readonly DataPoint[];
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
}

interface MetricDef {
  key: string;
  label: string;
  color: string;
}

const METRICS: MetricDef[] = [
  { key: 'PV', label: 'PV', color: '#ff9800' },
  { key: 'Load', label: 'Load', color: '#1976d2' },
  { key: 'Battery', label: 'Battery', color: '#388e3c' },
  { key: 'SOC', label: 'SOC', color: '#9c27b0' },
];

const TOGGLE_KEY = 'deye-metrics';

const loadToggles = (): Set<string> => {
  try {
    const raw = localStorage.getItem(TOGGLE_KEY);
    if (!raw) return new Set(METRICS.map(m => m.key));
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set(METRICS.map(m => m.key));
  }
};

const saveToggles = (keys: Set<string>) => {
  localStorage.setItem(TOGGLE_KEY, JSON.stringify([...keys]));
};

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
          {entry.name}: {entry.value.toFixed(0)} {entry.name === 'SOC' ? '%' : 'W'}
        </Typography>
      ))}
    </Box>
  );
};

const rangeOptions = [1, 2, 3, 6, 12, 24];

export default function EnergyChart({ data, timeRange, onTimeRangeChange }: EnergyChartProps) {
  const { colors } = useTheme();
  const isDark = colors.background === '#121212';
  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(loadToggles);

  const toggleMetric = useCallback((key: string) => {
    setVisibleMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      saveToggles(next);
      return next;
    });
  }, []);

  const chartData = data.map(d => ({
    time: d.timestamp.getTime(),
    ts: d.timestamp,
    PV: d.pv_power,
    Load: d.total_load_power,
    Battery: d.battery_power,
    SOC: d.battery_soc,
  }));

  return (
    <CardContent sx={{ pt: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ color: colors.textSecondary }}>
            History
          </Typography>
          {METRICS.map(m => (
            <Box
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.3,
                cursor: 'pointer',
                opacity: visibleMetrics.has(m.key) ? 1 : 0.35,
                transition: 'opacity 0.15s',
                userSelect: 'none',
                '&:hover': { opacity: visibleMetrics.has(m.key) ? 0.8 : 0.5 },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: colors.text }}>
                {m.label}
              </Typography>
            </Box>
          ))}
        </Box>
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
            yAxisId="power"
            tickFormatter={(v) => `${v}W`}
            stroke={colors.textSecondary}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="soc"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#9c27b0"
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {METRICS.map(m => (
            <Line
              key={m.key}
              yAxisId={m.key === 'SOC' ? 'soc' : 'power'}
              type="monotone"
              dataKey={m.key}
              stroke={m.key === 'Load' ? (isDark ? '#64b5f6' : '#1976d2') : m.key === 'Battery' ? (isDark ? '#81c784' : '#388e3c') : m.key === 'SOC' ? '#9c27b0' : m.color}
              dot={false}
              strokeWidth={2}
              hide={!visibleMetrics.has(m.key)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  );
}
