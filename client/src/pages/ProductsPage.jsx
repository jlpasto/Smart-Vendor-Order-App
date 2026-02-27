import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useFilter } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import ProductDetailModal from '../components/ProductDetailModal';
import AddToOrderModal from '../components/AddToOrderModal';
import BrowseFilterBar from '../components/BrowseFilterBar';
import FilterModal from '../components/FilterModal';
import FilterDetailPanel from '../components/FilterDetailPanel';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const ProductsPage = () => {
  // State for accumulated products from infinite scroll
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add to Order Modal state
  const [showAddToOrderModal, setShowAddToOrderModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);

  // Advanced filter panel state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState(null);

  // Vendor info modal state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendorInfo, setSelectedVendorInfo] = useState(null);

  // Use filter context
  const { globalSearchTerm } = useSearch();
  const { filters } = useFilter();
  const { isAdmin } = useAuth();

  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState({});

  // Sorting state - default to A-Z
  const [sortField, setSortField] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Track filter changes to auto-reset sort to A-Z
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev !== filters) {
      setSortField('product_name');
      setSortOrder('asc');
      prevFiltersRef.current = filters;
    }
  }, [filters]);

  // Infinite scroll hook
  const observerTarget = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMoreProducts,
    rootMargin: '100px'
  });

  // Reset and load products when filters, sort, or favorites mode changes
  useEffect(() => {
    resetAndLoadProducts();
  }, [sortField, sortOrder, globalSearchTerm, filters, showFavoritesOnly]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const resetAndLoadProducts = useCallback(async () => {
    // In favorites mode with no favorites, skip API call
    if (showFavoritesOnly && favorites.length === 0) {
      setProducts([]);
      setCursor(null);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setProducts([]);
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    setError('');

    try {
      await fetchProducts(null);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder, globalSearchTerm, filters, showFavoritesOnly, favorites]);

  const fetchProducts = async (currentCursor) => {
    // Serialize array filters as JSON strings
    const serializedFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        serializedFilters[key] = JSON.stringify(value);
      } else if (value !== '' && value !== null && value !== undefined && value !== false) {
        serializedFilters[key] = value;
      }
    });

    // Add favorite IDs filter when in favorites mode
    if (showFavoritesOnly && favorites.length > 0) {
      serializedFilters.favorite_ids = JSON.stringify(favorites);
    }

    const params = {
      cursor: currentCursor,
      limit: 20,
      sort: sortField,
      order: sortOrder,
      search: globalSearchTerm || undefined,
      ...serializedFilters
    };

    const response = await api.get('/api/products', { params });

    // Handle cursor pagination response
    if (response.data.items) {
      const { items, pagination } = response.data;

      setProducts(prev => currentCursor ? [...prev, ...items] : items);
      setCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
    } else {
      // Backward compatibility: if API returns array (old format)
      setProducts(response.data);
      setHasMore(false);
    }

    return response.data;
  };

  async function loadMoreProducts() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError('');

    try {
      await fetchProducts(cursor);
    } catch (err) {
      setError('Failed to load more products');
    } finally {
      setLoadingMore(false);
    }
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (productId) => {
    let newFavorites;
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter(id => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleSortChange = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleToggleFavorites = () => {
    setShowFavoritesOnly(prev => !prev);
  };

  // Advanced filter handlers
  const handleSelectField = (field) => {
    setSelectedFilterField(field);
    setShowFilterModal(false);
    setShowFilterPanel(true);
  };

  const handleBackToFilterModal = () => {
    setShowFilterPanel(false);
    setShowFilterModal(true);
    setSelectedFilterField(null);
  };

  const handleAddToCart = (product, quantity = 1, pricingMode = 'case', unavailableAction = 'curate', replacementProductId = null, replacementProductName = null) => {
    addToCart(product, quantity, pricingMode, unavailableAction, replacementProductId, replacementProductName);
    setAddedToCart({ ...addedToCart, [product.id]: true });
    setTimeout(() => {
      setAddedToCart({ ...addedToCart, [product.id]: false });
    }, 2000);
  };

  const handleOpenAddToOrderModal = (product) => {
    setProductToAdd(product);
    setShowAddToOrderModal(true);
  };

  const handleCloseAddToOrderModal = () => {
    setShowAddToOrderModal(false);
    setTimeout(() => setProductToAdd(null), 300); // Wait for animation
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300); // Wait for animation
  };

  const handleNextProduct = () => {
    const currentIndex = filteredProducts.findIndex(p => p.id === selectedProduct.id);
    if (currentIndex < filteredProducts.length - 1) {
      setSelectedProduct(filteredProducts[currentIndex + 1]);
    }
  };

  const handlePrevProduct = () => {
    const currentIndex = filteredProducts.findIndex(p => p.id === selectedProduct.id);
    if (currentIndex > 0) {
      setSelectedProduct(filteredProducts[currentIndex - 1]);
    }
  };

  // filteredProducts - now favorites are handled server-side
  const filteredProducts = products;

  // Group products by vendor (memoized for performance)
  // Only group when sorting by vendor_name, otherwise return null for flat list
  const groupedProducts = useMemo(() => {
    if (sortField === 'vendor_name') {
      const groups = {};
      filteredProducts.forEach(product => {
        if (!groups[product.vendor_name]) {
          groups[product.vendor_name] = [];
        }
        groups[product.vendor_name].push(product);
      });
      return groups;
    }
    // Return null for flat list when not sorting by vendor
    return null;
  }, [filteredProducts, sortField]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <p className="font-semibold text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content Area */}
      <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Products</h1>
            {/* Advanced Filter Icon */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Advanced filters"
              aria-label="Advanced filters"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Browse Filter Bar */}
          <BrowseFilterBar
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            showFavorites={showFavoritesOnly}
            onToggleFavorites={!isAdmin() ? handleToggleFavorites : undefined}
            favoriteCount={favorites.length}
          />

      {/* No results */}
      {filteredProducts.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <p className="text-xl text-gray-600">
            {showFavoritesOnly ? 'No favorite products yet. Tap the heart on products to add them.' : 'No products found matching your filters'}
          </p>
        </div>
      )}

      {/* Product Grid by Vendor - Only when sorting by vendor */}
      {groupedProducts && Object.entries(groupedProducts).map(([vendor, vendorProducts]) => {
        const firstProduct = vendorProducts[0];
        const hasVendorInfo = firstProduct?.vendor_about || firstProduct?.vendor_story;
        return (
          <div key={vendor} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-800">{vendor}</h2>
                {hasVendorInfo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVendorInfo({
                        name: vendor,
                        vendor_connect_id: firstProduct.vendor_connect_id,
                        logo_url: firstProduct.vendor_logo,
                        website_url: firstProduct.vendor_website,
                        about: firstProduct.vendor_about,
                        story: firstProduct.vendor_story
                      });
                      setShowVendorModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2
                               bg-primary-50 hover:bg-primary-100
                               border-2 border-primary-600
                               rounded-lg transition-all duration-200
                               focus:outline-none focus:ring-4 focus:ring-primary-300
                               min-h-[44px]
                               shadow-sm hover:shadow-md"
                    aria-label={`View ${vendor} vendor information`}
                    title="View vendor information"
                    type="button"
                  >
                    <svg
                      className="w-5 h-5 text-primary-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="text-sm font-semibold text-primary-900">
                      About
                    </span>
                  </button>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {vendorProducts.length} items
              </span>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {vendorProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Product Image */}
                    <div className="relative w-full pt-[100%] bg-gray-100">
                      <img
                        src={product.product_image || 'https://via.placeholder.com/200'}
                        alt={product.product_name}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      {/* Favorite Button - Only for Buyers */}
                      {!isAdmin() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-2 left-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md transition-all hover:scale-110"
                          aria-label={favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg
                            className={`w-5 h-5 ${favorites.includes(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                            fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-2 flex-1 flex flex-col">
                      <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1 min-h-[2rem]">
                        {product.product_name}
                      </h3>

                      <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Case:</span>
                          <span className="font-semibold">${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unit:</span>
                          <span className="font-semibold">${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">MSRP:</span>
                          <span className="font-semibold">${parseFloat(product.retail_unit_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">GM:</span>
                          <span className="font-semibold text-green-600">{parseFloat(product.retail_unit_price) > 0 ? (((parseFloat(product.retail_unit_price) - parseFloat(product.wholesale_unit_price || 0)) / parseFloat(product.retail_unit_price)) * 100).toFixed(1) : '0.0'}%</span>
                        </div>
                      </div>

                      {/* Add Button - Hidden for admins */}
                      {!isAdmin() && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddToOrderModal(product);
                          }}
                          disabled={addedToCart[product.id]}
                          className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors mt-auto ${
                            addedToCart[product.id]
                              ? 'bg-green-500 text-white'
                              : 'bg-primary-600 hover:bg-primary-700 text-white'
                          }`}
                          aria-label="Add to order"
                        >
                          {addedToCart[product.id] ? '✓ Added' : '+ Add to Order'}
                        </button>
                      )}
                    </div>
                  </div>
            ))}
          </div>
        </div>
        );
      })}

      {/* Flat Product Grid - When sorting by product or other fields */}
      {!groupedProducts && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col"
              onClick={() => handleProductClick(product)}
            >
              {/* Product Image */}
              <div className="relative w-full pt-[100%] bg-gray-100">
                <img
                  src={product.product_image || 'https://via.placeholder.com/200'}
                  alt={product.product_name}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
                {/* Favorite Button - Only for Buyers */}
                {!isAdmin() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    className="absolute top-2 left-2 p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-md transition-all hover:scale-110"
                    aria-label={favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg
                      className={`w-5 h-5 ${favorites.includes(product.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                      fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Product Details */}
              <div className="p-2 flex-1 flex flex-col">
                <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1 min-h-[2rem]">
                  {product.product_name}
                </h3>

                {/* Vendor Name - Show in flat view */}
                <p className="text-xs text-gray-500 mb-1">
                  {product.vendor_name}
                </p>

                <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Case:</span>
                    <span className="font-semibold">${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit:</span>
                    <span className="font-semibold">${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">MSRP:</span>
                    <span className="font-semibold">${parseFloat(product.retail_unit_price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GM:</span>
                    <span className="font-semibold text-green-600">{parseFloat(product.retail_unit_price) > 0 ? (((parseFloat(product.retail_unit_price) - parseFloat(product.wholesale_unit_price || 0)) / parseFloat(product.retail_unit_price)) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                </div>

                {/* Add Button - Hidden for admins */}
                {!isAdmin() && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAddToOrderModal(product);
                    }}
                    disabled={addedToCart[product.id]}
                    className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors mt-auto ${
                      addedToCart[product.id]
                        ? 'bg-green-500 text-white'
                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                    aria-label="Add to order"
                  >
                    {addedToCart[product.id] ? '✓ Added' : '+ Add to Order'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading more products...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="text-red-600 text-center">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={loadMoreProducts}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Intersection Observer Target */}
      {hasMore && !loadingMore && !error && (
        <div
          ref={observerTarget}
          className="h-20 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="text-gray-400 text-sm">Scroll for more</div>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && filteredProducts.length > 0 && (
        <div className="text-center py-12 border-t border-gray-200">
          <p className="text-xl font-semibold text-gray-700">You've reached the end!</p>
          <p className="text-gray-500 mt-2">Showing all {filteredProducts.length} products</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Top ↑
          </button>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loadingMore && 'Loading more products'}
        {!hasMore && `All ${filteredProducts.length} products loaded`}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNext={
          selectedProduct && filteredProducts.findIndex(p => p.id === selectedProduct.id) < filteredProducts.length - 1
            ? handleNextProduct
            : null
        }
        onPrev={
          selectedProduct && filteredProducts.findIndex(p => p.id === selectedProduct.id) > 0
            ? handlePrevProduct
            : null
        }
      />

      {/* Vendor Info Modal */}
      {showVendorModal && selectedVendorInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8 my-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Vendor Profile</h2>
              <button
                onClick={() => setShowVendorModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {/* Header Section with Logo and Basic Info */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={selectedVendorInfo.logo_url || 'https://via.placeholder.com/150/CCCCCC/666666?text=No+Logo'}
                  alt={selectedVendorInfo.name}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedVendorInfo.name}</h3>
                  {selectedVendorInfo.website_url && (
                    <a
                      href={selectedVendorInfo.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {selectedVendorInfo.website_url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-gray-500">ID: </span>
                    <span className="text-sm text-gray-700">{selectedVendorInfo.vendor_connect_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* About Section */}
              {selectedVendorInfo.about && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedVendorInfo.about}</p>
                </div>
              )}

              {/* Story Section */}
              {selectedVendorInfo.story && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Story</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedVendorInfo.story}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowVendorModal(false)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Advanced Filter Modal (slide-out panel) */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelectField={handleSelectField}
      />
      <FilterDetailPanel
        field={selectedFilterField}
        isOpen={showFilterPanel}
        onBack={handleBackToFilterModal}
      />

      {/* Add to Order Modal */}
      <AddToOrderModal
        product={productToAdd}
        isOpen={showAddToOrderModal}
        onClose={handleCloseAddToOrderModal}
        onAddToOrder={handleAddToCart}
      />
    </>
  );
};

export default ProductsPage;
