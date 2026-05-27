import { useState, useEffect } from 'react';
import type { FacilityConfig } from '../types';

function buildWsUrl(config: FacilityConfig): string {
  if (config.backendWsUrl) return config.backendWsUrl;
  if (config.backendUrl) return config.backendUrl.replace(/^http/, 'ws');
  return `ws://${window.location.host}/ws`;
}

function buildWsUrlWithKey(config: FacilityConfig): string {
  const wsUrl = buildWsUrl(config);
  return config.accessKey
    ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}access_key=${config.accessKey}`
    : wsUrl;
}

export function enrichedFacilityConfig(raw: Partial<FacilityConfig>): FacilityConfig {
  return {
    backendUrl: raw.backendUrl ?? '',
    backendWsUrl: raw.backendWsUrl ?? '',
    accessKey: raw.accessKey ?? '',
    facilityName: raw.facilityName ?? 'Unknown',
  };
}

export function useConfig() {
  const [facilities, setFacilities] = useState<FacilityConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/config.json', { cache: 'no-store' })
      .then((res) => {
        if (res.status === 304 || res.status === 200) return res.json();
        throw new Error(`HTTP ${res.status}`);
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setFacilities(data.map(enrichedFacilityConfig));
        } else if (data && typeof data === 'object') {
          setFacilities([enrichedFacilityConfig(data as Partial<FacilityConfig>)]);
        } else {
          setFacilities([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useConfig] Failed to load config:', err);
        setFacilities([]);
        setLoading(false);
      });
  }, []);

  return {
    facilities,
    loading,
    facilityCount: facilities.length,
    buildWsUrlWithKey,
  };
}
