import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => {
    const stored = localStorage.getItem('tpc_theme');
    return stored === 'dark' ? 'dark' : 'light';
  });

  const applyTheme = useCallback((p) => {
    document.documentElement.setAttribute('data-theme', p);
    document.documentElement.style.colorScheme = p;
  }, []);

  useEffect(() => {
    applyTheme(pref);
    localStorage.setItem('tpc_theme', pref);
  }, [pref, applyTheme]);

  const toggleTheme = useCallback(() => {
    setPref((p) => (p === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, setPref, toggleTheme, resolved: pref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
