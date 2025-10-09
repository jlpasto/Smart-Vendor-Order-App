import { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    vendor: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [vendors, setVendors] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filters.vendor) params.vendor = filters.vendor;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/api/orders/all', { params });
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/products/filters/vendors');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    setFilters({
      vendor: '',
      status: '',
      startDate: '',
      endDate: ''
    });
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setNewStatus(order.status);
    setAdminNotes(order.notes || '');
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setNewStatus('');
    setAdminNotes('');
  };

  const handleUpdateStatus = async () => {
    if (!editingOrder) return;

    setUpdating(true);
    try {
      await api.patch(`/api/orders/${editingOrder.id}/status`, {
        status: newStatus,
        notes: adminNotes
      });

      alert('Order status updated successfully! Email notification sent to customer.');
      closeEditModal();
      fetchOrders();
    } catch (error) {
      alert('Error updating order: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  // Group orders by batch
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.batch_order_number]) {
      acc[order.batch_order_number] = [];
    }
    acc[order.batch_order_number].push(order);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Manage Orders</h1>

      {/* Filters */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">Vendor</label>
            <select
              value={filters.vendor}
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              className="select"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input"
            />
          </div>
        </div>

        <button onClick={clearFilters} className="btn-secondary mt-4">
          Clear All Filters
        </button>
      </div>

      {/* Orders Count */}
      <p className="text-xl text-gray-700 mb-6">
        Showing <strong>{orders.length}</strong> orders in <strong>{Object.keys(groupedOrders).length}</strong> batches
      </p>

      {/* Orders List - Grouped by Batch */}
      {Object.keys(groupedOrders).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-2xl text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedOrders).map(([batchNumber, batchOrders]) => {
            const batchTotal = batchOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
            const batchStatus = batchOrders[0].status;
            const batchDate = batchOrders[0].date_submitted;
            const customerEmail = batchOrders[0].user_email;
            const batchNotes = batchOrders[0].notes;

            return (
              <div key={batchNumber} className="card">
                {/* Batch Header */}
                <div className="bg-gray-50 -m-6 p-6 rounded-t-xl mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{batchNumber}</h3>
                      <div className="flex flex-wrap gap-3 text-base text-gray-600">
                        <span>👤 {customerEmail}</span>
                        <span>📅 {new Date(batchDate).toLocaleDateString()}</span>
                        <span>📦 {batchOrders.length} items</span>
                        <span className="font-semibold text-primary-600">💰 ${batchTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className={`badge ${
                      batchStatus === 'pending' ? 'badge-pending' :
                      batchStatus === 'completed' ? 'badge-completed' : 'badge-cancelled'
                    }`}>
                      {batchStatus.toUpperCase()}
                    </span>
                  </div>

                  {batchNotes && (
                    <div className="mt-4 bg-white border-l-4 border-amber-500 p-4 rounded">
                      <p className="text-sm font-semibold text-gray-700">Admin Note:</p>
                      <p className="text-gray-800">{batchNotes}</p>
                    </div>
                  )}
                </div>

                {/* Batch Items */}
                <div className="space-y-3 mb-6">
                  {batchOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{order.product_name}</p>
                        <p className="text-gray-600 text-sm">
                          {order.vendor_name && `Vendor: ${order.vendor_name} | `}
                          Quantity: {order.quantity}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary-600">
                        ${parseFloat(order.amount).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <button
                  onClick={() => openEditModal(batchOrders[0])}
                  className="btn-primary"
                >
                  Update Status & Add Note
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Status Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Update Order Status</h2>

            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-2">
                  <strong>Batch:</strong> {editingOrder.batch_order_number}
                </p>
                <p className="text-gray-600">
                  <strong>Customer:</strong> {editingOrder.user_email}
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Admin Notes (visible to customer)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="4"
                  className="input"
                  placeholder="Add notes for the customer..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? 'Updating...' : 'Update & Send Email'}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={updating}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
