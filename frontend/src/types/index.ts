export interface InverterMetrics {
  serial: string;
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

export interface AppConfig {
  backendUrl: string;
  backendWsUrl: string;
  accessKey: string;
  facilityName: string;
}

export interface InverterState {
  inverters: Record<string, InverterMetrics>;
  selectedInverter: string | null;
  currentInverter: InverterMetrics | null;
  inverterSerials: string[];
  hasMetrics: boolean;
  lastUpdate: Date | null;
  inverterLastSeen: Record<string, Date>;
}

export interface WebSocketState {
  connected: boolean;
  error: string | null;
  lastMessage: unknown;
}

export interface UseConfigReturn {
  config: AppConfig | null;
  loading: boolean;
  apiUrl: string;
  accessKey: string;
  wsUrlWithKey: string;
  facilityName: string;
}

export interface UseWebSocketReturn {
  connected: boolean;
  error: string | null;
  lastMessage: unknown;
  reconnect: () => void;
}

export interface UseInverterDataReturn {
  inverters: Record<string, InverterMetrics>;
  selectedInverter: string | null;
  selectInverter: (serial: string) => void;
  currentInverter: InverterMetrics | null;
  inverterSerials: string[];
  hasMetrics: boolean;
  lastUpdate: Date | null;
  inverterLastSeen: Record<string, Date>;
}

export interface InverterContextValue extends Omit<UseConfigReturn, 'loading'> {
  configLoading: boolean;
  connected: boolean;
  wsError: string | null;
  reconnect: () => void;
  inverters: Record<string, InverterMetrics>;
  selectedInverter: string | null;
  selectInverter: (serial: string) => void;
  currentInverter: InverterMetrics | null;
  inverterSerials: string[];
  hasMetrics: boolean;
  lastUpdate: Date | null;
  inverterLastSeen: Record<string, Date>;
}