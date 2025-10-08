import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, loginEnabled } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If login is disabled, allow access
  if (!loginEnabled) {
    return children;
  }

  // If login is enabled, check authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
