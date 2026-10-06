import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext();
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sab_user');
    return saved ? JSON.parse(saved) : null;
  });
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('sab_user');
    localStorage.removeItem('sab_token');
    setUser(null);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => logout(), TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  const login = (userData, token) => {
    localStorage.setItem('sab_user', JSON.stringify(userData));
    localStorage.setItem('sab_token', token);
    setUser(userData);
  };

  const updateUser = (updated) => {
    localStorage.setItem('sab_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
