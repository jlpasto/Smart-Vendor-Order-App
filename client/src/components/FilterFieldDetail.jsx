import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import api from '../config/api';

const FilterFieldDetail = ({ field, onApply, onClear, onBack }) => {
  const { filters, updateFilter, clearFilter } = useFilter();
  const [localValue, setLocalValue] = useState('');
  const [localArrayValue, setLocalArrayValue] = useState([]);
  const [localMinValue, setLocalMinValue] = useState('');
  const [localMaxValue, setLocalMaxValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load current filter value when field changes
  useEffect(() => {
    if (field) {
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
  }, [field, filters]);

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
    if (onApply) onApply();
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
    if (onClear) onClear();
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

  if (!field) return null;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900">{field.label}</h2>
        </div>
        <button
          onClick={handleClear}
          className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-4">
        {field.type === 'text' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {field.key === 'id' || field.key === 'vendor_connect_id' || field.key === 'upc' ? 'Exact match' : 'Contains'}
            </label>
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              autoFocus
            />
          </div>
        )}

        {field.type === 'dropdown' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Select {field.label}
            </label>
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <select
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">
                Select {field.label}
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
              >
                {localArrayValue.length === options.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner w-6 h-6 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={localArrayValue.includes(option)}
                      onChange={() => toggleCheckbox(option)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {field.type === 'range' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Minimum
              </label>
              <input
                type="number"
                step="0.01"
                value={localMinValue}
                onChange={(e) => setLocalMinValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Min value"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Maximum
              </label>
              <input
                type="number"
                step="0.01"
                value={localMaxValue}
                onChange={(e) => setLocalMaxValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Max value"
              />
            </div>
          </div>
        )}

        {field.type === 'toggle' && (
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={localValue}
                  onChange={(e) => setLocalValue(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-12 h-6 rounded-full transition-colors ${localValue ? 'bg-primary-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${localValue ? 'transform translate-x-6' : ''}`}></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {localValue ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3">
        <button
          onClick={handleApply}
          className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm transition-colors"
        >
          Apply Filter
        </button>
      </div>
    </>
  );
};

export default FilterFieldDetail;
