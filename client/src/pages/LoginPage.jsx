import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [loginMode, setLoginMode] = useState('code'); // 'code' or 'password'
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithCode, user, loginEnabled } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect based on role
    if (user) {
      const isAdminUser = user.role === 'admin' || user.role === 'superadmin';
      navigate(isAdminUser ? '/admin' : '/products');
    }

    // If login is disabled, redirect to home
    if (loginEnabled === false) {
      navigate('/');
    }
  }, [user, loginEnabled, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (loginMode === 'code') {
      result = await loginWithCode(accessCode);
    } else {
      result = await login(email, password);
    }

    if (result.success) {
      const isAdminUser = result.user?.role === 'admin' || result.user?.role === 'superadmin';
      navigate(isAdminUser ? '/admin' : '/products');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-40 h-20 mx-auto mb-4 rounded-lg bg-primary-600 p-2">
            <img
              src="/images/logo.webp"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Login Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setLoginMode('code'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              loginMode === 'code'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Access Code
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(''); }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              loginMode === 'password'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Name & Password
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === 'code' ? (
            <div>
              <label htmlFor="accessCode" className="block text-lg font-semibold text-gray-700 mb-2">
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="input font-mono text-center text-xl tracking-widest"
                placeholder="XXXXXXXX"
                required
                autoFocus
                maxLength={8}
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter your 8-character access code
              </p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="email" className="block text-lg font-semibold text-gray-700 mb-2">
                  Name
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your name"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
