import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('procuraflow-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      const root = document.documentElement;
      const body = document.body;
      if (next) {
        root.classList.add('dark');
        body?.classList.add('dark');
        try {
          localStorage.setItem('procuraflow-theme', 'dark');
        } catch {
          // ignore
        }
      } else {
        root.classList.remove('dark');
        body?.classList.remove('dark');
        try {
          localStorage.setItem('procuraflow-theme', 'light');
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body?.classList.add('dark');
      try {
        localStorage.setItem('procuraflow-theme', 'dark');
      } catch {
        // ignore
      }
    } else {
      root.classList.remove('dark');
      body?.classList.remove('dark');
      try {
        localStorage.setItem('procuraflow-theme', 'light');
      } catch {
        // ignore
      }
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

