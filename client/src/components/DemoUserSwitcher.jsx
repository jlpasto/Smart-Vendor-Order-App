import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DemoUserSwitcher = () => {
  const { user, setDemoUser, loginEnabled } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  // Only show in demo mode (when login is disabled)
  if (loginEnabled !== false) {
    return null;
  }

  const demoUsers = [
    {
      id: 1,
      email: 'admin@demo.com',
      role: 'admin',
      displayName: 'Admin User',
      icon: '👨‍💼',
      description: 'Full access to all features'
    },
    {
      id: 2,
      email: 'user@demo.com',
      role: 'user',
      displayName: 'Regular User',
      icon: '👤',
      description: 'Browse products, place orders'
    }
  ];

  const currentUser = demoUsers.find(u => u.role === user?.role) || demoUsers[0];

  const handleUserSwitch = (demoUser) => {
    setDemoUser(demoUser);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Demo Mode Badge + Switcher Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border-2 border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <span className="text-xs font-bold text-amber-700 uppercase">Demo Mode</span>
        <span className="text-lg">{currentUser.icon}</span>
        <span className="font-semibold text-gray-700">{currentUser.displayName}</span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border-2 border-gray-200 z-20">
            <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <p className="text-sm font-bold text-gray-700">Switch Demo User</p>
              <p className="text-xs text-gray-500 mt-1">
                Login is disabled. Choose a demo user to test features.
              </p>
            </div>

            <div className="p-2">
              {demoUsers.map((demoUser) => (
                <button
                  key={demoUser.id}
                  onClick={() => handleUserSwitch(demoUser)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                    currentUser.role === demoUser.role ? 'bg-primary-50 border-2 border-primary-300' : 'border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{demoUser.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{demoUser.displayName}</span>
                        {currentUser.role === demoUser.role && (
                          <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{demoUser.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{demoUser.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-200 bg-amber-50 rounded-b-xl">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> To enable real authentication, set <code className="bg-amber-100 px-1 rounded">ENABLE_LOGIN=true</code> in your .env file.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoUserSwitcher;
