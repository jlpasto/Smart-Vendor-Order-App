import { useState, useEffect } from 'react';
import api from '../../config/api';
import OrderEditForm from '../../components/OrderEditForm';
import OrderHistoryPanel from '../../components/OrderHistoryPanel';
import AddItemModal from '../../components/AddItemModal';

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

  // New states for edit mode
  const [editModeBatch, setEditModeBatch] = useState(null); // Which batch is in edit mode
  const [editingOrderId, setEditingOrderId] = useState(null); // Which order item is being edited

  // History panel state
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [historyOrderId, setHistoryOrderId] = useState(null);
  const [historyBatchNumber, setHistoryBatchNumber] = useState(null);

  // Add item modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemBatchNumber, setAddItemBatchNumber] = useState(null);

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

  // Edit mode handlers
  const toggleEditMode = (batchNumber) => {
    if (editModeBatch === batchNumber) {
      // Exit edit mode
      setEditModeBatch(null);
      setEditingOrderId(null);
    } else {
      // Enter edit mode
      setEditModeBatch(batchNumber);
      setEditingOrderId(null);
    }
  };

  const handleEditOrder = (orderId) => {
    setEditingOrderId(orderId);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
  };

  const handleSaveOrder = (updatedOrder) => {
    // Update the order in the state
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    setEditingOrderId(null);
    alert('Order updated successfully!');
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to remove this item from the batch?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Item removed successfully!');
        fetchOrders(); // Refresh orders
      } else {
        alert(data.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to remove item from batch');
    }
  };

  // History panel handlers
  const handleViewOrderHistory = (orderId) => {
    setHistoryOrderId(orderId);
    setHistoryBatchNumber(null);
    setShowHistoryPanel(true);
  };

  const handleViewBatchHistory = (batchNumber) => {
    setHistoryOrderId(null);
    setHistoryBatchNumber(batchNumber);
    setShowHistoryPanel(true);
  };

  const handleCloseHistory = () => {
    setShowHistoryPanel(false);
    setHistoryOrderId(null);
    setHistoryBatchNumber(null);
  };

  // Add item handlers
  const handleOpenAddItem = (batchNumber) => {
    setAddItemBatchNumber(batchNumber);
    setShowAddItemModal(true);
  };

  const handleCloseAddItem = () => {
    setShowAddItemModal(false);
    setAddItemBatchNumber(null);
  };

  const handleItemAdded = (newOrder) => {
    alert('Item added successfully!');
    fetchOrders(); // Refresh orders
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
            const hasModifications = batchOrders.some(order => order.modified_by_admin);
            const totalModifications = batchOrders.reduce((sum, order) => sum + (order.modification_count || 0), 0);
            const isInEditMode = editModeBatch === batchNumber;

            return (
              <div key={batchNumber} className="card">
                {/* Batch Header */}
                <div className="bg-gray-50 -m-6 p-6 rounded-t-xl mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{batchNumber}</h3>
                        {hasModifications && (
                          <span className="px-3 py-1 bg-yellow-100 border border-yellow-400 text-yellow-800 text-xs font-bold rounded-full">
                            ✏️ Modified ({totalModifications} {totalModifications === 1 ? 'change' : 'changes'})
                          </span>
                        )}
                      </div>
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
                  {batchOrders.map(order => {
                    const isEditing = isInEditMode && editingOrderId === order.id;

                    return (
                      <div key={order.id}>
                        {isEditing ? (
                          <OrderEditForm
                            order={order}
                            onSave={handleSaveOrder}
                            onCancel={handleCancelEdit}
                            adminEmail={localStorage.getItem('userEmail')}
                          />
                        ) : (
                          <div className={`flex justify-between items-center bg-gray-50 p-4 rounded-lg ${
                            order.modified_by_admin ? 'border-2 border-yellow-300' : ''
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{order.product_name}</p>
                                {order.modified_by_admin && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                                    Modified
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm">
                                {order.vendor_name && `Vendor: ${order.vendor_name} | `}
                                Quantity: {order.quantity} |
                                Mode: {order.pricing_mode === 'unit' ? 'By Unit' : 'By Case'}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-xl font-bold text-primary-600">
                                ${parseFloat(order.amount).toFixed(2)}
                              </p>

                              {isInEditMode && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditOrder(order.id)}
                                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    title="Edit item"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleViewOrderHistory(order.id)}
                                    className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                    title="View history"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    title="Remove item"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => toggleEditMode(batchNumber)}
                    className={`btn-primary ${isInEditMode ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
                  >
                    {isInEditMode ? '✓ Exit Edit Mode' : '✏️ Edit Order'}
                  </button>

                  {isInEditMode && (
                    <>
                      <button
                        onClick={() => handleOpenAddItem(batchNumber)}
                        className="btn-primary bg-green-600 hover:bg-green-700"
                      >
                        ➕ Add Item
                      </button>
                      <button
                        onClick={() => handleViewBatchHistory(batchNumber)}
                        className="btn-primary bg-purple-600 hover:bg-purple-700"
                      >
                        📜 View Batch History
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => openEditModal(batchOrders[0])}
                    className="btn-secondary"
                  >
                    Update Status & Add Note
                  </button>
                </div>
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

      {/* Order History Panel */}
      <OrderHistoryPanel
        orderId={historyOrderId}
        batchNumber={historyBatchNumber}
        isOpen={showHistoryPanel}
        onClose={handleCloseHistory}
      />

      {/* Add Item Modal */}
      <AddItemModal
        batchNumber={addItemBatchNumber}
        isOpen={showAddItemModal}
        onClose={handleCloseAddItem}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default AdminOrders;
