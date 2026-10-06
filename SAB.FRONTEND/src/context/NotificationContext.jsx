import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_BASE_URL } from '../api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id || user.isAdmin) return;
    const socket = io(SERVER_BASE_URL);
    socket.emit('join', user.id);
    socket.on('notification', (data) => {
      setNotifications((prev) => [{ ...data, id: Date.now(), read: false }, ...prev]);
    });
    return () => socket.disconnect();
  }, [user?.id]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
