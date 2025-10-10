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
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CC</span>
              </div>
              <span className="font-display font-bold text-2xl text-primary-900 hidden sm:inline">
                Cureate Connect
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
      <footer className="bg-primary-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-display font-bold text-xl mb-2">Cureate Connect</h3>
              <p className="text-primary-200 text-sm">
                Empowering local food businesses through strategic procurement opportunities.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-200">Connecting vendors with institutional buyers</p>
              <a href="https://www.cureate.co/connect" target="_blank" rel="noopener noreferrer"
                 className="text-primary-300 hover:text-white text-sm mt-2 inline-block">
                Learn more about Cureate →
              </a>
            </div>
          </div>
          <div className="border-t border-primary-800 pt-4">
            <div className="text-center">
              <p className="text-sm text-primary-300">© 2025 Cureate Connect. All rights reserved.</p>
              {user && (
                <p className="text-xs mt-2 text-primary-400">
                  Logged in as: <span className="font-semibold text-primary-200">{user.email}</span>
                  {isAdmin() && <span className="ml-2 badge badge-pending">Admin</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
