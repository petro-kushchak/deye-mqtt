import { useState, useEffect, useCallback } from 'react';
import type { InverterMetrics, UseInverterDataReturn } from '../types';

interface RawMetrics {
  serial?: string;
  pv_power?: number;
  pv1_power?: number;
  pv2_power?: number;
  pv1_voltage?: number;
  pv2_voltage?: number;
  pv1_current?: number;
  pv2_current?: number;
  battery_soc?: number;
  battery_power?: number;
  grid_power?: number;
  total_load_power?: number;
  battery_status?: string;
  [key: string]: unknown;
}

const enrichMetrics = (metrics: RawMetrics): InverterMetrics => ({
  serial: metrics.serial ?? 'unknown',
  pv_power: metrics.pv_power ?? 0,
  pv1_power: metrics.pv1_power ?? 0,
  pv2_power: metrics.pv2_power ?? 0,
  pv1_voltage: metrics.pv1_voltage ?? 0,
  pv2_voltage: metrics.pv2_voltage ?? 0,
  pv1_current: metrics.pv1_current ?? 0,
  pv2_current: metrics.pv2_current ?? 0,
  battery_soc: metrics.battery_soc ?? 0,
  battery_power: metrics.battery_power ?? 0,
  grid_power: metrics.grid_power ?? 0,
  total_load_power: metrics.total_load_power ?? 0,
  battery_status: metrics.battery_status ?? 'Stand-by',
  'Running Status': (metrics['Running Status'] as string) ?? 'Stand-by',
  work_mode: metrics.work_mode as string | undefined,
  grid_connected_status: metrics.grid_connected_status as string | undefined,
  battery_voltage: metrics.battery_voltage as number | undefined,
  battery_temperature: metrics.battery_temperature as number | undefined,
  dc_temperature: metrics.dc_temperature as number | undefined,
  ac_temperature: metrics.ac_temperature as number | undefined,
  grid_frequency: metrics.grid_frequency as number | undefined,
  daily_production: metrics.daily_production as number | undefined,
  total_production: metrics.total_production as number | undefined,
  daily_load_consumption: metrics.daily_load_consumption as number | undefined,
  daily_battery_charge: metrics.daily_battery_charge as number | undefined,
});

export function useInverterData(lastMessage: unknown, _connected: boolean): UseInverterDataReturn {
  const [inverters, setInverters] = useState<Record<string, InverterMetrics>>({});
  const [selectedInverter, setSelectedInverter] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [inverterLastSeen, setInverterLastSeen] = useState<Record<string, Date>>({});

  useEffect(() => {
    if (!lastMessage) return;

    if (Array.isArray(lastMessage) && lastMessage.length > 0) {
      const metrics = lastMessage[0] as RawMetrics;
      const serial = metrics.serial ?? 'unknown';
      const enrichedMetrics = enrichMetrics(metrics);

      setInverters((prev) => {
        const updated = { ...prev, [serial]: enrichedMetrics };
        if (!selectedInverter) {
          setSelectedInverter(serial);
        }
        return updated;
      });
      setInverterLastSeen((prev) => ({ ...prev, [serial]: new Date() }));
      setLastUpdate(new Date());
    }
  }, [lastMessage, selectedInverter]);

  const selectInverter = useCallback((serial: string) => {
    setSelectedInverter(serial);
  }, []);

  const inverterSerials = Object.keys(inverters);
  const currentInverter = selectedInverter ? (inverters[selectedInverter] ?? null) : null;
  const hasMetrics = currentInverter !== null && currentInverter.pv_power !== undefined;

  return {
    inverters,
    selectedInverter,
    selectInverter,
    currentInverter,
    inverterSerials,
    hasMetrics,
    lastUpdate,
    inverterLastSeen,
  };
}

export function getInverterStatus(status: InverterMetrics | null | undefined): { label: string; color: string } {
  if (!status) return { label: 'Unknown', color: 'default' };
  const runningStatus = status['Running Status'] ?? 'Stand-by';
  const colors: Record<string, string> = {
    'Stand-by': 'default',
    'Self-checking': 'info',
    'Normal': 'success',
    'FAULT': 'error',
  };
  return { label: runningStatus, color: colors[runningStatus] ?? 'default' };
}

export function isStale(date: Date | null | undefined): boolean {
  if (!date) return true;
  return (new Date().getTime() - date.getTime()) > 120000;
}

export function getTimeAgo(date: Date | null | undefined): string {
  if (!date) return 'Never';
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}