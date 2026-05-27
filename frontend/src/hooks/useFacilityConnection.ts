import type { FacilityConfig, FacilityState, InverterMetrics } from '../types';

export interface RawMetrics {
  serial?: string;
  phases?: number;
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
  load_power_l1?: number;
  load_power_l2?: number;
  load_power_l3?: number;
  load_voltage?: number;
  battery_status?: string;
  [key: string]: unknown;
}

const enrichMetrics = (metrics: RawMetrics): InverterMetrics => ({
  serial: metrics.serial ?? 'unknown',
  phases: metrics.phases ?? 3,
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
  load_power_l1: metrics.load_power_l1 ?? 0,
  load_power_l2: metrics.load_power_l2 ?? 0,
  load_power_l3: metrics.load_power_l3 ?? 0,
  load_voltage: metrics.load_voltage ?? 0,
  load_voltage_l1: (metrics.load_voltage_l1 as number) ?? 0,
  load_voltage_l2: (metrics.load_voltage_l2 as number) ?? 0,
  load_voltage_l3: (metrics.load_voltage_l3 as number) ?? 0,
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

export function createFacilityState(config: FacilityConfig): FacilityState {
  return {
    config,
    connected: false,
    error: null,
    inverters: {},
    selectedInverter: null,
    currentInverter: null,
    inverterSerials: [],
    hasMetrics: false,
    lastUpdate: null,
    inverterLastSeen: {},
  };
}

export function processFacilityMessage(
  prevState: FacilityState,
  lastMessage: unknown,
): FacilityState {
  if (!lastMessage) return prevState;

  if (Array.isArray(lastMessage) && lastMessage.length > 0) {
    const metrics = lastMessage[0] as RawMetrics;
    const serial = metrics.serial ?? 'unknown';
    const enriched = enrichMetrics(metrics);

    const inverters = { ...prevState.inverters, [serial]: enriched };
    const selectedInverter = prevState.selectedInverter ?? serial;
    const currentInverter = inverters[selectedInverter] ?? null;
    const inverterSerials = Object.keys(inverters);
    const inverterLastSeen = { ...prevState.inverterLastSeen, [serial]: new Date() };
    const hasMetrics = currentInverter !== null && currentInverter.pv_power !== undefined;

    return {
      ...prevState,
      inverters,
      selectedInverter,
      currentInverter,
      inverterSerials,
      hasMetrics,
      lastUpdate: new Date(),
      inverterLastSeen,
    };
  }

  return prevState;
}
