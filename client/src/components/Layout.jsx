import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const cartCount = getCartCount();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="font-display font-bold text-2xl text-gray-900 hidden sm:inline">
                Wholesale Hub
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/products"
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActive('/products')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Products
              </Link>

              <Link
                to="/cart"
                className={`relative px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActive('/cart')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <Link
                to="/orders"
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isActive('/orders')
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                My Orders
              </Link>

              {isAdmin() && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-amber-600 text-white'
                      : 'text-amber-700 hover:bg-amber-50 border-2 border-amber-600'
                  }`}
                >
                  Admin
                </Link>
              )}

              {user && (
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-base">© 2025 Wholesale Order Hub. All rights reserved.</p>
            {user && (
              <p className="text-sm mt-2">
                Logged in as: <span className="font-semibold">{user.email}</span>
                {isAdmin() && <span className="ml-2 badge badge-pending">Admin</span>}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
