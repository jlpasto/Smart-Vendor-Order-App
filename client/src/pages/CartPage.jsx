import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
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
        const response = await axios.post('/api/orders/submit', {
          items: cart
        });

        // Show success message
        alert(`✅ Order submitted successfully!\n\nBatch Number: ${response.data.batchNumber}\n\nYou will receive an email confirmation shortly.`);

        // Clear cart
        clearCart();

        // Navigate to orders page
        navigate('/orders');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to submit order');
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-xl text-gray-600 mb-8">Add some products to get started!</p>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Shopping Cart</h1>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
          <p className="font-semibold text-lg">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => {
            const price = item.wholesale_case_price || item.wholesale_unit_price || 0;
            const itemTotal = price * item.quantity;

            return (
              <div key={item.id} className="card">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Product Image */}
                  <img
                    src={item.product_image || 'https://via.placeholder.com/150'}
                    alt={item.product_name}
                    className="w-full sm:w-32 h-32 object-cover rounded-lg"
                  />

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.product_name}</h3>
                    <p className="text-gray-600 mb-2">{item.vendor_name}</p>
                    <p className="text-lg font-semibold text-primary-600 mb-3">
                      ${parseFloat(price).toFixed(2)} per case
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center">
                        <label htmlFor={`qty-${item.id}`} className="font-semibold text-gray-700 mr-3 text-lg">
                          Quantity:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                          >
                            −
                          </button>
                          <input
                            id={`qty-${item.id}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-20 text-center input"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 text-right">
                        <p className="text-sm text-gray-600">Item Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="self-start btn-danger sm:ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Items:</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-700">Total Units:</span>
                <span className="font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">Total:</span>
                  <span className="text-3xl font-bold text-primary-600">
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
