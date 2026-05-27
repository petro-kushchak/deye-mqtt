import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFacilityState, processFacilityMessage } from '../hooks/useFacilityConnection';
import { getInverterStatus, isStale, getTimeAgo } from '../hooks/useInverterData';
import type { FacilityConfig } from '../types';

const mockConfig: FacilityConfig = {
  backendUrl: 'http://localhost:8000',
  backendWsUrl: '',
  accessKey: '',
  facilityName: 'Test Facility',
};

describe('createFacilityState', () => {
  it('should create initial state from config', () => {
    const state = createFacilityState(mockConfig);
    expect(state.config.facilityName).toBe('Test Facility');
    expect(state.connected).toBe(false);
    expect(state.inverters).toEqual({});
    expect(state.hasMetrics).toBe(false);
  });
});

describe('processFacilityMessage', () => {
  it('should return same state for null message', () => {
    const state = createFacilityState(mockConfig);
    const result = processFacilityMessage(state, null);
    expect(result).toBe(state);
  });

  it('should process valid message and set inverter', () => {
    const state = createFacilityState(mockConfig);
    const message = [{
      serial: 'TEST123',
      pv_power: 1000,
      pv1_power: 500,
      pv2_power: 500,
      pv1_voltage: 200,
      pv2_voltage: 200,
      pv1_current: 2.5,
      pv2_current: 2.5,
      battery_soc: 80,
      battery_power: -500,
      grid_power: 200,
      total_load_power: 800,
      battery_status: 'Charging',
      'Running Status': 'Normal',
    }];

    const result = processFacilityMessage(state, message);
    expect(result.inverters['TEST123']).toBeDefined();
    expect(result.selectedInverter).toBe('TEST123');
    expect(result.currentInverter?.pv_power).toBe(1000);
    expect(result.hasMetrics).toBe(true);
    expect(result.lastUpdate).toBeInstanceOf(Date);
  });

  it('should handle empty array', () => {
    const state = createFacilityState(mockConfig);
    const result = processFacilityMessage(state, []);
    expect(result.inverters).toEqual({});
    expect(result.hasMetrics).toBe(false);
  });

  it('should select first inverter when none selected', () => {
    const state = createFacilityState(mockConfig);
    const message = [
      { serial: 'INV1', pv_power: 100, pv1_power: 50, pv2_power: 50, pv1_voltage: 100, pv2_voltage: 100, pv1_current: 1, pv2_current: 1, battery_soc: 50, battery_power: 0, grid_power: 0, total_load_power: 0, battery_status: 'Stand-by', 'Running Status': 'Stand-by' },
    ];

    const result = processFacilityMessage(state, message);
    expect(result.selectedInverter).toBe('INV1');
  });

  it('should enrich metrics with defaults', () => {
    const state = createFacilityState(mockConfig);
    const message = [{ serial: 'TEST' }];

    const result = processFacilityMessage(state, message);
    const inverter = result.inverters['TEST'];
    expect(inverter.pv_power).toBe(0);
    expect(inverter.pv1_power).toBe(0);
    expect(inverter.battery_soc).toBe(0);
    expect(inverter['Running Status']).toBe('Stand-by');
  });
});

describe('getInverterStatus', () => {
  it('should return Unknown for null', () => {
    expect(getInverterStatus(null)).toEqual({ label: 'Unknown', color: 'default' });
  });

  it('should return Unknown for undefined', () => {
    expect(getInverterStatus(undefined)).toEqual({ label: 'Unknown', color: 'default' });
  });

  it('should return correct status for Normal', () => {
    const status = { 'Running Status': 'Normal', pv_power: 100 } as any;
    expect(getInverterStatus(status)).toEqual({ label: 'Normal', color: 'success' });
  });

  it('should return correct status for FAULT', () => {
    const status = { 'Running Status': 'FAULT', pv_power: 100 } as any;
    expect(getInverterStatus(status)).toEqual({ label: 'FAULT', color: 'error' });
  });

  it('should default to Stand-by', () => {
    const status = { 'Running Status': 'Unknown', pv_power: 100 } as any;
    expect(getInverterStatus(status)).toEqual({ label: 'Unknown', color: 'default' });
  });
});

describe('isStale', () => {
  it('should return true for null', () => {
    expect(isStale(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isStale(undefined)).toBe(true);
  });

  it('should return true for stale date', () => {
    const staleDate = new Date(Date.now() - 121000);
    expect(isStale(staleDate)).toBe(true);
  });

  it('should return false for recent date', () => {
    const recentDate = new Date(Date.now() - 60000);
    expect(isStale(recentDate)).toBe(false);
  });
});

describe('getTimeAgo', () => {
  it('should return Never for null', () => {
    expect(getTimeAgo(null)).toBe('Never');
  });

  it('should return Never for undefined', () => {
    expect(getTimeAgo(undefined)).toBe('Never');
  });

  it('should return Just now for < 5 seconds', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 3000);
    expect(getTimeAgo(recent)).toBe('Just now');
  });

  it('should return seconds for < 60 seconds', () => {
    const now = new Date();
    const secondsAgo = new Date(now.getTime() - 30000);
    expect(getTimeAgo(secondsAgo)).toBe('30s ago');
  });

  it('should return minutes for < 60 minutes', () => {
    const now = new Date();
    const minutesAgo = new Date(now.getTime() - 60000 * 5);
    expect(getTimeAgo(minutesAgo)).toBe('5m ago');
  });

  it('should return hours for < 24 hours', () => {
    const now = new Date();
    const hoursAgo = new Date(now.getTime() - 3600000 * 3);
    expect(getTimeAgo(hoursAgo)).toBe('3h ago');
  });

  it('should return days for >= 24 hours', () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - 86400000 * 2);
    expect(getTimeAgo(daysAgo)).toBe('2d ago');
  });
});
