import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import api from '../config/api';

const FilterDetailPanel = ({ field, isOpen, onBack }) => {
  const { filters, updateFilter, clearFilter } = useFilter();
  const [localValue, setLocalValue] = useState('');
  const [localArrayValue, setLocalArrayValue] = useState([]);
  const [localMinValue, setLocalMinValue] = useState('');
  const [localMaxValue, setLocalMaxValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load current filter value when panel opens
  useEffect(() => {
    if (isOpen && field) {
      if (field.type === 'checkbox') {
        setLocalArrayValue(filters[field.key] || []);
        fetchOptions();
      } else if (field.type === 'range') {
        const minKey = `${field.key}_min`;
        const maxKey = `${field.key}_max`;
        setLocalMinValue(filters[minKey] || '');
        setLocalMaxValue(filters[maxKey] || '');
      } else if (field.type === 'toggle') {
        setLocalValue(filters[field.key] || false);
      } else if (field.type === 'dropdown') {
        setLocalValue(filters[field.key] || '');
        fetchOptions();
      } else {
        setLocalValue(filters[field.key] || '');
      }
    }
  }, [isOpen, field]);

  const fetchOptions = async () => {
    if (!field) return;

    setLoading(true);
    try {
      let endpoint = '';
      switch (field.key) {
        case 'vendor':
          endpoint = '/api/products/filters/vendors';
          break;
        case 'state':
          endpoint = '/api/products/filters/states';
          break;
        case 'main_categories':
          endpoint = '/api/products/filters/main-categories';
          break;
        case 'sub_categories':
          endpoint = '/api/products/filters/sub-categories';
          break;
        case 'allergens':
          endpoint = '/api/products/filters/allergens';
          break;
        case 'dietary_preferences':
          endpoint = '/api/products/filters/dietary-preferences';
          break;
        case 'cuisine_type':
          endpoint = '/api/products/filters/cuisine-types';
          break;
        case 'seasonal_featured':
          endpoint = '/api/products/filters/seasonal-featured';
          break;
        default:
          break;
      }

      if (endpoint) {
        const response = await api.get(endpoint);
        setOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (field.type === 'checkbox') {
      updateFilter(field.key, localArrayValue);
    } else if (field.type === 'range') {
      const minKey = `${field.key}_min`;
      const maxKey = `${field.key}_max`;
      updateFilter(minKey, localMinValue);
      updateFilter(maxKey, localMaxValue);
    } else {
      updateFilter(field.key, localValue);
    }
    onBack();
  };

  const handleClear = () => {
    if (field.type === 'range') {
      const minKey = `${field.key}_min`;
      const maxKey = `${field.key}_max`;
      clearFilter(minKey);
      clearFilter(maxKey);
      setLocalMinValue('');
      setLocalMaxValue('');
    } else if (field.type === 'checkbox') {
      clearFilter(field.key);
      setLocalArrayValue([]);
    } else {
      clearFilter(field.key);
      setLocalValue('');
    }
  };

  const toggleCheckbox = (value) => {
    setLocalArrayValue(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const toggleSelectAll = () => {
    if (localArrayValue.length === options.length) {
      setLocalArrayValue([]);
    } else {
      setLocalArrayValue([...options]);
    }
  };

  if (!isOpen || !field) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onBack}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-900">{field.label}</h2>
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
          >
            Clear
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {field.type === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {field.key === 'id' || field.key === 'vendor_connect_id' || field.key === 'upc' ? 'Exact match' : 'Contains'}
              </label>
              <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                autoFocus
              />
            </div>
          )}

          {field.type === 'dropdown' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select {field.label}
              </label>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <select
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                >
                  <option value="">All {field.label}</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {field.type === 'checkbox' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  Select {field.label}
                </label>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {localArrayValue.length === options.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={localArrayValue.includes(option)}
                        onChange={() => toggleCheckbox(option)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {field.type === 'range' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localMinValue}
                  onChange={(e) => setLocalMinValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Min value"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localMaxValue}
                  onChange={(e) => setLocalMaxValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Max value"
                />
              </div>
            </div>
          )}

          {field.type === 'toggle' && (
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localValue}
                    onChange={(e) => setLocalValue(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${localValue ? 'bg-primary-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${localValue ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {localValue ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleApply}
            className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-lg transition-colors"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterDetailPanel;
