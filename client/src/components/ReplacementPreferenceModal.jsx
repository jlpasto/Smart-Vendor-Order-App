import { useState, useEffect } from 'react';
import api from '../config/api';

const ReplacementPreferenceModal = ({ item, isOpen, onClose, onSave }) => {
  const [unavailableAction, setUnavailableAction] = useState('curate');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  // Initialize state when modal opens with item
  useEffect(() => {
    if (isOpen && item) {
      setUnavailableAction(item.unavailable_action || 'curate');
      setSimilarProducts([]);

      // If item already has a replacement product ID, we'll fetch similar products
      // and try to pre-select it
      if (item.replacement_product_id) {
        setSelectedReplacement({
          id: item.replacement_product_id,
          product_name: 'Loading...' // Will be updated when similar products load
        });
      } else {
        setSelectedReplacement(null);
      }
    }
  }, [isOpen, item]);

  // Fetch similar products when "replace" is selected
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if ((unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && item && isOpen) {
        setLoadingSimilar(true);
        try {
          const sameVendorOnly = unavailableAction === 'replace_same_vendor';
          const response = await api.get(`/api/products/${item.id}/similar`, {
            params: {
              limit: 10,
              sameVendorOnly
            }
          });
          const products = response.data.similarProducts || [];
          setSimilarProducts(products);

          // If we had a replacement_product_id, try to find it in the similar products
          if (item.replacement_product_id) {
            const matchingProduct = products.find(p => p.id === item.replacement_product_id);
            if (matchingProduct) {
              setSelectedReplacement(matchingProduct);
            }
          }
        } catch (error) {
          console.error('Error fetching similar products:', error);
          setSimilarProducts([]);
        } finally {
          setLoadingSimilar(false);
        }
      } else {
        setSimilarProducts([]);
        setSelectedReplacement(null);
      }
    };

    fetchSimilarProducts();
  }, [unavailableAction, item, isOpen]);

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

  if (!item) return null;

  const handleSavePreference = () => {
    // Pass replacement product ID and name if any "replace" option is selected and a replacement is chosen
    const replacementProductId = (unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && selectedReplacement
      ? selectedReplacement.id
      : null;

    const replacementProductName = (unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && selectedReplacement
      ? selectedReplacement.product_name
      : null;

    onSave(unavailableAction, replacementProductId, replacementProductName);
  };

  const handleUnavailableActionChange = (value) => {
    setUnavailableAction(value);
    // Clear selected replacement when changing to non-replace options
    if (value !== 'replace_same_vendor' && value !== 'replace_other_vendors') {
      setSelectedReplacement(null);
    }
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
          <h2 className="text-xl font-bold text-gray-900">Edit Replacement Preference</h2>
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
                src={item.product_image || 'https://via.placeholder.com/200'}
                alt={item.product_name}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{item.product_name}</h3>
                <p className="text-sm text-gray-600">ID: #{item.id}</p>
                <p className="text-sm text-gray-600">{item.vendor_name}</p>
              </div>
            </div>
          </div>

          {/* If Unavailable Dropdown */}
          <div className="mb-6">
            <label htmlFor="unavailable-action" className="block text-sm font-medium text-gray-700 mb-2">
              If this item is unavailable:
            </label>

            <select
              id="unavailable-action"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={unavailableAction}
              onChange={(e) => handleUnavailableActionChange(e.target.value)}
            >
              <option value="curate">Curate to replace if sold out</option>
              <option value="replace_same_vendor">Replace with similar item under same vendor</option>
              <option value="replace_other_vendors">Replace with similar item across other vendors</option>
              <option value="remove">Remove it from my order</option>
            </select>

            <p className="mt-2 text-xs text-gray-500">
              {unavailableAction === 'curate' && 'We will curate a replacement for you if this item is sold out.'}
              {unavailableAction === 'replace_same_vendor' && 'We will replace with a similar item from the same vendor.'}
              {unavailableAction === 'replace_other_vendors' && 'We will replace with a similar item from any vendor.'}
              {unavailableAction === 'remove' && 'This item will be removed from your order if unavailable.'}
            </p>
          </div>

          {/* Similar Products Section */}
          {(unavailableAction === 'replace_same_vendor' || unavailableAction === 'replace_other_vendors') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Replacement Product (Optional):
              </label>

              {loadingSimilar ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : similarProducts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">No similar products found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {similarProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedReplacement?.id === product.id
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedReplacement(product)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.product_image || 'https://via.placeholder.com/60'}
                          alt={product.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {product.product_name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">{product.vendor_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-primary-600">
                              ${parseFloat(product.wholesale_case_price || 0).toFixed(2)} / case
                            </span>
                          </div>
                        </div>
                        {selectedReplacement?.id === product.id && (
                          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedReplacement && (
                <button
                  onClick={() => setSelectedReplacement(null)}
                  className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreference}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReplacementPreferenceModal;
