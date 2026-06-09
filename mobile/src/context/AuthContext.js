import React, { createContext, useContext, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const login = useCallback(async (token, user) => {
    await SecureStore.setItemAsync('hc_token', token);
    await SecureStore.setItemAsync('hc_user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('hc_token');
    await SecureStore.deleteItemAsync('hc_user');
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
