import { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  // Filter state
  const [filters, setFilters] = useState({
    // Text filters
    id: '',
    vendor_connect_id: '',
    product_name: '',
    size: '',
    upc: '',
    shelf_life: '',
    delivery_info: '',
    notes: '',

    // Dropdown filters
    vendor: '',
    state: '',
    cuisine_type: '',
    seasonal_featured: '',

    // Multi-select filters
    main_categories: [],
    sub_categories: [],
    allergens: [],
    dietary_preferences: [],

    // Range filters
    case_pack_min: '',
    case_pack_max: '',
    price_min: '',
    price_max: '',
    unit_price_min: '',
    unit_price_max: '',
    msrp_min: '',
    msrp_max: '',
    gm_min: '',
    gm_max: '',
    case_minimum_min: '',
    case_minimum_max: '',

    // Boolean toggle filters
    popular: false,
    seasonal: false,
    new: false,
  });

  // Update a single filter
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear a single filter
  const clearFilter = (key) => {
    const defaultValue = Array.isArray(filters[key]) ? [] :
                        typeof filters[key] === 'boolean' ? false : '';
    setFilters(prev => ({
      ...prev,
      [key]: defaultValue
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      id: '',
      vendor_connect_id: '',
      product_name: '',
      size: '',
      upc: '',
      shelf_life: '',
      delivery_info: '',
      notes: '',
      vendor: '',
      state: '',
      cuisine_type: '',
      seasonal_featured: '',
      main_categories: [],
      sub_categories: [],
      allergens: [],
      dietary_preferences: [],
      case_pack_min: '',
      case_pack_max: '',
      price_min: '',
      price_max: '',
      unit_price_min: '',
      unit_price_max: '',
      msrp_min: '',
      msrp_max: '',
      gm_min: '',
      gm_max: '',
      case_minimum_min: '',
      case_minimum_max: '',
      popular: false,
      seasonal: false,
      new: false,
    });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) count++;
      } else if (typeof value === 'boolean') {
        if (value === true) count++;
      } else if (value !== '' && value !== null && value !== undefined) {
        count++;
      }
    });

    return count;
  };

  // Check if a specific filter is active
  const isFilterActive = (key) => {
    const value = filters[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'boolean') {
      return value === true;
    } else {
      return value !== '' && value !== null && value !== undefined;
    }
  };

  const value = {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    getActiveFilterCount,
    isFilterActive,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterContext;
