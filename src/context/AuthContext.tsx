import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_USERS } from '../lib/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, role?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mock initial state: logged in as Student
  const [user, setUser] = useState<User | null>(MOCK_USERS[0]);

  const login = (email: string, role?: string) => {
    // Find a mock user by email or just pick one based on role for demo purposes
    let found = MOCK_USERS.find(u => u.email === email);
    if (!found && role) {
      found = MOCK_USERS.find(u => u.role === role);
    }
    if (!found) {
       found = MOCK_USERS[0];
    }
    setUser(found);
    localStorage.setItem('auth_user_id', found.id);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_id');
  };

  useEffect(() => {
    const storedId = localStorage.getItem('auth_user_id');
    if (storedId) {
      const found = MOCK_USERS.find(u => u.id === storedId);
      if (found) setUser(found);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
