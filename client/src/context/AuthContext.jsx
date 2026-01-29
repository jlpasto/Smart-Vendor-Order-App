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
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // Check if login is enabled
    const loginStatus = await checkLoginStatus();

    // If login is disabled, set demo admin user
    if (loginStatus === false) {
      const demoUser = {
        id: 1,
        email: 'admin@demo.com',
        role: 'admin'
      };
      setUser(demoUser);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    // If login is enabled, check for existing session
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  };

  const checkLoginStatus = async () => {
    try {
      const response = await api.get('/api/auth/login-status');
      setLoginEnabled(response.data.enabled);
      return response.data.enabled;
    } catch (error) {
      console.error('Error checking login status:', error);
      setLoginEnabled(false); // Default to disabled
      return false;
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
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demoUser');

    // Clear session storage as well
    sessionStorage.clear();

    // Remove Authorization header from API requests
    delete api.defaults.headers.common['Authorization'];

    // Clear user state
    setUser(null);

    // Optional: Clear any other app-specific data
    // localStorage.removeItem('cart'); // Uncomment if you want to clear cart on logout
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'superadmin';
  };

  const isSuperAdmin = () => {
    return user?.role === 'superadmin';
  };

  // Function to set demo user (only works when login is disabled)
  const setDemoUser = (demoUser) => {
    if (loginEnabled === false) {
      setUser(demoUser);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
    }
  };

  const value = {
    user,
    loading,
    loginEnabled,
    signup,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    setDemoUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
