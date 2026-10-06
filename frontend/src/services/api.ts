import Cookies from 'js-cookie';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

export const getAuthToken = (): string | undefined => {
  return Cookies.get('jwt_token');
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refresh_token');
};

export const setAuthTokens = (accessToken: string, refreshToken?: string, user?: any) => {
  Cookies.set('jwt_token', accessToken, { expires: 7 });
  if (refreshToken) {
    Cookies.set('refresh_token', refreshToken, { expires: 7 });
  }
  if (user) {
    Cookies.set('user', JSON.stringify(user), { expires: 7 });
  }
};

export const removeAuthTokens = () => {
  Cookies.remove('jwt_token');
  Cookies.remove('refresh_token');
  Cookies.remove('user');
};

export const getUserFromCookie = () => {
  const userStr = Cookies.get('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const { accessToken: newAccess, refreshToken: newRefresh, user } = refreshData.data;
          setAuthTokens(newAccess, newRefresh, user);
          
          headers['Authorization'] = `Bearer ${newAccess}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        } else {
          removeAuthTokens();
        }
      } catch (e) {
        removeAuthTokens();
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong while communicating with the server.');
  }

  return data;
};
