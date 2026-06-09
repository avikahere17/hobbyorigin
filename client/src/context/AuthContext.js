import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { client } from '../apollo';

const AuthContext = createContext(null);

function applyTheme(theme, ageGroup) {
  const t = theme || (ageGroup === 'KIDS' ? 'PLAYFUL' : ageGroup === 'SENIORS' ? 'ACCESSIBLE' : 'STANDARD');
  document.body.className = `theme-${t}`;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hc_user') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    if (currentUser) applyTheme(currentUser.theme, currentUser.ageGroup);
    else applyTheme('STANDARD');
  }, [currentUser]);

  const login = useCallback((token, user) => {
    localStorage.setItem('hc_token', token);
    localStorage.setItem('hc_user', JSON.stringify(user));
    setCurrentUser(user);
    applyTheme(user.theme, user.ageGroup);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
    setCurrentUser(null);
    applyTheme('STANDARD');
    client.clearStore();
  }, []);

  const updateCurrentUser = useCallback((updates) => {
    setCurrentUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('hc_user', JSON.stringify(next));
      if (updates.theme || updates.ageGroup) applyTheme(updates.theme || next.theme, updates.ageGroup || next.ageGroup);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
