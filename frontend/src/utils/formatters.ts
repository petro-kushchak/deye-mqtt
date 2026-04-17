export const COLORS = {
  solar: '#ff9800',
  battery: '#4caf50',
  gridImport: '#4caf50',
  gridExport: '#ff9800',
  gridIdle: '#9e9e9e',
  load: '#0288d1',
  pvString: '#e65100',
  info: '#e0e0e0',
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9e9e9e',
  },
} as const;

export const formatPower = (value: number | string | undefined | null, decimals = 0): string => {
  if (value === undefined || value === null) return '0';
  return typeof value === 'number' ? value.toFixed(decimals) : value;
};

export const formatVoltage = (value: number | string | undefined | null): string => formatPower(value, 1);

export const formatCurrent = (value: number | string | undefined | null): string => formatPower(value, 1);

export const formatEnergy = (value: number | string | undefined | null, unit = 'kWh'): string => {
  if (value === undefined || value === null) return `0 ${unit}`;
  return `${formatPower(value, 1)} ${unit}`;
};

export const formatFrequency = (value: number | undefined | null): string => {
  if (!value) return '0 Hz';
  return `${(value / 100).toFixed(2)} Hz`;
};

export const formatTemperature = (value: number | undefined | null): string => {
  if (!value) return '0 °C';
  return `${value.toFixed(1)} °C`;
};

export const getBatteryStatusColor = (batteryPower: number): string => {
  if (batteryPower < 0) return COLORS.battery;
  if (batteryPower > 0) return COLORS.solar;
  return COLORS.gridIdle;
};

export const getBatteryStatusLabel = (batteryPower: number): string => {
  if (batteryPower > 0) return 'Discharging';
  if (batteryPower < 0) return 'Charging';
  return 'Stand-by';
};

export const getGridStatus = (gridPower: number): { label: string; color: string } => {
  if (gridPower < 0) return { label: 'Exporting', color: COLORS.gridExport };
  if (gridPower > 0) return { label: 'Importing', color: COLORS.gridImport };
  return { label: 'Idle', color: COLORS.gridIdle };
};

export const getRunningStatusColor = (status: string | undefined): string => {
  const colors: Record<string, string> = {
    'Stand-by': 'default',
    'Self-checking': 'info',
    'Normal': 'success',
    'FAULT': 'error',
  };
  return status ? (colors[status] ?? 'default') : 'default';
};

export const getRunningStatusLabel = (status: string | undefined): string => {
  if (!status) return 'Unknown';
  return status;
};

export const getTimeAgo = (date: Date | null | undefined): string => {
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
};

export const isStale = (date: Date | null | undefined): boolean => {
  if (!date) return true;
  return (new Date().getTime() - date.getTime()) > 120000;
};