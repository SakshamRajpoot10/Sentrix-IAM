import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../services/api';

interface WebSocketContextType {
  connected: boolean;
  subscribe: (destination: string, callback: (message: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, Set<(message: any) => void>>>(new Map());

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Create SockJS connection
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`, // Pass token securely in headers
      },
      debug: (msg) => {
        if (import.meta.env.DEV) {
          console.debug('[WebSocket]', msg);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Connected to WebSocket STOMP broker');
      setConnected(true);

      // Re-establish active subscriptions on reconnect
      subscriptionsRef.current.forEach((callbacks, destination) => {
        client.subscribe(destination, (message) => {
          const body = JSON.parse(message.body);
          callbacks.forEach((cb) => cb(body));
        });
      });
    };

    client.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error('STOMP protocol error:', frame.headers['message']);
      setConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
    };
  }, [user]);

  const subscribe = (destination: string, callback: (message: any) => void) => {
    // Add to local subscriptions registry
    if (!subscriptionsRef.current.has(destination)) {
      subscriptionsRef.current.set(destination, new Set());
    }
    subscriptionsRef.current.get(destination)!.add(callback);

    let stompSubscription: any = null;

    // If already connected, subscribe immediately
    if (stompClientRef.current && connected) {
      stompSubscription = stompClientRef.current.subscribe(destination, (message) => {
        const body = JSON.parse(message.body);
        callback(body);
      });
    }

    // Return unsubscription function
    return () => {
      const callbacks = subscriptionsRef.current.get(destination);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscriptionsRef.current.delete(destination);
        }
      }
      if (stompSubscription) {
        stompSubscription.unsubscribe();
      }
    };
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
};
