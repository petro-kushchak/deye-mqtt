import { createContext, useContext, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useConfig, enrichedFacilityConfig } from '../hooks/useConfig';
import { createFacilityState, processFacilityMessage } from '../hooks/useFacilityConnection';
import type { InverterContextValue, FacilityState, FacilityConfig } from '../types';

export const InverterContext = createContext<InverterContextValue | null>(null);

interface InverterProviderProps {
  children: ReactNode;
}

const RECONNECT_DELAY = 5000;

function connectFacilityWebSocket(
  config: FacilityConfig,
  index: number,
  wsRefs: React.MutableRefObject<Map<number, WebSocket>>,
  onStateChange: (index: number, updater: (prev: FacilityState) => FacilityState) => void,
) {
  const wsUrl = `${config.backendWsUrl || config.backendUrl.replace(/^http/, 'ws')}${config.accessKey ? `${(config.backendWsUrl || config.backendUrl.replace(/^http/, 'ws')).includes('?') ? '&' : '?'}access_key=${config.accessKey}` : ''}`;

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    const existing = wsRefs.current.get(index);
    if (existing) {
      existing.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRefs.current.set(index, ws);

    ws.onopen = () => {
      onStateChange(index, (prev) => ({ ...prev, connected: true, error: null }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onStateChange(index, (prev) => processFacilityMessage(prev, data));
      } catch (e) {
        console.error(`[Facility ${index}] Failed to parse message:`, e);
      }
    };

    ws.onerror = () => {
      onStateChange(index, (prev) => ({ ...prev, error: 'Connection error' }));
    };

    ws.onclose = () => {
      onStateChange(index, (prev) => ({ ...prev, connected: false }));
      reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
    };
  }

  connect();

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const ws = wsRefs.current.get(index);
    if (ws) {
      ws.close();
      wsRefs.current.delete(index);
    }
  };
}

export function InverterProvider({ children }: InverterProviderProps) {
  const { facilities: rawConfigs, loading: configLoading } = useConfig();
  const wsRefs = useRef<Map<number, WebSocket>>(new Map());
  const [facilityStates, setFacilityStates] = useState<FacilityState[]>([]);
  const [selectedFacility, setSelectedFacility] = useState(0);

  const configs = useMemo(
    () => rawConfigs.map((c) => enrichedFacilityConfig(c)),
    [rawConfigs],
  );

  const onStateChange = useCallback(
    (index: number, updater: (prev: FacilityState) => FacilityState) => {
      setFacilityStates((prev) => {
        const next = [...prev];
        next[index] = updater(next[index] ?? createFacilityState(configs[index]));
        return next;
      });
    },
    [configs],
  );

  useEffect(() => {
    if (configs.length === 0) {
      setFacilityStates([]);
      return;
    }

    setFacilityStates(configs.map((c) => createFacilityState(c)));

    const cleanups = configs.map((config, i) =>
      connectFacilityWebSocket(config, i, wsRefs, onStateChange),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      wsRefs.current.clear();
    };
  }, [configs, onStateChange]);

  useEffect(() => {
    if (selectedFacility >= configs.length && configs.length > 0) {
      setSelectedFacility(0);
    }
  }, [configs.length, selectedFacility]);

  const selectFacility = useCallback((index: number) => {
    setSelectedFacility(index);
  }, []);

  const selectFacilityInverter = useCallback(
    (facilityIndex: number, serial: string) => {
      setFacilityStates((prev) => {
        const next = [...prev];
        const facility = next[facilityIndex];
        if (facility) {
          const currentInverter = facility.inverters[serial] ?? null;
          next[facilityIndex] = {
            ...facility,
            selectedInverter: serial,
            currentInverter,
            hasMetrics: currentInverter !== null && currentInverter.pv_power !== undefined,
          };
        }
        return next;
      });
    },
    [],
  );

  const currentFacility = facilityStates[selectedFacility] ?? null;

  const value = useMemo<InverterContextValue>(
    () => ({
      configLoading,
      facilities: facilityStates,
      selectedFacility,
      selectFacility,
      selectFacilityInverter,
      currentFacility,
      configs,
    }),
    [configLoading, facilityStates, selectedFacility, selectFacility, selectFacilityInverter, currentFacility, configs],
  );

  return (
    <InverterContext.Provider value={value}>
      {children}
    </InverterContext.Provider>
  );
}

export function useInverter(): InverterContextValue {
  const context = useContext(InverterContext);
  if (!context) {
    throw new Error('useInverter must be used within InverterProvider');
  }
  return context;
}
