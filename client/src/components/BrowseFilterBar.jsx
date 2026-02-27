import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import api from '../config/api';
import CheckboxFilterModal from './CheckboxFilterModal';
import PriceRangeModal from './PriceRangeModal';

const BrowseFilterBar = ({ sortField, sortOrder, onSortChange, showFavorites, onToggleFavorites, favoriteCount }) => {
  const { filters, updateFilter, clearFilter, clearAllFilters } = useFilter();

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  // Filter options from API
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [states, setStates] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  // Loading states
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  // Fetch filter options on mount
  useEffect(() => {
    fetchPriceRange();
  }, []);

  const fetchCategories = async () => {
    if (categories.length > 0) return;
    setLoadingCategories(true);
    try {
      const res = await api.get('/api/products/filters/main-categories');
      setCategories(res.data.filter(Boolean));
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchSubCategories = async () => {
    if (subCategories.length > 0) return;
    setLoadingSubCategories(true);
    try {
      const res = await api.get('/api/products/filters/sub-categories');
      setSubCategories(res.data.filter(Boolean));
    } catch (err) {
      console.error('Error fetching sub-categories:', err);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const fetchVendors = async () => {
    if (vendors.length > 0) return;
    setLoadingVendors(true);
    try {
      const res = await api.get('/api/products/filters/vendors');
      setVendors(res.data.filter(Boolean));
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchStates = async () => {
    if (states.length > 0) return;
    setLoadingStates(true);
    try {
      const res = await api.get('/api/products/filters/states');
      setStates(res.data.filter(Boolean));
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchPriceRange = async () => {
    try {
      const res = await api.get('/api/products/filters/price-range');
      setPriceRange({
        min: Math.floor(res.data.min),
        max: Math.ceil(res.data.max)
      });
    } catch (err) {
      console.error('Error fetching price range:', err);
    }
  };

  // Toggle filter handlers
  const toggleBoolean = (key) => {
    updateFilter(key, !filters[key]);
  };

  // Check if any dropdown filters are active
  const hasDropdownFilters = (
    (filters.main_categories?.length > 0) ||
    (filters.sub_categories?.length > 0) ||
    (filters.vendor?.length > 0) ||
    (filters.state?.length > 0) ||
    (filters.price_min !== '' && filters.price_min !== undefined) ||
    (filters.price_max !== '' && filters.price_max !== undefined)
  );

  // Handle "All" click - clear dropdown filters only
  const handleAllClick = () => {
    clearFilter('main_categories');
    clearFilter('sub_categories');
    clearFilter('vendor');
    clearFilter('state');
    clearFilter('price_min');
    clearFilter('price_max');
  };

  // Handle category apply
  const handleCategoryApply = (selected) => {
    updateFilter('main_categories', selected);
  };

  // Handle sub-category apply
  const handleSubCategoryApply = (selected) => {
    updateFilter('sub_categories', selected);
  };

  // Handle vendor apply
  const handleVendorApply = (selected) => {
    updateFilter('vendor', selected);
  };

  // Handle state apply
  const handleStateApply = (selected) => {
    updateFilter('state', selected);
  };

  // Handle price range apply
  const handlePriceApply = (min, max) => {
    updateFilter('price_min', min === '' ? '' : String(min));
    updateFilter('price_max', max === '' ? '' : String(max));
  };

  // Build active filter chips for display
  const getActiveChips = () => {
    const chips = [];

    if (filters.new) {
      chips.push({ key: 'new', label: 'New', onRemove: () => clearFilter('new') });
    }
    if (filters.popular) {
      chips.push({ key: 'popular', label: 'Featured', onRemove: () => clearFilter('popular') });
    }
    if (filters.seasonal) {
      chips.push({ key: 'seasonal', label: 'Seasonal', onRemove: () => clearFilter('seasonal') });
    }
    if (filters.main_categories?.length > 0) {
      filters.main_categories.forEach(cat => {
        chips.push({
          key: `cat-${cat}`,
          label: cat,
          onRemove: () => updateFilter('main_categories', filters.main_categories.filter(c => c !== cat))
        });
      });
    }
    if (filters.sub_categories?.length > 0) {
      filters.sub_categories.forEach(sub => {
        chips.push({
          key: `sub-${sub}`,
          label: sub,
          onRemove: () => updateFilter('sub_categories', filters.sub_categories.filter(s => s !== sub))
        });
      });
    }
    if (filters.vendor?.length > 0) {
      filters.vendor.forEach(v => {
        chips.push({
          key: `vendor-${v}`,
          label: v,
          onRemove: () => updateFilter('vendor', filters.vendor.filter(vn => vn !== v))
        });
      });
    }
    if (filters.state?.length > 0) {
      filters.state.forEach(s => {
        chips.push({
          key: `state-${s}`,
          label: s,
          onRemove: () => updateFilter('state', filters.state.filter(st => st !== s))
        });
      });
    }
    if (filters.price_min || filters.price_max) {
      const label = `$${filters.price_min || priceRange.min} - $${filters.price_max || priceRange.max}`;
      chips.push({
        key: 'price',
        label: `Price: ${label}`,
        onRemove: () => { clearFilter('price_min'); clearFilter('price_max'); }
      });
    }

    return chips;
  };

  const activeChips = getActiveChips();

  // Sort options
  const sortOptions = [
    { field: 'product_name', order: 'asc', label: 'Name A-Z' },
    { field: 'product_name', order: 'desc', label: 'Name Z-A' },
    { field: 'wholesale_case_price', order: 'asc', label: 'Price Low' },
    { field: 'wholesale_case_price', order: 'desc', label: 'Price High' },
    { field: 'vendor_name', order: 'asc', label: 'Vendor A-Z' },
    { field: 'vendor_name', order: 'desc', label: 'Vendor Z-A' },
  ];

  return (
    <div className="mb-4">
      {/* Sort Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 border-b border-gray-200 scrollbar-hide">
        {sortOptions.map((opt) => {
          const isActive = !showFavorites && sortField === opt.field && sortOrder === opt.order;
          return (
            <button
              key={`${opt.field}-${opt.order}`}
              onClick={() => { if (showFavorites) onToggleFavorites(); onSortChange(opt.field, opt.order); }}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Favorites Tab */}
        {onToggleFavorites && (
          <>
            <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />
            <button
              onClick={onToggleFavorites}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                showFavorites
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <svg className="w-4 h-4" fill={showFavorites ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
              {favoriteCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
                  {favoriteCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Toggle Chips */}
        <FilterChip
          label="New"
          active={filters.new}
          onClick={() => toggleBoolean('new')}
        />
        <FilterChip
          label="Featured"
          active={filters.popular}
          onClick={() => toggleBoolean('popular')}
        />
        <FilterChip
          label="Seasonal"
          active={filters.seasonal}
          onClick={() => toggleBoolean('seasonal')}
        />

        {/* Dropdown Chips */}
        <FilterChip
          label="Category"
          hasDropdown
          active={filters.main_categories?.length > 0}
          count={filters.main_categories?.length}
          onClick={() => { fetchCategories(); setShowCategoryModal(true); }}
        />
        <FilterChip
          label="Sub Category"
          hasDropdown
          active={filters.sub_categories?.length > 0}
          count={filters.sub_categories?.length}
          onClick={() => { fetchSubCategories(); setShowSubCategoryModal(true); }}
        />

        {/* All Chip */}
        <FilterChip
          label="All"
          active={!hasDropdownFilters}
          onClick={handleAllClick}
        />

        <FilterChip
          label="Price"
          hasDropdown
          active={!!(filters.price_min || filters.price_max)}
          onClick={() => setShowPriceModal(true)}
        />
        <FilterChip
          label="Vendor"
          hasDropdown
          active={filters.vendor?.length > 0}
          count={filters.vendor?.length}
          onClick={() => { fetchVendors(); setShowVendorModal(true); }}
        />
        <FilterChip
          label="State"
          hasDropdown
          active={filters.state?.length > 0}
          count={filters.state?.length}
          onClick={() => { fetchStates(); setShowStateModal(true); }}
        />
      </div>

      {/* Active Filter Chips (removable) */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-primary-400 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-50 transition-colors"
            >
              {chip.label}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          {activeChips.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <CheckboxFilterModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Category Filter"
        options={categories}
        selected={filters.main_categories || []}
        onApply={handleCategoryApply}
        loading={loadingCategories}
      />

      <CheckboxFilterModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        title="Sub Category Filter"
        options={subCategories}
        selected={filters.sub_categories || []}
        onApply={handleSubCategoryApply}
        loading={loadingSubCategories}
      />

      <CheckboxFilterModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        title="Vendor Filter"
        options={vendors}
        selected={filters.vendor || []}
        onApply={handleVendorApply}
        loading={loadingVendors}
      />

      <CheckboxFilterModal
        isOpen={showStateModal}
        onClose={() => setShowStateModal(false)}
        title="State Filter"
        options={states}
        selected={filters.state || []}
        onApply={handleStateApply}
        loading={loadingStates}
      />

      <PriceRangeModal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        onApply={handlePriceApply}
        currentMin={filters.price_min}
        currentMax={filters.price_max}
        absoluteMin={priceRange.min}
        absoluteMax={priceRange.max}
      />
    </div>
  );
};

// Reusable Filter Chip component
const FilterChip = ({ label, active, onClick, hasDropdown, count }) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[40px] ${
        active
          ? 'bg-primary-50 border-primary-500 text-primary-700'
          : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
      {count > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary-600 text-white rounded-full">
          {count}
        </span>
      )}
      {hasDropdown && (
        <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );
};

export default BrowseFilterBar;
