import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Theme aus localStorage laden oder System preference verwenden
    const saved = localStorage.getItem('theme');
    if (saved) {
      const darkMode = saved === 'dark';
      setIsDark(darkMode);
      updateDocumentTheme(darkMode);
    } else {
      // System preference prüfen
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(systemPrefersDark);
      updateDocumentTheme(systemPrefersDark);
    }
  }, []);

  const updateDocumentTheme = (dark) => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    updateDocumentTheme(newTheme);
  };

  return { isDark, toggleTheme };
}
