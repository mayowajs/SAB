import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const themeOptions = ['system', 'light', 'dark'];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('sab_theme');
    return themeOptions.includes(savedTheme) ? savedTheme : 'system';
  });

  useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const activeTheme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = activeTheme;
      document.documentElement.style.colorScheme = activeTheme;
    };

    applyTheme();
    if (theme === 'system') systemTheme.addEventListener('change', applyTheme);
    return () => systemTheme.removeEventListener('change', applyTheme);
  }, [theme]);

  const changeTheme = (nextTheme) => {
    if (!themeOptions.includes(nextTheme)) return;
    localStorage.setItem('sab_theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};