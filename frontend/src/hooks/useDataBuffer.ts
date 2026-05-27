import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { InverterMetrics, DataPoint } from '../types';

const MAX_HOURS = 24;
const RANGE_STORAGE_KEY = 'deye-history-range';

function getMinuteBucket(date: Date): number {
  return Math.floor(date.getTime() / 60000);
}

interface HistoryEntry {
  t: number;
  s: string;
  p: number;
  b: number;
  l: number;
  g: number;
  c: number;
}

const buffers = new Map<string, DataPoint[]>();

export function useDataBuffer(apiUrl: string, accessKey: string, facilityKey: string = 'default') {
  const [timeRange, setTimeRange] = useState(() => {
    const saved = localStorage.getItem(RANGE_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [dataBuffer, setDataBuffer] = useState<DataPoint[]>(() => buffers.get(facilityKey) ?? []);
  const lastRef = useRef<Pick<InverterMetrics, 'pv_power' | 'battery_power' | 'total_load_power' | 'grid_power' | 'battery_soc'> | null>(null);

  useEffect(() => {
    localStorage.setItem(RANGE_STORAGE_KEY, String(timeRange));
  }, [timeRange]);

  const historyUrl = `${apiUrl}/api/history?hours=24${accessKey ? `&access_key=${accessKey}` : ''}`;

  useEffect(() => {
    let cancelled = false;
    fetch(historyUrl)
      .then(res => res.json())
      .then((data: HistoryEntry[]) => {
        if (cancelled) return;
        const points: DataPoint[] = data.map(entry => ({
          timestamp: new Date(entry.t),
          pv_power: entry.p,
          battery_power: entry.b,
          total_load_power: entry.l,
          grid_power: entry.g,
          battery_soc: entry.c,
        }));
        buffers.set(facilityKey, points);
        setDataBuffer(points);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [historyUrl, facilityKey]);

  const addDataPoint = useCallback((metrics: Partial<InverterMetrics>) => {
    const { pv_power, battery_power, total_load_power, grid_power, battery_soc } = metrics;
    if (pv_power === undefined && battery_power === undefined && total_load_power === undefined && grid_power === undefined && battery_soc === undefined) return;

    const pv = pv_power ?? 0;
    const bat = battery_power ?? 0;
    const load = total_load_power ?? 0;
    const grid = grid_power ?? 0;
    const soc = battery_soc ?? 0;

    const last = lastRef.current;
    if (last && last.pv_power === pv && last.battery_power === bat && last.total_load_power === load && last.grid_power === grid && last.battery_soc === soc) return;

    lastRef.current = { pv_power: pv, battery_power: bat, total_load_power: load, grid_power: grid, battery_soc: soc };

    const now = new Date();
    const bucket = getMinuteBucket(now);

    setDataBuffer(prev => {
      const lastIdx = prev.length - 1;
      if (lastIdx >= 0 && getMinuteBucket(prev[lastIdx].timestamp) === bucket) {
        const updated = [...prev] as DataPoint[];
        updated[lastIdx] = { timestamp: now, pv_power: pv, battery_power: bat, total_load_power: load, grid_power: grid, battery_soc: soc };
        buffers.set(facilityKey, updated);
        return updated;
      }

      const cutoff = Date.now() - MAX_HOURS * 60 * 60 * 1000;
      const cleaned = prev.filter(p => p.timestamp.getTime() >= cutoff) as DataPoint[];
      cleaned.push({ timestamp: now, pv_power: pv, battery_power: bat, total_load_power: load, grid_power: grid, battery_soc: soc });
      buffers.set(facilityKey, cleaned);
      return cleaned;
    });
  }, [facilityKey]);

  const filteredData = useMemo(() => {
    if (dataBuffer.length === 0) return [];
    const cutoff = Date.now() - timeRange * 60 * 60 * 1000;
    return dataBuffer.filter(p => p.timestamp.getTime() >= cutoff);
  }, [dataBuffer, timeRange]);

  return { addDataPoint, dataBuffer: dataBuffer as readonly DataPoint[], filteredData, timeRange, setTimeRange };
}
