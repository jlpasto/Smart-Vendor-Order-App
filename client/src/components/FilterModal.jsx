import { useState } from 'react';
import { useFilter } from '../context/FilterContext';

const FilterModal = ({ isOpen, onClose, onSelectField }) => {
  const { isFilterActive, clearAllFilters, getActiveFilterCount } = useFilter();
  const [searchTerm, setSearchTerm] = useState('');

  const filterFields = [
    { key: 'id', label: 'ID', icon: '#', type: 'text' },
    { key: 'vendor_connect_id', label: 'Vendor Connect ID', icon: '🔗', type: 'text' },
    { key: 'vendor', label: 'Vendor Name', icon: '🏪', type: 'dropdown' },
    { key: 'product_name', label: 'Product Name', icon: '📦', type: 'text' },
    { key: 'main_categories', label: 'Main Category', icon: '📂', type: 'checkbox' },
    { key: 'sub_categories', label: 'Sub-Category', icon: '📁', type: 'checkbox' },
    { key: 'allergens', label: 'Allergens', icon: '⚠️', type: 'checkbox' },
    { key: 'dietary_preferences', label: 'Dietary Preferences', icon: '🥗', type: 'checkbox' },
    { key: 'cuisine_type', label: 'Cuisine Type', icon: '🍽️', type: 'dropdown' },
    { key: 'seasonal_featured', label: 'Seasonal and Featured', icon: '⭐', type: 'dropdown' },
    { key: 'size', label: 'Size', icon: '📏', type: 'text' },
    { key: 'case_pack', label: 'Case Pack', icon: '📦', type: 'range' },
    { key: 'price', label: 'Wholesale Case Price', icon: '💰', type: 'range' },
    { key: 'unit_price', label: 'Wholesale Unit Price', icon: '💵', type: 'range' },
    { key: 'msrp', label: 'Retail Unit Price (MSRP)', icon: '💲', type: 'range' },
    { key: 'gm', label: 'GM%', icon: '📊', type: 'range' },
    { key: 'case_minimum', label: 'Case Minimum', icon: '📉', type: 'range' },
    { key: 'shelf_life', label: 'Shelf Life', icon: '⏳', type: 'text' },
    { key: 'upc', label: 'UPC', icon: '🔢', type: 'text' },
    { key: 'state', label: 'State', icon: '📍', type: 'dropdown' },
    { key: 'delivery_info', label: 'Delivery Info', icon: '🚚', type: 'text' },
    { key: 'notes', label: 'Notes', icon: '📝', type: 'text' },
    { key: 'popular', label: 'Featured', icon: '⭐', type: 'toggle' },
    { key: 'seasonal', label: 'Seasonal', icon: '🍂', type: 'toggle' },
    { key: 'new', label: 'New', icon: '🆕', type: 'toggle' },
  ];

  const filteredFields = filterFields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Slide from Right */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Filter</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Fields List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredFields.map((field) => (
                <button
                  key={field.key}
                  onClick={() => onSelectField(field)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{field.icon}</span>
                    <span className="font-semibold text-gray-900">{field.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isFilterActive(field.key) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                clearAllFilters();
                onClose();
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
            >
              Clear All Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </button>
          </div>
      </div>
    </>
  );
};

export default FilterModal;
