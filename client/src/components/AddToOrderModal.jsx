import { useState, useEffect } from 'react';
import api from '../config/api';

const AddToOrderModal = ({ product, isOpen, onClose, onAddToOrder }) => {
  const [quantity, setQuantity] = useState(1);
  const [pricingMode, setPricingMode] = useState('case');
  const [unavailableAction, setUnavailableAction] = useState('remove');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  // Reset state when modal opens with new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setPricingMode('case');
      setUnavailableAction('remove');
      setSimilarProducts([]);
      setSelectedReplacement(null);
    }
  }, [isOpen, product]);

  // Fetch similar products when "replace" is selected
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (unavailableAction === 'replace' && product && isOpen) {
        setLoadingSimilar(true);
        try {
          const response = await api.get(`/api/products/${product.id}/similar?limit=10`);
          setSimilarProducts(response.data.similarProducts || []);
        } catch (error) {
          console.error('Error fetching similar products:', error);
          setSimilarProducts([]);
        } finally {
          setLoadingSimilar(false);
        }
      }
    };

    fetchSimilarProducts();
  }, [unavailableAction, product, isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!product) return null;

  // Calculate price based on pricing mode
  const price = pricingMode === 'unit'
    ? parseFloat(product.wholesale_unit_price || 0)
    : parseFloat(product.wholesale_case_price || 0);

  const totalPrice = price * quantity;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  const handleAddToOrder = () => {
    // Pass replacement product ID if "replace" is selected and a replacement is chosen
    const replacementProductId = unavailableAction === 'replace' && selectedReplacement
      ? selectedReplacement.id
      : null;

    onAddToOrder(product, quantity, pricingMode, unavailableAction, replacementProductId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col w-full md:w-96 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Add to Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Product Info */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <img
                src={product.product_image || 'https://via.placeholder.com/200'}
                alt={product.product_name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{product.product_name}</h3>
                <p className="text-sm text-gray-600">ID: #{product.id}</p>
                <p className="text-sm text-gray-600">{product.vendor_name}</p>
              </div>
            </div>
          </div>

          {/* Order by Dropdown */}
          <div className="mb-6">
            <label htmlFor="pricing-mode" className="block text-sm font-medium text-gray-700 mb-2">
              Order by:
            </label>
            <select
              id="pricing-mode"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value)}
            >
              <option value="case">Case - ${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</option>
              <option value="unit">Unit - ${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</option>
            </select>
          </div>

          {/* If Unavailable Dropdown */}
          <div className="mb-6">
            <label htmlFor="unavailable-action" className="block text-sm font-medium text-gray-700 mb-2">
              If unavailable:
            </label>
            <select
              id="unavailable-action"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={unavailableAction}
              onChange={(e) => {
                setUnavailableAction(e.target.value);
                setSelectedReplacement(null);
              }}
            >
              <option value="remove">Remove it from my order</option>
              <option value="replace">Replace with similar item</option>
              <option value="curate">Cureate to replace if sold out</option>
            </select>
          </div>

          {/* Similar Products Selection */}
          {unavailableAction === 'replace' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose replacement product:
              </label>

              {loadingSimilar && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              )}

              {!loadingSimilar && similarProducts.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  No similar products found in the same category.
                </div>
              )}

              {!loadingSimilar && similarProducts.length > 0 && (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {similarProducts.map((similarProduct) => (
                    <div
                      key={similarProduct.id}
                      onClick={() => setSelectedReplacement(similarProduct)}
                      className={`flex gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        selectedReplacement?.id === similarProduct.id ? 'bg-primary-50 border-primary-200' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {selectedReplacement?.id === similarProduct.id && (
                          <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <img
                        src={similarProduct.product_image || 'https://via.placeholder.com/60'}
                        alt={similarProduct.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {similarProduct.product_name}
                        </h4>
                        <p className="text-xs text-gray-600">{similarProduct.vendor_name}</p>
                        <div className="mt-1 flex gap-3 text-xs">
                          <span className="text-gray-700">
                            Case: <span className="font-semibold">${parseFloat(similarProduct.wholesale_case_price || 0).toFixed(2)}</span>
                          </span>
                          <span className="text-gray-700">
                            Unit: <span className="font-semibold">${parseFloat(similarProduct.wholesale_unit_price || 0).toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order quantity:
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <button
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Increase quantity"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Price per {pricingMode}:</span>
              <span className="font-semibold text-gray-900">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Quantity:</span>
              <span className="font-semibold text-gray-900">{quantity}</span>
            </div>
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-primary-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Add to Order Button */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white">
          <button
            onClick={handleAddToOrder}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Order
          </button>
        </div>
      </div>
    </>
  );
};

export default AddToOrderModal;
