import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { InverterMetrics, DataPoint } from '../types';

const STORAGE_KEY = 'deye-energy-history';
const MAX_HOURS = 24;

const loadBuffer = (): DataPoint[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ timestamp: number; pv_power: number; battery_power: number; total_load_power: number; grid_power: number }>;
    const cutoff = Date.now() - MAX_HOURS * 60 * 60 * 1000;
    return parsed
      .filter(p => p.timestamp >= cutoff)
      .map(p => ({ timestamp: new Date(p.timestamp), pv_power: p.pv_power, battery_power: p.battery_power, total_load_power: p.total_load_power, grid_power: p.grid_power }));
  } catch {
    return [];
  }
};

const saveBuffer = (buffer: DataPoint[]) => {
  try {
    const cutoff = Date.now() - MAX_HOURS * 60 * 60 * 1000;
    const cleaned = buffer.filter(p => p.timestamp.getTime() >= cutoff);
    const serialized = cleaned.map(p => ({ timestamp: p.timestamp.getTime(), pv_power: p.pv_power, battery_power: p.battery_power, total_load_power: p.total_load_power, grid_power: p.grid_power }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // localStorage full or unavailable
  }
};

export function useDataBuffer() {
  const [timeRange, setTimeRange] = useState(1);
  const [dataBuffer, setDataBuffer] = useState<DataPoint[]>(loadBuffer);
  const lastRef = useRef<Pick<InverterMetrics, 'pv_power' | 'battery_power' | 'total_load_power' | 'grid_power'> | null>(null);

  useEffect(() => {
    saveBuffer(dataBuffer);
  }, [dataBuffer]);

  const addDataPoint = useCallback((metrics: Partial<InverterMetrics>) => {
    const { pv_power, battery_power, total_load_power, grid_power } = metrics;
    if (pv_power === undefined && battery_power === undefined && total_load_power === undefined && grid_power === undefined) return;

    const pv = pv_power ?? 0;
    const bat = battery_power ?? 0;
    const load = total_load_power ?? 0;
    const grid = grid_power ?? 0;

    const last = lastRef.current;
    if (last && last.pv_power === pv && last.battery_power === bat && last.total_load_power === load && last.grid_power === grid) return;

    lastRef.current = { pv_power: pv, battery_power: bat, total_load_power: load, grid_power: grid };

    setDataBuffer(prev => {
      const cutoff = Date.now() - MAX_HOURS * 60 * 60 * 1000;
      const cleaned = prev.filter(p => p.timestamp.getTime() >= cutoff);
      cleaned.push({ timestamp: new Date(), pv_power: pv, battery_power: bat, total_load_power: load, grid_power: grid });
      return cleaned;
    });
  }, []);

  const filteredData = useMemo(() => {
    if (dataBuffer.length === 0) return [];
    const cutoff = Date.now() - timeRange * 60 * 60 * 1000;
    return dataBuffer.filter(p => p.timestamp.getTime() >= cutoff);
  }, [dataBuffer, timeRange]);

  return { addDataPoint, dataBuffer: dataBuffer as readonly DataPoint[], filteredData, timeRange, setTimeRange };
}
