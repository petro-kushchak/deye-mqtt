import { describe, it, expect } from 'vitest';
import {
  formatPower,
  formatVoltage,
  formatCurrent,
  formatEnergy,
  formatFrequency,
  formatTemperature,
  getBatteryStatusColor,
  getBatteryStatusLabel,
  getGridStatus,
  getRunningStatusColor,
  getRunningStatusLabel,
  getTimeAgo,
  isStale,
  COLORS,
} from '../utils/formatters';

describe('formatters', () => {
  describe('formatPower', () => {
    it('should format number with default decimals', () => {
      expect(formatPower(1234)).toBe('1234');
    });

    it('should format number with specified decimals', () => {
      expect(formatPower(1234.567, 2)).toBe('1234.57');
    });

    it('should return "0" for undefined', () => {
      expect(formatPower(undefined)).toBe('0');
    });

    it('should return "0" for null', () => {
      expect(formatPower(null)).toBe('0');
    });

    it('should return string as-is', () => {
      expect(formatPower('N/A')).toBe('N/A');
    });
  });

  describe('formatVoltage', () => {
    it('should format voltage with 1 decimal', () => {
      expect(formatVoltage(220.56)).toBe('220.6');
    });
  });

  describe('formatCurrent', () => {
    it('should format current with 1 decimal', () => {
      expect(formatCurrent(5.67)).toBe('5.7');
    });
  });

  describe('formatEnergy', () => {
    it('should format energy with default unit', () => {
      expect(formatEnergy(12.5)).toBe('12.5 kWh');
    });

    it('should format energy with custom unit', () => {
      expect(formatEnergy(5.2, 'MWh')).toBe('5.2 MWh');
    });
  });

  describe('formatFrequency', () => {
    it('should format frequency from value/100', () => {
      expect(formatFrequency(5000)).toBe('50.00 Hz');
    });

    it('should return "0 Hz" for null/undefined', () => {
      expect(formatFrequency(null)).toBe('0 Hz');
      expect(formatFrequency(undefined)).toBe('0 Hz');
    });
  });

  describe('formatTemperature', () => {
    it('should format temperature with 1 decimal', () => {
      expect(formatTemperature(25.67)).toBe('25.7 °C');
    });

    it('should return "0 °C" for null/undefined', () => {
      expect(formatTemperature(null)).toBe('0 °C');
    });
  });

  describe('getBatteryStatusColor', () => {
    it('should return battery color when charging (negative power)', () => {
      expect(getBatteryStatusColor(-100)).toBe(COLORS.battery);
    });

    it('should return solar color when discharging (positive power)', () => {
      expect(getBatteryStatusColor(100)).toBe(COLORS.solar);
    });

    it('should return idle color when no power', () => {
      expect(getBatteryStatusColor(0)).toBe(COLORS.gridIdle);
    });
  });

  describe('getBatteryStatusLabel', () => {
    it('should return "Charging" for negative power', () => {
      expect(getBatteryStatusLabel(-100)).toBe('Charging');
    });

    it('should return "Discharging" for positive power', () => {
      expect(getBatteryStatusLabel(100)).toBe('Discharging');
    });

    it('should return "Stand-by" for zero power', () => {
      expect(getBatteryStatusLabel(0)).toBe('Stand-by');
    });
  });

  describe('getGridStatus', () => {
    it('should return exporting status for negative power', () => {
      expect(getGridStatus(-500)).toEqual({ label: 'Exporting', color: COLORS.gridExport });
    });

    it('should return importing status for positive power', () => {
      expect(getGridStatus(500)).toEqual({ label: 'Importing', color: COLORS.gridImport });
    });

    it('should return idle status for zero power', () => {
      expect(getGridStatus(0)).toEqual({ label: 'Idle', color: COLORS.gridIdle });
    });
  });

  describe('getRunningStatusColor', () => {
    it('should return correct color for each status', () => {
      expect(getRunningStatusColor('Stand-by')).toBe('default');
      expect(getRunningStatusColor('Self-checking')).toBe('info');
      expect(getRunningStatusColor('Normal')).toBe('success');
      expect(getRunningStatusColor('FAULT')).toBe('error');
    });

    it('should return default for unknown status', () => {
      expect(getRunningStatusColor('Unknown')).toBe('default');
    });

    it('should return default for undefined', () => {
      expect(getRunningStatusColor(undefined)).toBe('default');
    });
  });

  describe('getRunningStatusLabel', () => {
    it('should return status or "Unknown"', () => {
      expect(getRunningStatusLabel('Normal')).toBe('Normal');
      expect(getRunningStatusLabel(undefined)).toBe('Unknown');
      expect(getRunningStatusLabel('')).toBe('Unknown');
    });
  });

  describe('getTimeAgo', () => {
    it('should return "Never" for null', () => {
      expect(getTimeAgo(null)).toBe('Never');
    });

    it('should return "Never" for undefined', () => {
      expect(getTimeAgo(undefined)).toBe('Never');
    });

    it('should return "Just now" for recent time', () => {
      const recent = new Date(Date.now() - 3000);
      expect(getTimeAgo(recent)).toBe('Just now');
    });

    it('should return seconds for < 60s', () => {
      const secondsAgo = new Date(Date.now() - 30000);
      expect(getTimeAgo(secondsAgo)).toBe('30s ago');
    });

    it('should return minutes for < 60 min', () => {
      const minutesAgo = new Date(Date.now() - 60000 * 5);
      expect(getTimeAgo(minutesAgo)).toBe('5m ago');
    });

    it('should return hours for < 24 hours', () => {
      const hoursAgo = new Date(Date.now() - 3600000 * 3);
      expect(getTimeAgo(hoursAgo)).toBe('3h ago');
    });

    it('should return days for > 24 hours', () => {
      const daysAgo = new Date(Date.now() - 86400000 * 2);
      expect(getTimeAgo(daysAgo)).toBe('2d ago');
    });
  });

  describe('isStale', () => {
    it('should return true for null', () => {
      expect(isStale(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isStale(undefined)).toBe(true);
    });

    it('should return true for old date (> 120s)', () => {
      const old = new Date(Date.now() - 130000);
      expect(isStale(old)).toBe(true);
    });

    it('should return false for recent date (< 120s)', () => {
      const recent = new Date(Date.now() - 60000);
      expect(isStale(recent)).toBe(false);
    });
  });
});