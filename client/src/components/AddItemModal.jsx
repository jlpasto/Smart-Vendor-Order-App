import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../config/api';

const AddItemModal = ({ batchNumber, isOpen, onClose, onItemAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    quantity: 1,
    pricing_mode: 'case',
    admin_notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      resetForm();
    }
  }, [isOpen]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(term) ||
          p.vendor_name?.toLowerCase().includes(term) ||
          p.upc?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await api.get('/products', {
        params: {
          limit: 1000 // Load all products for selection
        }
      });
      setProducts(response.data.products || []);
      setFilteredProducts(response.data.products || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setFormData({
      quantity: 1,
      pricing_mode: 'case',
      admin_notes: ''
    });
    setError(null);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);

    // Pre-fill pricing based on available prices
    const initialPricingMode = product.wholesale_case_price ? 'case' : 'unit';
    const initialQuantity = initialPricingMode === 'case' ? 1 : (product.case_pack || 1);

    setFormData({
      quantity: initialQuantity,
      pricing_mode: initialPricingMode,
      admin_notes: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAmount = () => {
    if (!selectedProduct) return 0;

    const price =
      formData.pricing_mode === 'unit'
        ? parseFloat(selectedProduct.wholesale_unit_price || 0)
        : parseFloat(selectedProduct.wholesale_case_price || 0);

    return parseFloat((price * formData.quantity).toFixed(2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/orders/batch/${batchNumber}/add-item`,
        {
          product_connect_id: selectedProduct.product_connect_id,
          product_name: selectedProduct.product_name,
          vendor_name: selectedProduct.vendor_name,
          vendor_connect_id: selectedProduct.vendor_connect_id,
          quantity: parseInt(formData.quantity),
          pricing_mode: formData.pricing_mode,
          unit_price: parseFloat(selectedProduct.wholesale_unit_price || 0),
          case_price: parseFloat(selectedProduct.wholesale_case_price || 0),
          admin_notes: formData.admin_notes.trim() || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onItemAdded(response.data.order);
        onClose();
        resetForm();
      } else {
        setError(response.data.message || 'Failed to add item');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.response?.data?.message || 'Failed to add item to batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold">Add Item to Batch</h2>
              <p className="text-sm text-green-100 mt-1">Batch: {batchNumber}</p>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Search and Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search and Select Product <span className="text-red-500">*</span>
                </label>

                {/* Search Input */}
                <div className="relative mb-3">
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

                {/* Product List */}
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {isLoadingProducts && (
                    <div className="flex items-center justify-center p-8">
                      <svg className="animate-spin h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}

                  {!isLoadingProducts && filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      {searchTerm ? 'No products found matching your search' : 'No products available'}
                    </div>
                  )}

                  {!isLoadingProducts &&
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProduct?.id === product.id ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={product.product_image || 'https://via.placeholder.com/60'}
                            alt={product.product_name}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{product.product_name}</h4>
                            <p className="text-sm text-gray-600">{product.vendor_name}</p>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                              <span>Case: ${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</span>
                              <span>Unit: ${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          {selectedProduct?.id === product.id && (
                            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Selected Product
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Product:</span>
                      <p className="text-gray-900">{selectedProduct.product_name}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Vendor:</span>
                      <p className="text-gray-900">{selectedProduct.vendor_name}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Case Price:</span>
                      <p className="text-gray-900">${parseFloat(selectedProduct.wholesale_case_price || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Unit Price:</span>
                      <p className="text-gray-900">${parseFloat(selectedProduct.wholesale_unit_price || 0).toFixed(2)}</p>
                    </div>
                    {selectedProduct.case_pack && (
                      <div>
                        <span className="font-semibold text-gray-700">Case Pack:</span>
                        <p className="text-gray-900">{selectedProduct.case_pack} units</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity and Pricing Mode */}
              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Pricing Mode */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Pricing Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.pricing_mode}
                      onChange={(e) => handleInputChange('pricing_mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="unit">By Unit</option>
                      <option value="case">By Case</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Calculated Amount */}
              {selectedProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">${calculateAmount().toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {formData.quantity} × $
                    {formData.pricing_mode === 'unit'
                      ? parseFloat(selectedProduct.wholesale_unit_price || 0).toFixed(2)
                      : parseFloat(selectedProduct.wholesale_case_price || 0).toFixed(2)}{' '}
                    ({formData.pricing_mode})
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedProduct && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={formData.admin_notes}
                    onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                    placeholder="Explain why this item was added..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows="3"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                </div>
              )}
            </form>
          </div>

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
              disabled={!selectedProduct || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                !selectedProduct || isSubmitting
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
                  Adding...
                </span>
              ) : (
                'Add to Batch'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItemModal;
