import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useState } from 'react';
import DemoUserSwitcher from './DemoUserSwitcher';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { globalSearchTerm, setGlobalSearchTerm } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getCartCount();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    // Special case for /admin - only match exact path, not sub-routes
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    // For all other paths, match exact or sub-paths
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Menu items for regular users
  const regularUserMenuItems = [
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/cart', label: 'Cart', icon: '🛒' },
    { path: '/orders', label: 'My Orders', icon: '📋' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  // Menu items for admin users
  const adminMenuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Manage Products', icon: '📦' },
    { path: '/admin/vendors', label: 'Manage Vendors', icon: '🏪' },
    { path: '/admin/orders', label: 'Manage Orders', icon: '📋' },
    { path: '/admin/users', label: 'Manage Buyers', icon: '👥' },
    { path: '/products', label: 'Browse Products', icon: '🛍️' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  // Select menu items based on user role
  const menuItems = isAdmin() ? adminMenuItems : regularUserMenuItems;

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Left Sidebar */}
      <aside className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-20'
      } flex flex-col fixed h-screen z-40 top-0 left-0 lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        {/* Logo and Toggle */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-primary-900">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center">
              <img
                src="https://images.squarespace-cdn.com/content/v1/5ddff88f3fbbc6593ad61f78/1591895090134-JR31YC50QVJNP9DORBEQ/cureate_white.png?format=1500w"
                alt="Cureate"
                className="h-12 w-auto object-contain"
              />
            </Link>
          ) : (
            <Link to="/" className="flex items-center justify-center w-full">
              <img
                src="https://images.squarespace-cdn.com/content/v1/5ddff88f3fbbc6593ad61f78/1591895090134-JR31YC50QVJNP9DORBEQ/cureate_white.png?format=1500w"
                alt="Cureate"
                className="h-12 w-auto object-contain"
              />
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-primary-800 lg:block hidden text-white"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-100 text-primary-900 border-l-4 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom Section - User Info */}
        <div className="border-t border-gray-200 p-4 mt-auto">
          {user && sidebarOpen && (
            <div className="px-4 py-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{isAdmin() ? '👨‍💼' : '👤'}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">
                  {isAdmin() ? 'Admin' : 'User'}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
            </div>
          )}
          {user && !sidebarOpen && (
            <div className="flex justify-center">
              <span className="text-2xl">{isAdmin() ? '👨‍💼' : '👤'}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4 gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Search Box - Center (hidden on specific pages) */}
              {!location.pathname.match(/^\/(admin\/?$|admin\/orders|settings)/) && (
                <div className="flex-1 max-w-2xl mx-auto">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder={
                        location.pathname === '/admin/vendors' ? 'Search Vendors' :
                        location.pathname === '/admin/users' ? 'Search Buyers' :
                        'Search Products'
                      }
                      value={globalSearchTerm}
                      onChange={(e) => setGlobalSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      id="global-search"
                    />
                  </div>
                </div>
              )}
              {location.pathname.match(/^\/(admin\/?$|admin\/orders|settings)/) && (
                <div className="flex-1"></div>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                {/* Demo User Switcher (only visible when login is disabled) */}
                <DemoUserSwitcher />

                {/* Cart Icon */}
                <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 hidden sm:block" aria-label="Cart">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon */}
                <button className="p-2 rounded-lg hover:bg-gray-100 hidden sm:block" aria-label="Notifications">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {user && (
                    <button
                      onClick={handleLogout}
                      className="hidden sm:block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
