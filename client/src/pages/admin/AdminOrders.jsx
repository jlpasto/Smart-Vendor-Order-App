import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../config/api';
import OrderEditForm from '../../components/OrderEditForm';
import OrderHistoryPanel from '../../components/OrderHistoryPanel';
import AddItemModal from '../../components/AddItemModal';

const AdminOrders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    buyer: '',
    status: '',
    startDate: '',
    endDate: '',
    userEmail: '' // Add userEmail filter
  });
  const [buyers, setBuyers] = useState([]);
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

  // Expandable batches state - track which batches are expanded (default: all expanded)
  const [expandedBatches, setExpandedBatches] = useState(new Set());

  // Apply filters from location state (from Buyer Overview navigation)
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(prevFilters => ({
        ...prevFilters,
        ...location.state.filters
      }));
    }
  }, [location.state]);

  useEffect(() => {
    fetchOrders();
    fetchBuyers();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/api/orders/all', { params });

      // Apply buyer filter on the client side
      let filteredOrders = response.data;
      if (filters.buyer) {
        filteredOrders = filteredOrders.filter(order =>
          order.user_email.toLowerCase() === filters.buyer.toLowerCase()
        );
      }
      // Apply userEmail filter on the client side if provided (from navigation)
      if (filters.userEmail) {
        filteredOrders = filteredOrders.filter(order =>
          order.user_email.toLowerCase() === filters.userEmail.toLowerCase()
        );
      }

      setOrders(filteredOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await api.get('/api/users');
      setBuyers(response.data);
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    setFilters({
      buyer: '',
      status: '',
      startDate: '',
      endDate: '',
      userEmail: ''
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
      // Update all orders in the batch, not just the single item
      await api.patch(`/api/orders/batch/${editingOrder.batch_order_number}/status`, {
        status: newStatus,
        notes: adminNotes
      });

      alert('Batch status updated successfully!');
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
      const response = await api.delete(`/api/orders/${orderId}`);

      if (response.data.success) {
        alert('Item removed successfully!');
        fetchOrders(); // Refresh orders
      } else {
        alert(response.data.message || response.data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to remove item from batch';
      alert(errorMessage);
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

  // Toggle batch expansion
  const toggleBatchExpansion = (batchNumber) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchNumber)) {
        newSet.delete(batchNumber);
      } else {
        newSet.add(batchNumber);
      }
      return newSet;
    });
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

  // Group orders by batch (or by user for ongoing cart items)
  const groupedOrders = orders.reduce((acc, order) => {
    // For ongoing (cart) items without a batch number, group by user email
    const groupKey = order.batch_order_number || `CART-${order.user_email}`;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(order);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">Manage Orders</h1>

      {/* Pre-applied filter notification */}
      {filters.userEmail && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-blue-800 text-xs">
            <strong>📊 Filtered by buyer:</strong> {filters.userName || filters.userEmail.split('@')[0]}
            {filters.startDate && filters.endDate && (
              <span> | <strong>Date range:</strong> {filters.startDate} to {filters.endDate}</span>
            )}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 p-4">
        <h2 className="text-base font-semibold mb-2">Filters</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Buyer</label>
            <select
              value={filters.buyer}
              onChange={(e) => handleFilterChange('buyer', e.target.value)}
              className="select text-sm py-1.5 px-2"
            >
              <option value="">All Buyers</option>
              {buyers.map(buyer => (
                <option key={buyer.id} value={buyer.email}>{buyer.name || buyer.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="select text-sm py-1.5 px-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_cart">In Cart</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input text-sm py-1.5 px-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input text-sm py-1.5 px-2"
            />
          </div>
        </div>

        <button onClick={clearFilters} className="btn-secondary mt-3 px-3 py-1.5 text-sm">
          Clear All Filters
        </button>
      </div>

      {/* Orders Count */}
      <p className="text-sm text-gray-700 mb-4">
        Showing <strong>{orders.length}</strong> orders in <strong>{Object.keys(groupedOrders).length}</strong> batches
      </p>

      {/* Orders List - Grouped by Batch */}
      {Object.keys(groupedOrders).length === 0 ? (
        <div className="card text-center py-8 p-4">
          <p className="text-lg text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedOrders).map(([batchNumber, batchOrders]) => {
            const batchTotal = batchOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
            const batchStatus = batchOrders[0].status;
            const isInCart = batchStatus === 'in_cart';
            const batchDate = isInCart ? batchOrders[0].cart_created_at : batchOrders[0].date_submitted;
            const customerEmail = batchOrders[0].user_email;
            const customerName = batchOrders[0].user_name;
            const batchNotes = batchOrders[0].notes;
            const hasModifications = batchOrders.some(order => order.modified_by_admin);
            const totalModifications = batchOrders.reduce((sum, order) => sum + (order.modification_count || 0), 0);
            const isInEditMode = editModeBatch === batchNumber;
            const isExpanded = expandedBatches.has(batchNumber);

            // Display name for the batch
            const displayBatchName = isInCart
              ? `${customerName || customerEmail.split('@')[0]}'s Cart`
              : batchNumber;

            return (
              <div key={batchNumber} className="card p-4">
                {/* Batch Header */}
                <div className="bg-gray-50 -m-4 p-4 rounded-t-xl mb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => toggleBatchExpansion(batchNumber)}
                          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                          title={isExpanded ? "Collapse batch" : "Expand batch"}
                        >
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <h3 className="text-base font-bold text-gray-900">{displayBatchName}</h3>
                        {isInCart && (
                          <span className="px-1.5 py-0.5 bg-blue-100 border border-blue-400 text-blue-800 text-[10px] font-bold rounded-full">
                            🛒 In Cart
                          </span>
                        )}
                        {hasModifications && !isInCart && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 border border-yellow-400 text-yellow-800 text-[10px] font-bold rounded-full">
                            ✏️ Modified ({totalModifications} {totalModifications === 1 ? 'change' : 'changes'})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span>👤 {customerName || customerEmail.split('@')[0]}</span>
                        <span>📅 {batchDate ? new Date(batchDate).toLocaleDateString() : 'N/A'}</span>
                        <span>📦 {batchOrders.length} items</span>
                        <span className="font-semibold text-primary-600">💰 ${batchTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <span className={`badge ${
                      batchStatus === 'pending' ? 'badge-pending' :
                      batchStatus === 'in_cart' ? 'badge-in-cart' :
                      batchStatus === 'completed' ? 'badge-completed' : 'badge-cancelled'
                    }`}>
                      {batchStatus === 'in_cart' ? 'IN CART' : batchStatus.toUpperCase()}
                    </span>
                  </div>

                  {batchNotes && (
                    <div className="mt-4 bg-white border-l-4 border-amber-500 p-4 rounded">
                      <p className="text-sm font-semibold text-gray-700">Admin Note:</p>
                      <p className="text-gray-800">{batchNotes}</p>
                    </div>
                  )}
                </div>

                {/* Batch Items - Only show when expanded */}
                {isExpanded && (
                  <>
                    <div className="space-y-2 mb-4">
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
                          <div className={`flex justify-between items-center bg-gray-50 p-3 rounded-lg ${
                            order.modified_by_admin ? 'border-2 border-yellow-300' : ''
                          }`}>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-sm text-gray-900">{order.product_name}</p>
                                {order.modified_by_admin && (
                                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded">
                                    Modified
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-xs">
                                {order.vendor_name && `Vendor: ${order.vendor_name} | `}
                                Quantity: {order.quantity} |
                                Mode: {order.pricing_mode === 'unit' ? 'By Unit' : 'By Case'}
                              </p>
                              {order.admin_notes && (
                                <div className="mt-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded text-[10px]">
                                  <span className="font-semibold text-blue-900">Note: </span>
                                  <span className="text-gray-700">{order.admin_notes}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-base font-bold text-primary-600">
                                ${parseFloat(order.amount).toFixed(2)}
                              </p>

                              {isInEditMode && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleEditOrder(order.id)}
                                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    title="Edit item"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleViewOrderHistory(order.id)}
                                    className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    title="View history"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    title="Remove item"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {batchStatus === 'completed' || batchStatus === 'cancelled' ? (
                      <div className={`border rounded-lg p-3 ${
                        batchStatus === 'completed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`text-xs ${
                          batchStatus === 'completed' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          <strong>🔒 {batchStatus === 'completed' ? 'Completed' : 'Cancelled'} Order:</strong> This order has been finalized and cannot be edited.
                          {batchStatus === 'completed' ? ' The order has been successfully processed.' : ' This order was cancelled.'}
                        </p>
                        <button
                          onClick={() => handleViewBatchHistory(batchNumber)}
                          className="btn-secondary mt-2 px-3 py-1.5 text-sm"
                        >
                          📜 View Order History
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleEditMode(batchNumber)}
                          className={`btn-primary px-3 py-1.5 text-sm ${isInEditMode ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
                        >
                          {isInEditMode ? '✓ Exit Edit Mode' : '✏️ Edit Order'}
                        </button>

                        {isInEditMode && (
                          <>
                            <button
                              onClick={() => handleOpenAddItem(batchNumber)}
                              className="btn-primary px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700"
                            >
                              ➕ Add Item
                            </button>
                            <button
                              onClick={() => handleViewBatchHistory(batchNumber)}
                              className="btn-primary px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700"
                            >
                              📜 View Batch History
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => openEditModal(batchOrders[0])}
                          className="btn-secondary px-3 py-1.5 text-sm"
                        >
                          Update Status & Add Note
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Status Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update Order Status</h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">
                  <strong>Batch:</strong> {editingOrder.batch_order_number}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>Customer:</strong> {editingOrder.user_name || editingOrder.user_email?.split('@')[0] || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select"
                >
                  {editingOrder.status === 'in_cart' ? (
                    <option value="pending">Pending</option>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="in_cart">In Cart</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Notes (visible to customer)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows="3"
                  className="input text-sm"
                  placeholder="Add notes for the customer..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="btn-primary flex-1 px-4 py-2 text-sm"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={closeEditModal}
                  disabled={updating}
                  className="btn-secondary flex-1 px-4 py-2 text-sm"
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
