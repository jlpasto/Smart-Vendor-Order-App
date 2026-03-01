import { useState, useEffect } from 'react';
import api from '../../config/api';
import OrderEditForm from '../../components/OrderEditForm';

const OrderEditPage = ({ batchNumber }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [savedOrderIds, setSavedOrderIds] = useState(new Set());

  useEffect(() => {
    // Manually set auth header from localStorage so this page works
    // without relying on the AuthContext (which initializes asynchronously)
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

  const handleSave = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setSavedOrderIds(prev => new Set([...prev, updatedOrder.id]));
    setExpandedOrderId(null);
  };

  const handleCancel = () => {
    setExpandedOrderId(null);
  };

  const batchTotal = orders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Minimal header — no sidebar */}
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
            {/* Batch summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Items in batch</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Batch Total</p>
                <p className="text-2xl font-bold text-primary-600">${batchTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Order items */}
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className={`bg-white rounded-xl border-2 overflow-hidden transition-colors ${
                  savedOrderIds.has(order.id) ? 'border-green-300' : 'border-gray-200'
                }`}>
                  {/* Item row */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{order.product_name}</p>
                        {order.modified_by_admin && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded">Modified</span>
                        )}
                        {savedOrderIds.has(order.id) && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded">Saved</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.vendor_name} &bull; Qty: {order.quantity} &bull; {order.pricing_mode === 'unit' ? 'By Unit' : 'By Case'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <p className="font-bold text-primary-600">${parseFloat(order.amount || 0).toFixed(2)}</p>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Edit form — shown when expanded */}
                  {expandedOrderId === order.id && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="pt-4">
                        <OrderEditForm
                          order={order}
                          onSave={handleSave}
                          onCancel={handleCancel}
                          adminEmail={localStorage.getItem('userEmail')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default OrderEditPage;
