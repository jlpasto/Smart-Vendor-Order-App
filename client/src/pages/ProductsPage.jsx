import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useFilter } from '../context/FilterContext';
import ProductDetailModal from '../components/ProductDetailModal';
import FilterIcon from '../components/FilterIcon';
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

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState(null);

  // Use filter context
  const { globalSearchTerm } = useSearch();
  const { filters } = useFilter();

  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState({});

  // Sorting state
  const [sortField, setSortField] = useState('vendor_name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Infinite scroll hook
  const observerTarget = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMoreProducts,
    rootMargin: '100px'
  });

  // Reset and load products when filters or sort changes
  useEffect(() => {
    resetAndLoadProducts();
  }, [sortField, sortOrder, globalSearchTerm, filters]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const resetAndLoadProducts = useCallback(async () => {
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
  }, [sortField, sortOrder, globalSearchTerm, filters]);

  const fetchProducts = async (currentCursor) => {
    const params = {
      cursor: currentCursor,
      limit: 20,
      sort: sortField,
      order: sortOrder,
      search: globalSearchTerm || undefined,
      ...filters
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

  const handleFilterIconClick = () => {
    setShowFilterModal(true);
  };

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

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedToCart({ ...addedToCart, [product.id]: true });
    setTimeout(() => {
      setAddedToCart({ ...addedToCart, [product.id]: false });
    }, 2000);
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
    const currentIndex = products.findIndex(p => p.id === selectedProduct.id);
    if (currentIndex < products.length - 1) {
      setSelectedProduct(products[currentIndex + 1]);
    }
  };

  const handlePrevProduct = () => {
    const currentIndex = products.findIndex(p => p.id === selectedProduct.id);
    if (currentIndex > 0) {
      setSelectedProduct(products[currentIndex - 1]);
    }
  };

  const handleEdit = (product) => {
    console.log('Edit product:', product);
    alert('Edit functionality coming soon!');
  };

  const handleDelete = async (product) => {
    try {
      await api.delete(`/api/products/${product.id}`);
      // Refresh products list
      resetAndLoadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  // Group products by vendor (memoized for performance)
  const groupedProducts = useMemo(() => {
    const groups = {};
    products.forEach(product => {
      if (!groups[product.vendor_name]) {
        groups[product.vendor_name] = [];
      }
      groups[product.vendor_name].push(product);
    });
    return groups;
  }, [products]);

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
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3">
          {/* Sort Buttons */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <span className="text-sm font-medium text-gray-700 px-2">Sort:</span>

            {/* Product Name Sort */}
            <button
              onClick={() => {
                if (sortField === 'product_name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('product_name');
                  setSortOrder('asc');
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sortField === 'product_name'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={`Sort by Product Name ${sortField === 'product_name' ? (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)') : ''}`}
            >
              Product
              {sortField === 'product_name' && (
                <span className="text-lg">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>

            {/* Vendor Name Sort */}
            <button
              onClick={() => {
                if (sortField === 'vendor_name') {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField('vendor_name');
                  setSortOrder('asc');
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sortField === 'vendor_name'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={`Sort by Vendor Name ${sortField === 'vendor_name' ? (sortOrder === 'asc' ? '(A-Z)' : '(Z-A)') : ''}`}
            >
              Vendor
              {sortField === 'vendor_name' && (
                <span className="text-lg">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>

          <FilterIcon onClick={handleFilterIconClick} />
        </div>
      </div>

      {/* No results */}
      {products.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <p className="text-xl text-gray-600">No products found matching your filters</p>
        </div>
      )}

      {/* Product Grid by Vendor */}
      {Object.entries(groupedProducts).map(([vendor, vendorProducts]) => (
        <div key={vendor} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">{vendor}</h2>
            <span className="text-sm text-gray-500">
              {vendorProducts.length} items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
                      {/* Product ID Badge */}
                      <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
                        #{product.id}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-2 flex-1 flex flex-col">
                      <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-1 min-h-[2rem]">
                        {product.product_name}
                      </h3>

                      <div className="space-y-0.5 text-xs text-gray-600 mb-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unit:</span>
                          <span className="font-semibold">${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Case:</span>
                          <span className="font-semibold">${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">MSRP:</span>
                          <span className="font-semibold">${parseFloat(product.retail_unit_price || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">GM:</span>
                          <span className="font-semibold text-green-600">{parseFloat(product.gm_percent || 0).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={addedToCart[product.id]}
                        className={`w-full py-1.5 rounded-md text-xs font-semibold transition-colors mt-auto ${
                          addedToCart[product.id]
                            ? 'bg-green-500 text-white'
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                    }`}
                        aria-label="Add to cart"
                      >
                        {addedToCart[product.id] ? '✓ Added' : '+ Add to Cart'}
                      </button>
                    </div>
                  </div>
            ))}
          </div>
        </div>
      ))}

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
      {!hasMore && products.length > 0 && (
        <div className="text-center py-12 border-t border-gray-200">
          <p className="text-xl font-semibold text-gray-700">You've reached the end!</p>
          <p className="text-gray-500 mt-2">Showing all {products.length} products</p>
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
        {!hasMore && `All ${products.length} products loaded`}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onNext={
          selectedProduct && products.findIndex(p => p.id === selectedProduct.id) < products.length - 1
            ? handleNextProduct
            : null
        }
        onPrev={
          selectedProduct && products.findIndex(p => p.id === selectedProduct.id) > 0
            ? handlePrevProduct
            : null
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelectField={handleSelectField}
      />

      {/* Filter Detail Panel */}
      <FilterDetailPanel
        field={selectedFilterField}
        isOpen={showFilterPanel}
        onBack={handleBackToFilterModal}
      />
    </div>
  );
};

export default ProductsPage;
