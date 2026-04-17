import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useConfig } from '../hooks/useConfig';
import { useWebSocket } from '../hooks/useWebSocket';
import { useInverterData } from '../hooks/useInverterData';
import type { InverterContextValue } from '../types';

export const InverterContext = createContext<InverterContextValue | null>(null);

interface InverterProviderProps {
  children: ReactNode;
}

export function InverterProvider({ children }: InverterProviderProps) {
  const { config, loading: configLoading, apiUrl, accessKey, wsUrlWithKey, facilityName } = useConfig();
  const { connected, error: wsError, lastMessage, reconnect: wsReconnect } = useWebSocket(wsUrlWithKey, !!config);
  const {
    inverters,
    selectedInverter,
    selectInverter,
    currentInverter,
    inverterSerials,
    hasMetrics,
    lastUpdate,
    inverterLastSeen,
  } = useInverterData(lastMessage, connected);

  const value = useMemo<InverterContextValue>(() => ({
    config,
    configLoading,
    apiUrl,
    accessKey,
    wsUrlWithKey,
    facilityName,
    connected,
    wsError,
    lastMessage,
    reconnect: wsReconnect,
    inverters,
    selectedInverter,
    selectInverter,
    currentInverter,
    inverterSerials,
    hasMetrics,
    lastUpdate,
    inverterLastSeen,
  }), [
    config,
    configLoading,
    apiUrl,
    accessKey,
    wsUrlWithKey,
    facilityName,
    connected,
    wsError,
    lastMessage,
    wsReconnect,
    inverters,
    selectedInverter,
    selectInverter,
    currentInverter,
    inverterSerials,
    hasMetrics,
    lastUpdate,
    inverterLastSeen,
  ]);

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