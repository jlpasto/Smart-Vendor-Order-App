import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const OrdersPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [batchOrders, setBatchOrders] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBatches();
  }, [startDate, endDate]);

  const fetchBatches = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await axios.get('/api/orders/my-batches', { params });
      setBatches(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (batchNumber) => {
    if (batchOrders[batchNumber]) {
      return; // Already loaded
    }

    try {
      const response = await axios.get(`/api/orders/batch/${batchNumber}`);
      setBatchOrders({ ...batchOrders, [batchNumber]: response.data });
    } catch (err) {
      console.error('Error fetching batch details:', err);
    }
  };

  const toggleBatch = async (batchNumber) => {
    if (expandedBatch === batchNumber) {
      setExpandedBatch(null);
    } else {
      setExpandedBatch(batchNumber);
      await fetchBatchDetails(batchNumber);
    }
  };

  const downloadPDF = (batch) => {
    const orders = batchOrders[batch.batch_order_number] || [];

    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Order Receipt', 14, 20);

    // Batch Info
    doc.setFontSize(12);
    doc.text(`Batch Number: ${batch.batch_order_number}`, 14, 35);
    doc.text(`Date: ${new Date(batch.date_submitted).toLocaleDateString()}`, 14, 42);
    doc.text(`Status: ${batch.status.toUpperCase()}`, 14, 49);

    if (batch.notes) {
      doc.setFontSize(10);
      doc.text(`Admin Note: ${batch.notes}`, 14, 56);
    }

    // Orders table
    const tableData = orders.map(order => [
      order.product_name,
      order.quantity.toString(),
      `$${parseFloat(order.amount).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: batch.notes ? 62 : 55,
      head: [['Product', 'Quantity', 'Amount']],
      body: tableData,
      foot: [[
        'Total',
        orders.reduce((sum, o) => sum + o.quantity, 0).toString(),
        `$${parseFloat(batch.total_amount).toFixed(2)}`
      ]],
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Save PDF
    doc.save(`order-${batch.batch_order_number}.pdf`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled'
    };
    return `badge ${badges[status] || 'badge-pending'}`;
  };

  const groupByMonth = (batches) => {
    const grouped = {};
    batches.forEach(batch => {
      const date = new Date(batch.date_submitted);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(batch);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <p className="font-semibold text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const groupedBatches = groupByMonth(batches);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">My Orders</h1>

      {/* Date Range Filter */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter by Date Range</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-lg font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-lg font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="btn-secondary w-full"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="card text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Orders Found</h2>
          <p className="text-xl text-gray-600 mb-8">
            {startDate || endDate
              ? 'No orders found for the selected date range'
              : "You haven't placed any orders yet"}
          </p>
          <button
            onClick={() => window.location.href = '/products'}
            className="btn-primary"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBatches).map(([monthYear, monthBatches]) => (
            <div key={monthYear}>
              <h2 className="section-title">{monthYear}</h2>

              <div className="space-y-4">
                {monthBatches.map(batch => (
                  <div key={batch.batch_order_number} className="card">
                    {/* Batch Header */}
                    <div
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                      onClick={() => toggleBatch(batch.batch_order_number)}
                    >
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {batch.batch_order_number}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-base text-gray-600">
                          <span>
                            📅 {new Date(batch.date_submitted).toLocaleDateString()}
                          </span>
                          <span>
                            📦 {batch.item_count} items
                          </span>
                          <span className="font-semibold text-primary-600">
                            💰 ${parseFloat(batch.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={getStatusBadge(batch.status)}>
                          {batch.status.toUpperCase()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPDF(batch);
                          }}
                          className="btn-secondary"
                        >
                          Download PDF
                        </button>
                        <button className="text-3xl text-gray-500">
                          {expandedBatch === batch.batch_order_number ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {batch.notes && (
                      <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                        <p className="text-sm font-semibold text-amber-900 mb-1">Admin Note:</p>
                        <p className="text-amber-800">{batch.notes}</p>
                      </div>
                    )}

                    {/* Expanded Order Details */}
                    {expandedBatch === batch.batch_order_number && batchOrders[batch.batch_order_number] && (
                      <div className="mt-6 border-t-2 border-gray-200 pt-6">
                        <h4 className="text-lg font-semibold mb-4">Order Items:</h4>
                        <div className="space-y-3">
                          {batchOrders[batch.batch_order_number].map(order => (
                            <div
                              key={order.id}
                              className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{order.product_name}</p>
                                <p className="text-gray-600">Quantity: {order.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary-600">
                                  ${parseFloat(order.amount).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
