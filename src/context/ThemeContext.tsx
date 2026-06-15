import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const THEME_KEY_PREFIX = 'theme_';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(userId: string): Theme | null {
  const stored = localStorage.getItem(THEME_KEY_PREFIX + userId);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');

  // Switch to the signed-in user's last used theme (defaulting to light for
  // users who haven't picked one yet, and when no one is signed in).
  useEffect(() => {
    setTheme(user ? getStoredTheme(user.id) ?? 'light' : 'light');
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) {
      localStorage.setItem(THEME_KEY_PREFIX + user.id, next);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
