import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [batchOrders, setBatchOrders] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reordering, setReordering] = useState(false);
  const [reorderBatch, setReorderBatch] = useState(null);
  const [addingItem, setAddingItem] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, [startDate, endDate]);

  const fetchBatches = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/api/orders/my-batches', { params });
      // Filter out "in_cart" status orders
      const filteredBatches = response.data.filter(batch => batch.status !== 'in_cart');
      setBatches(filteredBatches);
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
      const response = await api.get(`/api/orders/batch/${encodeURIComponent(batchNumber)}`);
      setBatchOrders(prevOrders => ({
        ...prevOrders,
        [batchNumber]: response.data
      }));
    } catch (err) {
      console.error('Error fetching batch details:', err);
      alert('Error loading order details. Please try again.');
    }
  };

  const toggleBatch = async (batchNumber) => {
    if (expandedBatch === batchNumber) {
      setExpandedBatch(null);
    } else {
      setExpandedBatch(batchNumber);
      // Only fetch if we don't have the data yet
      if (!batchOrders[batchNumber]) {
        await fetchBatchDetails(batchNumber);
      }
    }
  };

  // Helper: load image and convert to base64 PNG (needed because jsPDF doesn't support webp)
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const downloadPDF = async (batch) => {
    // Ensure batch details are loaded
    let orders = batchOrders[batch.batch_order_number];

    if (!orders) {
      try {
        const response = await api.get(`/api/orders/batch/${encodeURIComponent(batch.batch_order_number)}`);
        orders = response.data;
        setBatchOrders(prevOrders => ({
          ...prevOrders,
          [batch.batch_order_number]: orders
        }));
      } catch (err) {
        console.error('Error fetching batch details for PDF:', err);
        alert('Error loading order details. Please try again.');
        return;
      }
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const brandGreen = [3, 82, 87];

    // --- HEADER BAR ---
    const headerHeight = 44;
    doc.setFillColor(...brandGreen);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Load and place logo
    try {
      const logo = await loadImageAsBase64('/images/logo.webp');
      // Scale logo to fit nicely in the header (max height ~30px in PDF units)
      const logoMaxH = 30;
      const aspect = logo.width / logo.height;
      const logoH = logoMaxH;
      const logoW = logoH * aspect;
      const logoX = 14;
      const logoY = (headerHeight - logoH) / 2;
      doc.addImage(logo.dataUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      // Fallback: text branding if logo fails to load
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Cureate', 14, 28);
    }

    // "Order Receipt" title on the right side of header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Receipt', pageWidth - 14, 20, { align: 'right' });

    // Batch number subtitle in header
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${batch.batch_order_number}`, pageWidth - 14, 30, { align: 'right' });

    // --- Thin accent line under header ---
    doc.setDrawColor(...brandGreen);
    doc.setLineWidth(0.5);
    doc.line(0, headerHeight + 1, pageWidth, headerHeight + 1);

    // --- ORDER INFO SECTION ---
    let yPos = headerHeight + 12;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Two-column order info
    const leftX = 14;
    const rightX = pageWidth / 2 + 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Order Number:', leftX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(batch.batch_order_number, leftX + 32, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(batch.date_submitted).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    }), rightX + 14, yPos);

    yPos += 7;

    if (batch.status === 'completed') {
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', leftX, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...brandGreen);
      doc.text(batch.status.toUpperCase(), leftX + 16, yPos);
      doc.setTextColor(60, 60, 60);
      yPos += 7;
    }

    if (batch.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Note:', leftX, yPos);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(batch.notes, pageWidth - 44);
      doc.text(noteLines, leftX + 14, yPos);
      yPos += noteLines.length * 5 + 4;
    }

    // --- Divider before table ---
    yPos += 2;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 6;

    // --- ITEMS TABLE ---
    const tableData = orders.map(order => [
      order.product_name,
      order.vendor_name || 'N/A',
      order.quantity.toString(),
      `$${parseFloat(order.amount).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Product', 'Vendor', 'Qty', 'Amount']],
      body: tableData,
      foot: [[
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        '',
        { content: orders.reduce((sum, o) => sum + o.quantity, 0).toString(), styles: { fontStyle: 'bold' } },
        { content: `$${parseFloat(batch.total_amount).toFixed(2)}`, styles: { fontStyle: 'bold' } }
      ]],
      theme: 'striped',
      headStyles: {
        fillColor: brandGreen,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50]
      },
      footStyles: {
        fillColor: [235, 245, 245],
        textColor: brandGreen,
        fontStyle: 'bold',
        fontSize: 10
      },
      alternateRowStyles: {
        fillColor: [248, 250, 250]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 28 }
      },
      margin: { left: 14, right: 14 },
      styles: {
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      }
    });

    // --- FOOTER ---
    const finalY = doc.lastAutoTable.finalY + 16;
    doc.setDrawColor(...brandGreen);
    doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your order!', pageWidth / 2, finalY + 8, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Cureate — Curated products for your business', pageWidth / 2, finalY + 14, { align: 'center' });

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

  // Handle "Buy Again" - add entire batch to cart
  const handleBuyAgain = async (batchNumber) => {
    setReordering(true);
    setReorderBatch(batchNumber);

    try {
      // Fetch current product details for the batch
      console.log('Fetching products for batch:', batchNumber);
      const response = await api.get(`/api/orders/batch/${encodeURIComponent(batchNumber)}/products`);
      console.log('Buy Again API response:', response.data);
      console.log('Unavailable items:', response.data.unavailable);

      const { products, unavailable } = response.data;

      if (products.length === 0) {
        alert('❌ None of the items from this order are currently available.');
        return;
      }

      // Add each available product to cart
      products.forEach(product => {
        addToCart(product, product.quantity_ordered);
      });

      // Show success/warning message
      if (unavailable.length > 0) {
        const unavailableList = unavailable.map(p => `  • ${p.product_name}`).join('\n');
        alert(
          `✅ Added ${products.length} item(s) to cart!\n\n` +
          `⚠️  ${unavailable.length} item(s) are no longer available:\n${unavailableList}`
        );
      } else {
        alert(`✅ All ${products.length} item(s) added to cart!`);
      }

      // Navigate to cart
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering batch:', error);
      console.error('Error details:', error.response?.data);
      alert('Error adding items to cart. Please try again.');
    } finally {
      setReordering(false);
      setReorderBatch(null);
    }
  };

  // Handle "Add to Cart" for individual item
  const handleAddItemToCart = async (order) => {
    setAddingItem(order.id);

    try {
      // Check for product_id - it should be in the order object from the batch details
      const productId = order.product_id;

      console.log('Adding item to cart:', {
        orderId: order.id,
        productId: productId,
        productName: order.product_name
      });

      if (!productId) {
        console.error('Missing product_id in order:', order);
        alert(`❌ Product ID is missing for "${order.product_name}". This item cannot be added to cart. Please contact support.`);
        setAddingItem(null);
        return;
      }

      // Fetch current product details using product_id
      const response = await api.get(`/api/products/${productId}`);
      const product = response.data;

      // Add to cart with original quantity
      addToCart(product, order.quantity);

      // Show confirmation
      alert(`✅ ${product.product_name} (qty: ${order.quantity}) added to cart!`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        order: order
      });

      if (error.response?.status === 404) {
        alert(`❌ "${order.product_name}" is no longer available in our catalog.`);
      } else {
        alert('Error adding item to cart. Please try again.');
      }
    } finally {
      setAddingItem(null);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">My Orders</h1>

      {/* Date Range Filter */}
      <div className="card mb-6 p-4">
        <h2 className="text-base font-semibold mb-2">Filter by Date Range</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="startDate" className="block text-xs font-semibold text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input text-sm py-1.5 px-2"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-xs font-semibold text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input text-sm py-1.5 px-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="btn-secondary w-full px-3 py-1.5 text-sm"
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {batches.length === 0 ? (
        <div className="card text-center py-12 p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">No Orders Found</h2>
          <p className="text-base text-gray-600 mb-6">
            {startDate || endDate
              ? 'No orders found for the selected date range'
              : "You haven't placed any orders yet"}
          </p>
          <button
            onClick={() => window.location.href = '/products'}
            className="btn-primary px-4 py-2 text-sm"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBatches).map(([monthYear, monthBatches]) => (
            <div key={monthYear}>
              <h2 className="text-lg font-display font-semibold text-gray-800 mb-3">{monthYear}</h2>

              <div className="space-y-3">
                {monthBatches.map(batch => (
                  <div key={batch.batch_order_number} className="card p-4">
                    {/* Batch Header */}
                    <div
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer"
                      onClick={() => toggleBatch(batch.batch_order_number)}
                    >
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {batch.batch_order_number}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
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

                      <div className="flex items-center gap-2 flex-wrap">
                        {batch.status === 'completed' && (
                          <span className={getStatusBadge(batch.status)}>
                            {batch.status.toUpperCase()}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyAgain(batch.batch_order_number);
                          }}
                          disabled={reordering && reorderBatch === batch.batch_order_number}
                          className="btn-primary text-sm px-3 py-1.5"
                        >
                          {reordering && reorderBatch === batch.batch_order_number
                            ? 'Adding...'
                            : '🛒 Buy Again'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPDF(batch);
                          }}
                          className="btn-secondary text-sm px-3 py-1.5"
                        >
                          Download PDF
                        </button>
                        <button className="text-2xl text-gray-500">
                          {expandedBatch === batch.batch_order_number ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {batch.notes && (
                      <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Admin Note:</p>
                        <p className="text-xs text-amber-800">{batch.notes}</p>
                      </div>
                    )}

                    {/* Expanded Order Details */}
                    {expandedBatch === batch.batch_order_number && (
                      <div className="mt-4 border-t-2 border-gray-200 pt-4">
                        {!batchOrders[batch.batch_order_number] ? (
                          <div className="flex justify-center items-center py-6">
                            <div className="spinner w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading order details...</span>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm font-semibold mb-3">Order Items:</h4>
                            <div className="space-y-2">
                              {batchOrders[batch.batch_order_number].map(order => (
                            <div
                              key={order.id}
                              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{order.product_name}</p>
                                <p className="text-xs text-gray-600">Quantity: {order.quantity}</p>
                                {order.vendor_name && (
                                  <p className="text-xs text-gray-500">Vendor: {order.vendor_name}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-sm font-bold text-primary-600">
                                    ${parseFloat(order.amount).toFixed(2)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddItemToCart(order)}
                                  disabled={addingItem === order.id}
                                  className="btn-secondary text-xs px-2 py-1.5 whitespace-nowrap"
                                >
                                  {addingItem === order.id ? 'Adding...' : 'Add to Cart'}
                                </button>
                              </div>
                            </div>
                          ))}
                            </div>
                          </>
                        )}
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
