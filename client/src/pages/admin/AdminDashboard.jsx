import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/api/orders/stats'),
        api.get('/api/orders/all', { params: { limit: 5 } })
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
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

      {/* Quick Actions */}
      {isSuperAdmin() && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to="/admin/orders" className="card hover:shadow-lg transition-shadow bg-primary-50 border-2 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-primary-900">Manage Orders</h3>
                <p className="text-primary-700 mt-2">View and update order statuses</p>
              </div>
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </Link>

          <Link to="/admin/products" className="card hover:shadow-lg transition-shadow bg-green-50 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-green-900">Manage Products</h3>
                <p className="text-green-700 mt-2">Add, edit, or remove products</p>
              </div>
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </Link>
        </div>
      )}

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

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title mb-0">Recent Orders</h2>
          <Link to="/admin/orders" className="btn-secondary">
            View All Orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-600 text-center py-8 text-lg">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Batch Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{order.batch_order_number}</td>
                    <td className="py-3 px-4">{order.product_name}</td>
                    <td className="py-3 px-4">{order.user_email}</td>
                    <td className="py-3 px-4 font-semibold">${parseFloat(order.amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${
                        order.status === 'pending' ? 'badge-pending' :
                        order.status === 'completed' ? 'badge-completed' : 'badge-cancelled'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(order.date_submitted).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
