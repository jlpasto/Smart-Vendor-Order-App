import { useState, useEffect, useMemo } from 'react';
import api from '../../config/api';
import OrderEditForm from '../../components/OrderEditForm';

const OrderEditPage = ({ batchNumber }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [savedOrderIds, setSavedOrderIds] = useState(new Set());
  const [toasts, setToasts] = useState({}); // { key: { type: 'success'|'error', message } }
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const fetchBatch = async () => {
      try {
        const response = await api.get('/api/orders/batch-by-number', { params: { batchNumber } });
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load order batch');
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchNumber]);

  // Group orders by vendor name
  const vendorGroups = useMemo(() => {
    const groups = {};
    orders.forEach(order => {
      const vendor = order.vendor_name || 'Unknown Vendor';
      if (!groups[vendor]) groups[vendor] = [];
      groups[vendor].push(order);
    });
    return groups;
  }, [orders]);

  const confirmedCount = orders.filter(o => o.confirmation_status === 'confirmed').length;
  const totalCount = orders.length;
  const allConfirmed = totalCount > 0 && confirmedCount === totalCount;
  const progressPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;
  const batchTotal = orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  const showToast = (key, type, message) => {
    setToasts(prev => ({ ...prev, [key]: { type, message } }));
    setTimeout(() => {
      setToasts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 3500);
  };

  const handleSave = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSavedOrderIds(prev => new Set([...prev, updatedOrder.id]));
    setExpandedOrderId(null);
  };

  const handleConfirmItem = async (order) => {
    try {
      const response = await api.patch(`/api/orders/${order.id}/confirm`);
      if (response.data.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? response.data.order : o));
        showToast(`item-${order.id}`, 'success', 'Item confirmed');
      }
    } catch (err) {
      showToast(`item-${order.id}`, 'error', err.response?.data?.error || 'Failed to confirm item');
    }
  };

  const handleUnconfirmItem = async (order) => {
    try {
      const response = await api.patch(`/api/orders/${order.id}/unconfirm`);
      if (response.data.success) {
        setOrders(prev => prev.map(o => o.id === order.id ? response.data.order : o));
        showToast(`item-${order.id}`, 'success', 'Item unconfirmed');
      }
    } catch (err) {
      showToast(`item-${order.id}`, 'error', err.response?.data?.error || 'Failed to unconfirm item');
    }
  };

  const handleVendorConfirm = async (vendorName) => {
    try {
      const response = await api.patch('/api/orders/vendor-confirm', { batchNumber, vendorName });
      if (response.data.success) {
        const updatedOrders = response.data.orders;
        setOrders(prev => prev.map(o => {
          const updated = updatedOrders.find(u => u.id === o.id);
          return updated || o;
        }));
        showToast(`vendor-${vendorName}`, 'success', `All ${response.data.updatedCount} items confirmed`);
      }
    } catch (err) {
      showToast(`vendor-${vendorName}`, 'error', err.response?.data?.error || 'Failed to confirm vendor');
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await api.patch('/api/orders/batch-finalize', { batchNumber });
      setFinalized(true);
      showToast('finalize', 'success', 'Batch finalized successfully!');
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.error === 'Not all items confirmed'
        ? `${errData.confirmed}/${errData.total} items confirmed — confirm all items first`
        : errData?.error || 'Failed to finalize batch';
      showToast('finalize', 'error', msg);
    } finally {
      setFinalizing(false);
    }
  };

  // Derive per-vendor confirmation status
  const getVendorStatus = (items) => {
    const confirmed = items.filter(i => i.confirmation_status === 'confirmed').length;
    if (confirmed === items.length) return 'confirmed';
    if (confirmed > 0) return 'partial';
    return 'awaiting';
  };

  const vendorStatusLabel = {
    confirmed: { label: 'Confirmed', className: 'badge-confirmed-item' },
    partial: { label: 'Partially Confirmed', className: 'badge-partial' },
    awaiting: { label: 'Awaiting', className: 'badge-awaiting' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Edit Order Batch</h1>
            <p className="text-xs text-gray-500">Batch #{batchNumber}</p>
          </div>
        </div>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-semibold">{error}</p>
            <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
              Close Tab
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Batch Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Items</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Batch Total</p>
                    <p className="text-2xl font-bold text-primary-600">${batchTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Confirmed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      <span className={confirmedCount === totalCount && totalCount > 0 ? 'text-green-600' : 'text-gray-900'}>
                        {confirmedCount}
                      </span>
                      <span className="text-gray-400 text-lg">/{totalCount}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFinalize}
                  disabled={!allConfirmed || finalizing || finalized}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    finalized
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : allConfirmed && !finalizing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {finalized ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Finalized
                    </>
                  ) : finalizing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Finalize Order
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Confirmation progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${allConfirmed ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Finalize toast */}
              {toasts['finalize'] && (
                <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  toasts['finalize'].type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {toasts['finalize'].message}
                </div>
              )}
            </div>

            {/* Vendor groups */}
            <div className="space-y-6">
              {Object.entries(vendorGroups).map(([vendorName, items]) => {
                const vendorStatus = getVendorStatus(items);
                const statusInfo = vendorStatusLabel[vendorStatus];
                const allVendorConfirmed = vendorStatus === 'confirmed';

                return (
                  <div key={vendorName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Vendor header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <h2 className="font-bold text-gray-800 text-sm">{vendorName}</h2>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {toasts[`vendor-${vendorName}`] && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            toasts[`vendor-${vendorName}`].type === 'success'
                              ? 'text-green-700 bg-green-50'
                              : 'text-red-700 bg-red-50'
                          }`}>
                            {toasts[`vendor-${vendorName}`].message}
                          </span>
                        )}
                        {!allVendorConfirmed && (
                          <button
                            onClick={() => handleVendorConfirm(vendorName)}
                            className="text-xs font-semibold px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Confirm All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-100">
                      {items.map(order => {
                        const isConfirmed = order.confirmation_status === 'confirmed';
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <div key={order.id} className={`transition-colors ${isConfirmed ? 'bg-green-50/40' : ''}`}>
                            {/* Item row */}
                            <div className="flex items-center justify-between px-5 py-4">
                              {/* Expand chevron + name */}
                              <div
                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              >
                                <svg
                                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900 truncate text-sm">{order.product_name}</p>
                                    {order.modified_by_admin && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded">Modified</span>
                                    )}
                                    {savedOrderIds.has(order.id) && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">Saved</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Qty: {order.quantity} &bull; {order.pricing_mode === 'unit' ? 'By Unit' : 'By Case'} &bull;{' '}
                                    <span className="font-medium text-primary-600">${parseFloat(order.amount || 0).toFixed(2)}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Confirm actions */}
                              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                {toasts[`item-${order.id}`] && (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                    toasts[`item-${order.id}`].type === 'success'
                                      ? 'text-green-700 bg-green-50'
                                      : 'text-red-700 bg-red-50'
                                  }`}>
                                    {toasts[`item-${order.id}`].message}
                                  </span>
                                )}
                                {isConfirmed ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Confirmed
                                    </span>
                                    <button
                                      onClick={() => handleUnconfirmItem(order)}
                                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                      title="Unconfirm"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmItem(order)}
                                    className="text-xs font-semibold px-3 py-1.5 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-primary-400 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Edit form — shown when expanded */}
                            {isExpanded && (
                              <div className="px-5 pb-5 border-t border-gray-100">
                                <div className="pt-4">
                                  <OrderEditForm
                                    order={order}
                                    onSave={handleSave}
                                    onCancel={() => setExpandedOrderId(null)}
                                    adminEmail={localStorage.getItem('userEmail')}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default OrderEditPage;
