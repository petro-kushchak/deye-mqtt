import { useState, useEffect, useRef, useCallback } from 'react';
import type { UseWebSocketReturn } from '../types';

export function useWebSocket(wsUrl: string, enabled = true): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = 5000;

  const connect = useCallback(() => {
    if (!wsUrl || !enabled) return;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);
    };

    wsRef.current.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    wsRef.current.onerror = () => {
      console.error('WebSocket error');
      setError('Connection error');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
    };
  }, [wsUrl, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  return {
    connected,
    error,
    lastMessage,
    reconnect,
  };
}