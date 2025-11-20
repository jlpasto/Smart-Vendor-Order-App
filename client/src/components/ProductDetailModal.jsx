import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const ProductDetailModal = ({ product, isOpen, onClose, onNext, onPrev, onEdit, onDelete }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showVendorTooltip, setShowVendorTooltip] = useState(false);
  const [vendorTooltipPinned, setVendorTooltipPinned] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      // Reset maximized state when modal opens
      setIsMaximized(false);
      setAddedToCart(false);
      setVendorTooltipPinned(false);
      setShowVendorTooltip(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Close tooltip when clicking outside
    const handleClickOutside = (e) => {
      if (vendorTooltipPinned && !e.target.closest('.vendor-tooltip-container')) {
        setVendorTooltipPinned(false);
        setShowVendorTooltip(false);
      }
    };

    if (vendorTooltipPinned) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [vendorTooltipPinned]);

  useEffect(() => {
    // Handle escape key to close modal
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    // Handle arrow keys for navigation
    const handleArrowKeys = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleArrowKeys);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleArrowKeys);
    };
  }, [isOpen, onClose, onNext, onPrev]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
      onDelete(product);
      onClose();
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
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMaximized ? 'w-full' : 'w-full md:w-2/3 lg:w-1/2 xl:w-2/5'}`}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 truncate flex-1">
            {product.product_name}
          </h2>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
              title="Delete"
            >
              Delete
            </button>

            {/* Previous Button */}
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={onNext}
              disabled={!onNext}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next product"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center space-x-4 flex-shrink-0">
          {/* Edit Button */}
          <button
            onClick={() => onEdit && onEdit(product)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={addedToCart}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              addedToCart
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {addedToCart ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            <span>{addedToCart ? 'Added to Cart!' : 'Add To Cart'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Product Image */}
          <div className="mb-6">
            <img
              src={product.product_image || 'https://via.placeholder.com/400'}
              alt={product.product_name}
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
            {/* Badges */}
            <div className="flex gap-2 mt-4">
              {product.popular && (
                <span className="px-3 py-1 bg-amber-500 text-white text-sm rounded-full font-semibold">
                  ⭐ Featured
                </span>
              )}
              {product.seasonal && (
                <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full font-semibold">
                  🍂 Seasonal
                </span>
              )}
              {product.new && (
                <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full font-semibold">
                  🆕 New
                </span>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* ID */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-500 mb-1">ID</label>
              <p className="text-lg text-gray-900">{product.id}</p>
            </div>

            {/* Vendor Connect ID */}
            {product.vendor_connect_id && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Vendor Connect ID</label>
                <p className="text-lg text-gray-900">{product.vendor_connect_id}</p>
              </div>
            )}

            {/* Vendor Name */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-semibold text-gray-500">Vendor Name</label>
                {product.vendor_about && (
                  <div className="relative vendor-tooltip-container">
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      onMouseEnter={() => !vendorTooltipPinned && setShowVendorTooltip(true)}
                      onMouseLeave={() => !vendorTooltipPinned && setShowVendorTooltip(false)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setVendorTooltipPinned(!vendorTooltipPinned);
                        setShowVendorTooltip(!vendorTooltipPinned);
                      }}
                    >
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {showVendorTooltip && (
                      <div className="absolute left-0 top-6 z-50 w-80 p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                        <p className="text-sm text-gray-600 leading-relaxed">{product.vendor_about}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-900">{product.vendor_name}</p>
            </div>

            {/* Product Name */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-500 mb-1">Product Name</label>
              <p className="text-lg text-gray-900">{product.product_name}</p>
            </div>

            {/* Main Category & Sub-Category */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Main Category</label>
                <p className="text-lg text-gray-900">{product.main_category || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Sub-Category</label>
                <p className="text-lg text-gray-900">{product.sub_category || '-'}</p>
              </div>
            </div>

            {/* Allergens */}
            {product.allergens && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Allergens</label>
                <p className="text-lg text-gray-900">{product.allergens}</p>
              </div>
            )}

            {/* Dietary Preferences */}
            {product.dietary_preferences && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Dietary Preferences</label>
                <p className="text-lg text-gray-900">{product.dietary_preferences}</p>
              </div>
            )}

            {/* Cuisine Type */}
            {product.cuisine_type && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Cuisine Type</label>
                <p className="text-lg text-gray-900">{product.cuisine_type}</p>
              </div>
            )}

            {/* Seasonal and Featured */}
            {product.seasonal_featured && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Seasonal and Featured</label>
                <p className="text-lg text-gray-900">{product.seasonal_featured}</p>
              </div>
            )}

            {/* Description */}
            {product.product_description && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Description</label>
                <p className="text-lg text-gray-900">{product.product_description}</p>
              </div>
            )}

            {/* Size & Case Pack */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Size</label>
                <p className="text-lg text-gray-900">{product.size || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1">Case Pack</label>
                <p className="text-lg text-gray-900">{product.case_pack || '-'}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-gray-900 mb-3">Pricing Information</h3>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Wholesale Case Price:</span>
                <span className="text-xl font-bold text-primary-600">
                  ${parseFloat(product.wholesale_case_price || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Wholesale Unit Price:</span>
                <span className="text-xl font-bold text-primary-600">
                  ${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Retail Unit Price (MSRP):</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${parseFloat(product.retail_unit_price || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Gross Margin (GM%):</span>
                <span className="text-lg font-bold text-green-600">
                  {parseFloat(product.gm_percent || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Case Minimum */}
            {product.case_minimum && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Case Minimum</label>
                <p className="text-lg text-gray-900">{product.case_minimum}</p>
              </div>
            )}

            {/* Shelf Life */}
            {product.shelf_life && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Shelf Life</label>
                <p className="text-lg text-gray-900">{product.shelf_life}</p>
              </div>
            )}

            {/* UPC */}
            {product.upc && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">UPC</label>
                <p className="text-lg text-gray-900">{product.upc}</p>
              </div>
            )}

            {/* State */}
            {product.state && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">State</label>
                <p className="text-lg text-gray-900">{product.state}</p>
              </div>
            )}

            {/* Delivery Info */}
            {product.delivery_info && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Delivery Info</label>
                <p className="text-lg text-gray-900">{product.delivery_info}</p>
              </div>
            )}

            {/* Notes */}
            {product.notes && (
              <div className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-semibold text-gray-500 mb-1">Notes</label>
                <p className="text-lg text-gray-900">{product.notes}</p>
              </div>
            )}

            {/* Stock Level */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-500 mb-1">Stock Level</label>
              <p className={`text-lg font-semibold ${
                product.stock_level > 100 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {product.stock_level} units
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;
