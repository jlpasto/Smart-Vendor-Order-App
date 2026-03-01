import { useState, useEffect } from 'react';
import api from '../../config/api';
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/api/orders/stats');
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title mb-2">Admin Dashboard</h1>
        <p className="text-xl text-gray-600">Manage your wholesale ordering system</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-white">
            <p className="text-gray-600 text-lg mb-2">Total Orders</p>
            <p className="text-4xl font-bold text-gray-900">{stats.total_orders}</p>
          </div>

          <div className="card bg-yellow-50">
            <p className="text-yellow-800 text-lg mb-2">Pending Orders</p>
            <p className="text-4xl font-bold text-yellow-900">{stats.pending_orders}</p>
          </div>

          <div className="card bg-green-50">
            <p className="text-green-800 text-lg mb-2">Completed Orders</p>
            <p className="text-4xl font-bold text-green-900">{stats.completed_orders}</p>
          </div>

          <div className="card bg-primary-50">
            <p className="text-primary-800 text-lg mb-2">Total Revenue</p>
            <p className="text-4xl font-bold text-primary-900">
              ${parseFloat(stats.total_revenue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
