import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginEnabled, setLoginEnabled] = useState(false);

  useEffect(() => {
    // Check if login is enabled
    checkLoginStatus();

    // Check for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await api.get('/api/auth/login-status');
      setLoginEnabled(response.data.enabled);
    } catch (error) {
      console.error('Error checking login status:', error);
      setLoginEnabled(false); // Default to disabled
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await api.post('/api/auth/signup', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signup failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    loginEnabled,
    signup,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
