import { useState, useEffect } from 'react';
import api from '../config/api';

const OrderHistoryPanel = ({ orderId, batchNumber, isOpen, onClose }) => {
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('order'); // 'order' or 'batch'

  useEffect(() => {
    if (isOpen) {
      if (orderId) {
        setViewMode('order');
        fetchOrderHistory();
      } else if (batchNumber) {
        setViewMode('batch');
        fetchBatchHistory();
      }
    } else {
      // Reset state when panel closes
      setHistoryData(null);
      setError(null);
    }
  }, [isOpen, orderId, batchNumber]);

  const fetchOrderHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/orders/${orderId}/history`
      );

      if (response.data.success) {
        setHistoryData(response.data);
      } else {
        setError(response.data.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching order history:', err);
      setError(err.response?.data?.message || 'Failed to fetch order history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/orders/batch/${encodeURIComponent(batchNumber)}/history`
      );

      if (response.data.success) {
        setHistoryData(response.data);
      } else {
        setError(response.data.message || 'Failed to fetch batch history');
      }
    } catch (err) {
      console.error('Error fetching batch history:', err);
      setError(err.response?.data?.message || 'Failed to fetch batch history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatChangeType = (changeType) => {
    const types = {
      quantity_changed: 'Quantity Modified',
      price_changed: 'Price Modified',
      pricing_mode_changed: 'Pricing Mode Changed',
      amount_changed: 'Amount Recalculated',
      item_added: 'Item Added',
      item_removed: 'Item Removed',
      status_changed: 'Status Changed',
      note_added: 'Note Added'
    };
    return types[changeType] || changeType;
  };

  const getChangeIcon = (changeType) => {
    const icons = {
      quantity_changed: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      price_changed: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      pricing_mode_changed: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      amount_changed: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      item_added: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      item_removed: (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      status_changed: (
        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      note_added: (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    };
    return icons[changeType] || icons.note_added;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 xl:w-2/5 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">Order History</h2>
            <p className="text-sm text-blue-100 mt-1">
              {viewMode === 'order' ? `Order #${orderId}` : `Batch ${batchNumber}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading history...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {!isLoading && !error && historyData && viewMode === 'order' && (
            <>
              {/* Original Snapshot */}
              {historyData.original_snapshot && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Original Order
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Quantity:</span>
                        <span className="ml-2 text-gray-900">{historyData.original_snapshot.quantity}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Pricing Mode:</span>
                        <span className="ml-2 text-gray-900">{historyData.original_snapshot.pricing_mode}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Unit Price:</span>
                        <span className="ml-2 text-gray-900">${parseFloat(historyData.original_snapshot.unit_price || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Case Price:</span>
                        <span className="ml-2 text-gray-900">${parseFloat(historyData.original_snapshot.case_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-700">Total Amount:</span>
                        <span className="ml-2 text-lg font-bold text-gray-900">${parseFloat(historyData.original_snapshot.amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Order State */}
              {historyData.order && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Current Order State
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Quantity:</span>
                        <span className="ml-2 text-gray-900">{historyData.order.quantity}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Pricing Mode:</span>
                        <span className="ml-2 text-gray-900">{historyData.order.pricing_mode}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Unit Price:</span>
                        <span className="ml-2 text-gray-900">${parseFloat(historyData.order.unit_price || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Case Price:</span>
                        <span className="ml-2 text-gray-900">${parseFloat(historyData.order.case_price || 0).toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold text-gray-700">Total Amount:</span>
                        <span className="ml-2 text-lg font-bold text-green-700">${parseFloat(historyData.order.amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Timeline */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Change History
                  {historyData.history && historyData.history.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                      {historyData.history.length}
                    </span>
                  )}
                </h3>

                {(!historyData.history || historyData.history.length === 0) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No modifications yet</p>
                  </div>
                )}

                {historyData.history && historyData.history.length > 0 && (
                  <div className="space-y-4">
                    {historyData.history.map((change, index) => (
                      <div key={change.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getChangeIcon(change.change_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {formatChangeType(change.change_type)}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(change.change_timestamp)}
                              </span>
                            </div>

                            {change.field_changed && (
                              <div className="text-sm text-gray-700 mb-2">
                                <span className="font-semibold">Field:</span> {change.field_changed}
                              </div>
                            )}

                            {(change.old_value || change.new_value) && (
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">
                                  {change.old_value || 'N/A'}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono">
                                  {change.new_value || 'N/A'}
                                </span>
                              </div>
                            )}

                            {change.admin_notes && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <p className="text-sm text-blue-900">
                                  <span className="font-semibold">Note:</span> {change.admin_notes}
                                </p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                              Changed by: {change.changed_by_admin_email || 'System'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!isLoading && !error && historyData && viewMode === 'batch' && (
            <>
              {/* Batch Summary */}
              {historyData.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Batch Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-700 font-semibold">Total Items</div>
                      <div className="text-2xl font-bold text-blue-900">{historyData.items?.length || 0}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="text-sm text-purple-700 font-semibold">Total Changes</div>
                      <div className="text-2xl font-bold text-purple-900">{historyData.summary.total_modifications || 0}</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-700 font-semibold">Items Added</div>
                      <div className="text-2xl font-bold text-green-900">{historyData.summary.items_added || 0}</div>
                    </div>
                  </div>
                  {historyData.summary.last_modified && (
                    <div className="mt-3 text-sm text-gray-600">
                      Last modified: {formatTimestamp(historyData.summary.last_modified)}
                    </div>
                  )}
                </div>
              )}

              {/* All Changes Timeline */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">All Changes</h3>
                {(!historyData.all_changes || historyData.all_changes.length === 0) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-600">No modifications yet</p>
                  </div>
                )}

                {historyData.all_changes && historyData.all_changes.length > 0 && (
                  <div className="space-y-4">
                    {historyData.all_changes.map((change, index) => (
                      <div key={change.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getChangeIcon(change.change_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {formatChangeType(change.change_type)}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(change.change_timestamp)}
                              </span>
                            </div>

                            <div className="text-sm text-gray-700 mb-1">
                              Order ID: #{change.order_id}
                            </div>

                            {(change.old_value || change.new_value) && (
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono text-xs">
                                  {change.old_value || 'N/A'}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono text-xs">
                                  {change.new_value || 'N/A'}
                                </span>
                              </div>
                            )}

                            {change.admin_notes && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <p className="text-sm text-blue-900">{change.admin_notes}</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                              By: {change.changed_by_admin_email || 'System'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default OrderHistoryPanel;
