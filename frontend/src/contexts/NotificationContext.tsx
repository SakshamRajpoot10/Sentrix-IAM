import React, { createContext, useContext } from 'react';
import { toast, Toaster } from 'sonner';

interface NotificationContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const success = (message: string) => {
    toast.success(message, {
      style: {
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      },
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      style: {
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.2)',
      },
    });
  };

  const warning = (message: string) => {
    toast.warning(message, {
      style: {
        background: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        border: '1px solid rgba(245, 158, 11, 0.2)',
      },
    });
  };

  const info = (message: string) => {
    toast.info(message, {
      style: {
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      },
    });
  };

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
      <Toaster position="top-right" theme="dark" closeButton />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
