import { useState, useEffect } from 'react';
import type { AppConfig, UseConfigReturn } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  backendUrl: '',
  backendWsUrl: '',
  accessKey: '',
  facilityName: '',
};

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useConfig] Fetching config.json...');
    fetch('/config.json', { cache: 'no-store' })
      .then((res) => {
        console.log('[useConfig] Response status:', res.status, res.statusText);
        if (res.status === 304 || res.status === 200) {
          return res.json();
        }
        throw new Error(`HTTP ${res.status}`);
      })
      .then((data: Partial<AppConfig>) => {
        console.log('[useConfig] Loaded config:', data);
        setConfig({ ...DEFAULT_CONFIG, ...data });
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useConfig] Failed to load config:', err);
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
      });
  }, []);

  const apiUrl = config?.backendUrl ?? '';
  const accessKey = config?.accessKey ?? '';
  const wsUrl = config?.backendWsUrl ?? (config?.backendUrl ? config.backendUrl.replace(/^http/, 'ws') : `ws://${window.location.host}/ws`);
  const wsUrlWithKey = accessKey ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}access_key=${accessKey}` : wsUrl;

  return {
    config,
    loading,
    apiUrl,
    accessKey,
    wsUrlWithKey,
    facilityName: config?.facilityName ?? '',
  };
}