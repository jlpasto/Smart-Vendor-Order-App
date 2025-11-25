import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, updatePricingMode, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity);
    if (qty > 0) {
      updateQuantity(productId, qty);
    }
  };

  const handleRemove = (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(productId);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (window.confirm(`Submit order with ${cart.length} items for $${getCartTotal().toFixed(2)}?`)) {
      setSubmitting(true);
      setError('');

      try {
        const response = await api.post('/api/orders/submit', {
          items: cart
        });

        // Show success message
        alert(`✅ Order submitted successfully!\n\nBatch Number: ${response.data.batchNumber}\n\nYou will receive an email confirmation shortly.`);

        // Clear cart
        clearCart();

        // Navigate to orders page
        navigate('/orders');
      } catch (err) {
        console.error('Order submission error:', err);
        console.error('Error response:', err.response);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to submit order';
        setError(errorMessage);
        alert(`Error submitting order: ${errorMessage}`);
        setSubmitting(false);
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card text-center py-16">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Purchase Order is Empty</h2>
          <p className="text-lg text-gray-600 mb-8">Add some products to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="btn-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Group cart items by vendor
  const groupedByVendor = cart.reduce((groups, item) => {
    const vendorName = item.vendor_name || 'Unknown Vendor';
    if (!groups[vendorName]) {
      groups[vendorName] = [];
    }
    groups[vendorName].push(item);
    return groups;
  }, {});

  // Calculate subtotal for each vendor
  const getVendorSubtotal = (items) => {
    return items.reduce((total, item) => {
      const price = item.pricing_mode === 'unit'
        ? (item.wholesale_unit_price || 0)
        : (item.wholesale_case_price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Purchase Order</h1>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
          <p className="font-semibold text-lg">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items Grouped by Vendor */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedByVendor).map(([vendorName, items]) => {
            const vendorSubtotal = getVendorSubtotal(items);

            return (
              <div key={vendorName} className="space-y-4">
                {/* Vendor Header */}
                <div className="bg-primary-600 text-white px-6 py-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">{vendorName}</h2>
                    <div className="text-right">
                      <p className="text-xs opacity-90">Vendor Subtotal</p>
                      <p className="text-lg font-bold">${vendorSubtotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Items for this vendor */}
                {items.map(item => {
                  const price = item.pricing_mode === 'unit'
                    ? (item.wholesale_unit_price || 0)
                    : (item.wholesale_case_price || 0);
                  const itemTotal = price * item.quantity;

                  return (
                    <div key={item.id} className="card p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Product Image */}
                        <img
                          src={item.product_image || 'https://via.placeholder.com/150'}
                          alt={item.product_name}
                          className="w-full sm:w-24 h-24 object-cover rounded-lg"
                        />

                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900 mb-1">{item.product_name}</h3>

                          {/* Pricing Mode Dropdown */}
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <label htmlFor={`pricing-mode-${item.id}`} className="text-sm text-gray-600">
                              Order by:
                            </label>
                            <select
                              id={`pricing-mode-${item.id}`}
                              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={item.pricing_mode || 'case'}
                              onChange={(e) => updatePricingMode(item.id, e.target.value)}
                            >
                              <option value="case">By Case</option>
                              <option value="unit">By Unit</option>
                            </select>
                            <span className="text-sm font-semibold text-primary-600">
                              ${parseFloat(price).toFixed(2)} per {item.pricing_mode === 'unit' ? 'unit' : 'case'}
                            </span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center">
                              <label htmlFor={`qty-${item.id}`} className="font-semibold text-gray-700 mr-2 text-sm">
                                Qty:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-base"
                                >
                                  −
                                </button>
                                <input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-20 text-center input text-sm py-1"
                                />
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-base"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 text-right">
                              <p className="text-xs text-gray-600">Item Total</p>
                              <p className="text-base font-bold text-gray-900">
                                ${itemTotal.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="self-start p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors sm:ml-auto"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Items:</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Total Units:</span>
                <span className="font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              {/* Vendor Subtotals Breakdown */}
              <div className="border-t-2 border-gray-200 pt-3">
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Subtotals by Vendor:</h3>
                <div className="space-y-1.5">
                  {Object.entries(groupedByVendor).map(([vendorName, items]) => {
                    const vendorSubtotal = getVendorSubtotal(items);
                    return (
                      <div key={vendorName} className="flex justify-between text-sm">
                        <span className="text-gray-700">{vendorName}:</span>
                        <span className="font-semibold text-gray-900">
                          ${vendorSubtotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {user && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Order will be placed as:</p>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="btn-primary w-full mb-4"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>

            <button
              onClick={() => navigate('/products')}
              className="btn-secondary w-full"
            >
              Continue Shopping
            </button>

            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Note:</strong> After submitting, you'll receive an email confirmation with your batch order number.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
