import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { User } from '../types';
import { apiFetch, setAuthTokens, removeAuthTokens, getUserFromCookie } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string) => Promise<void>;
  logout: () => void;
  quickLogin: (email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getUserFromCookie());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = Cookies.get('jwt_token');
    if (token) {
      apiFetch('/auth/me')
        .then((res) => {
          if (res.data && res.data.user) {
            setUser(res.data.user);
            Cookies.set('user', JSON.stringify(res.data.user), { expires: 7 });
          }
        })
        .catch(() => {
          removeAuthTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    const { accessToken, refreshToken, user: loggedUser } = res.data;
    setAuthTokens(accessToken, refreshToken, loggedUser);
    setUser(loggedUser);
  };

  const register = async (name: string, email: string, pass: string, role = 'Member') => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass, role }),
    });

    const { accessToken, refreshToken, user: newUser } = res.data;
    setAuthTokens(accessToken, refreshToken, newUser);
    setUser(newUser);
  };

  const logout = () => {
    const refreshToken = Cookies.get('refresh_token');
    if (refreshToken) {
      apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    removeAuthTokens();
    setUser(null);
  };

  const quickLogin = async (email: string, pass: string) => {
    await login(email, pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && Cookies.get('jwt_token')),
        isLoading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
