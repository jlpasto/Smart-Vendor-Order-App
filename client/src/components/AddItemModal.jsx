import { useState, useEffect, useMemo } from 'react';
import api from '../config/api';

const AddItemModal = ({ batchNumber, isOpen, onClose, onItemAdded }) => {
  // Product data state
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState(null);

  // Multi-selection state (using Set and Map for performance)
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [selectedProductsData, setSelectedProductsData] = useState(new Map());
  const [itemConfigs, setItemConfigs] = useState(new Map());

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(new Map());

  // Load buyer email and products when modal opens
  useEffect(() => {
    if (isOpen && batchNumber) {
      loadBuyerInfo();
    }
  }, [isOpen, batchNumber]);

  // Load products when buyer email is available
  useEffect(() => {
    if (buyerEmail) {
      loadProducts();
      resetForm();
    }
  }, [buyerEmail]);

  // Memoize filtered products for performance
  const filteredProducts = useMemo(() => {
    // Ensure products is always an array
    const productList = Array.isArray(products) ? products : [];
    if (!searchTerm.trim()) return productList;
    const term = searchTerm.toLowerCase();
    return productList.filter(
      (p) =>
        p.product_name?.toLowerCase().includes(term) ||
        p.vendor_name?.toLowerCase().includes(term) ||
        p.upc?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Memoize total amount calculation
  const totalAmount = useMemo(() => {
    let total = 0;
    selectedProductsData.forEach((product, productId) => {
      const config = itemConfigs.get(productId);
      if (config) {
        const price =
          config.pricing_mode === 'case'
            ? parseFloat(product.wholesale_case_price || 0)
            : parseFloat(product.wholesale_unit_price || 0);
        total += price * config.quantity;
      }
    });
    return total;
  }, [selectedProductsData, itemConfigs]);

  const loadBuyerInfo = async () => {
    setError(null);
    try {
      // Fetch batch details to get buyer email
      const response = await api.get(`/api/orders/batch/${encodeURIComponent(batchNumber)}`);
      if (response.data && response.data.length > 0) {
        const buyerEmailFromBatch = response.data[0].user_email;
        setBuyerEmail(buyerEmailFromBatch);
      } else {
        setError('Could not load buyer information for this batch');
      }
    } catch (err) {
      console.error('Error loading buyer info:', err);
      setError('Failed to load buyer information');
    }
  };

  const loadProducts = async () => {
    if (!buyerEmail) {
      console.log('No buyer email available yet');
      return;
    }

    setIsLoadingProducts(true);
    try {
      const response = await api.get('/api/products', {
        params: {
          buyerEmail: buyerEmail, // Filter products by buyer's assignments
          limit: 10000 // Load all assigned products
        }
      });
      console.log('Products API response for buyer', buyerEmail, ':', response.data);
      // API returns { items: [], pagination: {}, meta: {} } when using cursor pagination
      const productData = response.data.items || response.data || [];
      console.log('Setting products to:', productData);
      setProducts(productData);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedProductIds(new Set());
    setSelectedProductsData(new Map());
    setItemConfigs(new Map());
    setError(null);
    setValidationErrors(new Map());
    setSubmissionProgress({ current: 0, total: 0 });
  };

  // Handle individual product checkbox toggle
  const handleProductToggle = (product) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) {
        // Deselect
        newSet.delete(product.id);
        setSelectedProductsData((prev) => {
          const newMap = new Map(prev);
          newMap.delete(product.id);
          return newMap;
        });
        setItemConfigs((prev) => {
          const newMap = new Map(prev);
          newMap.delete(product.id);
          return newMap;
        });
      } else {
        // Select
        newSet.add(product.id);
        setSelectedProductsData((prev) => new Map(prev).set(product.id, product));

        // Initialize config with smart defaults
        const initialMode = product.wholesale_case_price ? 'case' : 'unit';
        const initialQty = initialMode === 'case' ? 1 : (product.case_pack || 1);
        setItemConfigs((prev) =>
          new Map(prev).set(product.id, {
            quantity: initialQty,
            pricing_mode: initialMode,
            admin_notes: '',
            isValid: true
          })
        );
      }
      return newSet;
    });
  };

  // Handle Select All toggle
  const handleSelectAll = () => {
    const allSelected = filteredProducts.every((p) => selectedProductIds.has(p.id));
    if (allSelected) {
      // Deselect all filtered products
      const filteredIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedProductIds((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
      setSelectedProductsData((prev) => {
        const newMap = new Map(prev);
        filteredIds.forEach((id) => newMap.delete(id));
        return newMap;
      });
      setItemConfigs((prev) => {
        const newMap = new Map(prev);
        filteredIds.forEach((id) => newMap.delete(id));
        return newMap;
      });
    } else {
      // Select all filtered products
      const newIds = new Set(selectedProductIds);
      const newData = new Map(selectedProductsData);
      const newConfigs = new Map(itemConfigs);

      filteredProducts.forEach((p) => {
        if (!newIds.has(p.id)) {
          newIds.add(p.id);
          newData.set(p.id, p);
          const mode = p.wholesale_case_price ? 'case' : 'unit';
          const qty = mode === 'case' ? 1 : (p.case_pack || 1);
          newConfigs.set(p.id, {
            quantity: qty,
            pricing_mode: mode,
            admin_notes: '',
            isValid: true
          });
        }
      });

      setSelectedProductIds(newIds);
      setSelectedProductsData(newData);
      setItemConfigs(newConfigs);
    }
  };

  // Handle removing item from right panel
  const handleRemoveItem = (productId) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    setSelectedProductsData((prev) => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
    setItemConfigs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
    setValidationErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  };

  // Handle config changes (quantity, pricing mode)
  const handleConfigChange = (productId, field, value) => {
    setItemConfigs((prev) => {
      const newConfigs = new Map(prev);
      const currentConfig = newConfigs.get(productId) || {};
      const updatedConfig = {
        ...currentConfig,
        [field]: field === 'quantity' ? parseInt(value) || 0 : value
      };

      // Validation
      updatedConfig.isValid = updatedConfig.quantity > 0;

      newConfigs.set(productId, updatedConfig);
      return newConfigs;
    });

    // Clear validation error if fixed
    if (field === 'quantity' && parseInt(value) > 0) {
      setValidationErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(productId);
        return newErrors;
      });
    }
  };

  // Validate all items before submission
  const validateAllItems = () => {
    const errors = new Map();
    let isValid = true;

    selectedProductsData.forEach((product, productId) => {
      const config = itemConfigs.get(productId);
      if (!config || config.quantity <= 0) {
        errors.set(productId, 'Quantity must be greater than 0');
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // Handle submission with sequential API calls
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedProductIds.size === 0) {
      setError('Please select at least one product');
      return;
    }

    if (!validateAllItems()) {
      setError('Please fix validation errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const items = Array.from(selectedProductsData.values());
    setSubmissionProgress({ current: 0, total: items.length });

    const successfulAdds = [];
    const failedAdds = [];

    for (let i = 0; i < items.length; i++) {
      const product = items[i];
      const config = itemConfigs.get(product.id);

      try {
        const response = await api.post(
          `/api/orders/batch/${encodeURIComponent(batchNumber)}/add-item`,
          {
            product_connect_id: product.product_connect_id,
            product_name: product.product_name,
            vendor_name: product.vendor_name,
            vendor_connect_id: product.vendor_connect_id,
            quantity: config.quantity,
            pricing_mode: config.pricing_mode,
            unit_price: parseFloat(product.wholesale_unit_price || 0),
            case_price: parseFloat(product.wholesale_case_price || 0),
            admin_notes: config.admin_notes?.trim() || null
          }
        );

        if (response.data.success) {
          successfulAdds.push({ product, order: response.data.order });
        } else {
          failedAdds.push({ product, error: response.data.message || 'Failed to add item' });
        }
        setSubmissionProgress({ current: i + 1, total: items.length });
      } catch (err) {
        console.error(`Failed to add ${product.product_name}:`, err);
        failedAdds.push({
          product,
          error: err.response?.data?.message || 'Failed to add item'
        });
      }
    }

    setIsSubmitting(false);

    // Show results
    if (failedAdds.length === 0) {
      alert(`Successfully added ${successfulAdds.length} item${successfulAdds.length > 1 ? 's' : ''} to batch!`);
      onItemAdded(); // Trigger parent refresh
      onClose();
      resetForm();
    } else {
      const message = `Added ${successfulAdds.length} item${successfulAdds.length > 1 ? 's' : ''} successfully.\n\nFailed to add ${failedAdds.length} item${failedAdds.length > 1 ? 's' : ''}:\n${failedAdds.map((f) => `• ${f.product.product_name}: ${f.error}`).join('\n')}`;
      alert(message);
      // Keep modal open, remove successful items from selection
      successfulAdds.forEach(({ product }) => {
        handleRemoveItem(product.id);
      });
    }
  };

  if (!isOpen) return null;

  // Check if all visible products are selected (for select all checkbox)
  const isAllSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.has(p.id));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold">Add Items to Batch</h2>
              <p className="text-sm text-green-100 mt-1">Batch: {batchNumber}</p>
              {buyerEmail && (
                <p className="text-xs text-green-200 mt-1">
                  Showing products assigned to: {buyerEmail}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-800 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Split Panel Layout */}
          <div className="flex-1 overflow-hidden p-6 flex gap-6">
            {/* LEFT PANEL - Product Table */}
            <div className="flex-1 flex flex-col pr-4 border-r border-gray-200">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by product name, vendor, or UPC..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Product Table */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="w-12 py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          title="Select all visible products"
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
                        Product / Vendor
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                        Case Price
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 text-sm">
                        Unit Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProducts && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center">
                          <svg className="animate-spin h-8 w-8 text-green-600 mx-auto" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </td>
                      </tr>
                    )}

                    {!isLoadingProducts && filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          {searchTerm ? 'No products found matching your search' : 'No products available'}
                        </td>
                      </tr>
                    )}

                    {!isLoadingProducts &&
                      filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedProductIds.has(product.id) ? 'bg-green-50' : ''
                          }`}
                          onClick={() => handleProductToggle(product)}
                        >
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => handleProductToggle(product)}
                              className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900 text-sm">{product.product_name}</div>
                            <div className="text-xs text-gray-600">{product.vendor_name}</div>
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900">
                            ${parseFloat(product.wholesale_case_price || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-900">
                            ${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT PANEL - Selected Items */}
            <div className="w-2/5 flex flex-col">
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Selected Items ({selectedProductIds.size})
                </h3>
              </div>

              {/* Selected Items List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {selectedProductIds.size === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-300 mx-auto mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">No items selected</p>
                    <p className="text-gray-400 text-xs mt-1">Select products from the table</p>
                  </div>
                )}

                {Array.from(selectedProductsData.values()).map((product) => {
                  const config = itemConfigs.get(product.id) || {};
                  const price =
                    config.pricing_mode === 'case'
                      ? parseFloat(product.wholesale_case_price || 0)
                      : parseFloat(product.wholesale_unit_price || 0);
                  const itemTotal = (price * (config.quantity || 0)).toFixed(2);
                  const hasError = validationErrors.has(product.id);

                  return (
                    <div
                      key={product.id}
                      className={`bg-gray-50 border rounded-lg p-3 ${
                        hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {product.product_name}
                          </h4>
                          <p className="text-xs text-gray-600">{product.vendor_name}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(product.id)}
                          className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={config.quantity || 1}
                            onChange={(e) => handleConfigChange(product.id, 'quantity', e.target.value)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-green-500 ${
                              hasError ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Mode
                          </label>
                          <select
                            value={config.pricing_mode || 'case'}
                            onChange={(e) => handleConfigChange(product.id, 'pricing_mode', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                          >
                            <option value="case">Case</option>
                            <option value="unit">Unit</option>
                          </select>
                        </div>
                      </div>

                      {hasError && (
                        <div className="text-xs text-red-600 mb-2">{validationErrors.get(product.id)}</div>
                      )}

                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={config.admin_notes || ''}
                          onChange={(e) => handleConfigChange(product.id, 'admin_notes', e.target.value)}
                          placeholder="Add notes about this item..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 resize-none"
                          rows="2"
                        />
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {config.quantity || 0} × ${price.toFixed(2)}
                        </span>
                        <span className="font-bold text-green-600">${itemTotal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Amount */}
              {selectedProductIds.size > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 rounded-b-xl flex-shrink-0">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedProductIds.size === 0 || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedProductIds.size === 0 || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding {submissionProgress.current} of {submissionProgress.total}...
                </span>
              ) : (
                `Add ${selectedProductIds.size} Item${selectedProductIds.size > 1 ? 's' : ''} to Batch`
              )}
            </button>
          </div>

          {/* Submission Progress Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 rounded-xl">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-900">Adding items to batch...</p>
                <p className="text-sm text-gray-600 mt-1">
                  {submissionProgress.current} of {submissionProgress.total} items added
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-4 mx-auto">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(submissionProgress.current / submissionProgress.total) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AddItemModal;
