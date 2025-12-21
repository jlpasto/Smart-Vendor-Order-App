import { useState, useEffect } from 'react';
import api from '../config/api';

const AddToOrderModal = ({ product, isOpen, onClose, onAddToOrder }) => {
  const [quantity, setQuantity] = useState(1);
  const [pricingMode, setPricingMode] = useState('case');
  const [unavailableAction, setUnavailableAction] = useState('curate');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  // Reset state when modal opens with new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setPricingMode('case');
      setUnavailableAction('curate');
      setSimilarProducts([]);
      setSelectedReplacement(null);
    }
  }, [isOpen, product]);

  // Update quantity when pricing mode changes
  useEffect(() => {
    if (pricingMode === 'unit') {
      // If minimum_units is set, use it
      if (product?.minimum_units && product.minimum_units > 0) {
        setQuantity(product.minimum_units);
      }
      // If minimum_units is empty but case_pack exists, use case_pack as minimum
      else if ((!product?.minimum_units || product.minimum_units === 0) &&
               product?.case_pack && product.case_pack > 0) {
        setQuantity(product.case_pack);
      } else {
        setQuantity(1);
      }
    } else if (pricingMode === 'case' && product?.case_minimum && product.case_minimum > 0) {
      setQuantity(product.case_minimum);
    } else {
      setQuantity(1);
    }
  }, [pricingMode, product]);

  // Fetch similar products when "replace" is selected
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if ((unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && product && isOpen) {
        setLoadingSimilar(true);
        try {
          const sameVendorOnly = unavailableAction === 'replace_same_vendor';
          const response = await api.get(`/api/products/${product.id}/similar`, {
            params: {
              limit: 10,
              sameVendorOnly
            }
          });
          setSimilarProducts(response.data.similarProducts || []);
        } catch (error) {
          console.error('Error fetching similar products:', error);
          setSimilarProducts([]);
        } finally {
          setLoadingSimilar(false);
        }
      } else {
        setSimilarProducts([]);
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

  // Helper function to check case minimum warning
  const shouldShowCaseMinimumWarning = () => {
    return (
      pricingMode === 'case' &&
      product.case_minimum != null &&
      product.case_minimum > 0 &&
      quantity < product.case_minimum
    );
  };

  // Helper function to check minimum units warning
  const shouldShowMinimumUnitsWarning = () => {
    if (pricingMode !== 'unit') return false;

    // Check if split case is enabled
    const isSplitCase = product.is_split_case === true ||
                       product.is_split_case === 1 ||
                       product.is_split_case === 'Yes' ||
                       product.is_split_case === 'yes';

    // For split case products, check if quantity is valid split case amount
    if (isSplitCase && product.case_pack != null && product.case_pack > 0) {
      const fullCase = product.case_pack;
      const halfCase = Math.floor(product.case_pack / 2);

      // Valid quantities are: halfCase, fullCase, or multiples of halfCase
      // Check if quantity is NOT a valid split case amount
      return quantity !== halfCase && quantity !== fullCase && quantity % halfCase !== 0;
    }

    // For non-split case products, use minimum_units or case_pack
    // If minimum_units is set, use it
    if (product.minimum_units != null && product.minimum_units > 0) {
      return quantity < product.minimum_units;
    }

    // If minimum_units is empty but case_pack exists, use case_pack as minimum
    if ((!product.minimum_units || product.minimum_units === 0) &&
        product.case_pack != null &&
        product.case_pack > 0) {
      return quantity < product.case_pack;
    }

    return false;
  };

  // Calculate price based on pricing mode
  const price = pricingMode === 'unit'
    ? parseFloat(product.wholesale_unit_price || 0)
    : parseFloat(product.wholesale_case_price || 0);

  const totalPrice = price * quantity;

  // Helper function to check minimum cost warning
  const shouldShowMinimumCostWarning = () => {
    return (
      product.minimum_cost != null &&
      product.minimum_cost > 0 &&
      totalPrice < product.minimum_cost
    );
  };

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
    // Pass replacement product ID and name if any "replace" option is selected and a replacement is chosen
    const replacementProductId = (unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && selectedReplacement
      ? selectedReplacement.id
      : null;

    const replacementProductName = (unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && selectedReplacement
      ? selectedReplacement.product_name
      : null;

    onAddToOrder(product, quantity, pricingMode, unavailableAction, replacementProductId, replacementProductName);
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

            {/* Show case minimum info below dropdown if available and case mode is selected */}
            {pricingMode === 'case' && product.case_minimum && product.case_minimum > 0 && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                <span className="font-semibold">Case Minimum:</span> {product.case_minimum} case{product.case_minimum > 1 ? 's' : ''}
              </div>
            )}

            {/* Show minimum units info below dropdown if available and unit mode is selected */}
            {pricingMode === 'unit' && (() => {
              // Show minimum_units if set, otherwise show case_pack as minimum
              if (product.minimum_units && product.minimum_units > 0) {
                return (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="font-semibold">Minimum Units:</span> {product.minimum_units} unit{product.minimum_units > 1 ? 's' : ''}
                  </div>
                );
              } else if (product.case_pack && product.case_pack > 0) {
                return (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <span className="font-semibold">Minimum Units (Case Pack):</span> {product.case_pack} unit{product.case_pack > 1 ? 's' : ''}
                  </div>
                );
              }
              return null;
            })()}
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
              <option value="curate">Cureate to replace if sold out</option>
              <option value="replace_same_vendor">Replace with similar item under same vendor</option>
              <option value="replace_other_vendors">Replace with similar item across other vendors</option>
              <option value="remove">Remove it from my order</option>
            </select>
          </div>

          {/* Similar Products Selection */}
          {(unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && (
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
                  {unavailableAction === 'replace_same_vendor'
                    ? 'No similar products found under the same vendor in the same category.'
                    : 'No similar products found from other vendors in the same category.'}
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

          {/* Case Minimum Warning */}
          {shouldShowCaseMinimumWarning() && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  Case Minimum Not Met
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This product requires a minimum of <strong>{product.case_minimum}</strong> case{product.case_minimum > 1 ? 's' : ''} per order.
                </p>
              </div>
            </div>
          )}

          {/* Minimum Units Warning */}
          {shouldShowMinimumUnitsWarning() && (() => {
            // Check if split case is enabled
            const isSplitCase = product.is_split_case === true ||
                               product.is_split_case === 1 ||
                               product.is_split_case === 'Yes' ||
                               product.is_split_case === 'yes';

            // For split case products
            if (isSplitCase && product.case_pack != null && product.case_pack > 0) {
              const fullCase = product.case_pack;
              const halfCase = Math.floor(product.case_pack / 2);

              return (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800">
                      Invalid Split Case Quantity
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This product allows split case. Please order <strong>{halfCase}</strong> units (half case) or <strong>{fullCase}</strong> units (full case), or multiples of <strong>{halfCase}</strong>.
                    </p>
                  </div>
                </div>
              );
            }

            // For non-split case products
            const effectiveMinimum = (product.minimum_units != null && product.minimum_units > 0)
              ? product.minimum_units
              : product.case_pack;

            return (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800">
                    Minimum Units Not Met
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This product requires a minimum of <strong>{effectiveMinimum}</strong> unit{effectiveMinimum > 1 ? 's' : ''} per order.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Minimum Cost Warning */}
          {shouldShowMinimumCostWarning() && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  Minimum Cost Not Met
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This product requires a minimum order cost of <strong>${parseFloat(product.minimum_cost).toFixed(2)}</strong>. Current total: <strong>${totalPrice.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          )}

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
