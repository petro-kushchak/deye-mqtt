export interface InverterMetrics {
  serial: string;
  phases: number;
  pv_power: number;
  pv1_power: number;
  pv2_power: number;
  pv1_voltage: number;
  pv2_voltage: number;
  pv1_current: number;
  pv2_current: number;
  battery_soc: number;
  battery_power: number;
  grid_power: number;
  total_load_power: number;
  load_power_l1: number;
  load_power_l2: number;
  load_power_l3: number;
  load_voltage: number;
  load_voltage_l1: number;
  load_voltage_l2: number;
  load_voltage_l3: number;
  battery_status: string;
  'Running Status': string;
  work_mode?: string;
  grid_connected_status?: string;
  battery_voltage?: number;
  battery_temperature?: number;
  dc_temperature?: number;
  ac_temperature?: number;
  grid_frequency?: number;
  daily_production?: number;
  total_production?: number;
  daily_load_consumption?: number;
  daily_battery_charge?: number;
}

export interface FacilityConfig {
  backendUrl: string;
  backendWsUrl: string;
  accessKey: string;
  facilityName: string;
}

export type AppConfig = FacilityConfig[];

export interface FacilityState {
  config: FacilityConfig;
  connected: boolean;
  error: string | null;
  inverters: Record<string, InverterMetrics>;
  selectedInverter: string | null;
  currentInverter: InverterMetrics | null;
  inverterSerials: string[];
  hasMetrics: boolean;
  lastUpdate: Date | null;
  inverterLastSeen: Record<string, Date>;
}

export interface InverterContextValue {
  configLoading: boolean;
  facilities: FacilityState[];
  selectedFacility: number;
  selectFacility: (index: number) => void;
  selectFacilityInverter: (facilityIndex: number, serial: string) => void;
  currentFacility: FacilityState | null;
  configs: FacilityConfig[];
}

export interface DataPoint {
  timestamp: Date;
  pv_power: number;
  battery_power: number;
  total_load_power: number;
  grid_power: number;
  battery_soc: number;
}
