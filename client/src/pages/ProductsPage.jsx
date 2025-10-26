import { useState, useEffect } from 'react';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import ProductDetailModal from '../components/ProductDetailModal';
import Pagination from '../components/Pagination';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const { globalSearchTerm } = useSearch(); // Use global search from header
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFeatured, setShowFeatured] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Filter options
  const [vendors, setVendors] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);

  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  useEffect(() => {
    fetchProducts();
    fetchFilterOptions();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, globalSearchTerm, selectedVendor, selectedState, selectedCategory, showFeatured, showSeasonal, showNew]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [vendorsRes, statesRes, categoriesRes] = await Promise.all([
        api.get('/api/products/filters/vendors'),
        api.get('/api/products/filters/states'),
        api.get('/api/products/filters/categories')
      ]);
      setVendors(vendorsRes.data);
      setStates(statesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

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

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter (from global search in header)
    if (globalSearchTerm) {
      const term = globalSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(term) ||
        p.product_description?.toLowerCase().includes(term) ||
        p.vendor_name.toLowerCase().includes(term)
      );
    }

    // Vendor filter
    if (selectedVendor) {
      filtered = filtered.filter(p => p.vendor_name === selectedVendor);
    }

    // State filter
    if (selectedState) {
      filtered = filtered.filter(p => p.state === selectedState);
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Featured filter
    if (showFeatured) {
      filtered = filtered.filter(p => p.popular); // Still using 'popular' field in DB
    }

    // Seasonal filter
    if (showSeasonal) {
      filtered = filtered.filter(p => p.seasonal);
    }

    // New filter
    if (showNew) {
      filtered = filtered.filter(p => p.new);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedToCart({ ...addedToCart, [product.id]: true });
    setTimeout(() => {
      setAddedToCart({ ...addedToCart, [product.id]: false });
    }, 2000);
  };

  const clearFilters = () => {
    setSelectedVendor('');
    setSelectedState('');
    setSelectedCategory('');
    setShowFeatured(false);
    setShowSeasonal(false);
    setShowNew(false);
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

  const handleEdit = (product) => {
    // TODO: Implement edit functionality
    console.log('Edit product:', product);
    alert('Edit functionality coming soon!');
  };

  const handleDelete = async (product) => {
    try {
      await api.delete(`/api/products/${product.id}`);
      // Refresh products list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

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
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        {/* Filter Dropdowns */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="vendor" className="block text-lg font-semibold text-gray-700 mb-2">
              Vendor
            </label>
            <select
              id="vendor"
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="select"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="state" className="block text-lg font-semibold text-gray-700 mb-2">
              State
            </label>
            <select
              id="state"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="select"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-lg font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFeatured(!showFeatured)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                showFeatured
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⭐ Featured
            </button>
            <button
              onClick={() => setShowSeasonal(!showSeasonal)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                showSeasonal
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🍂 Seasonal
            </button>
            <button
              onClick={() => setShowNew(!showNew)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                showNew
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🆕 New
            </button>
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Category Header */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <p className="text-xl text-gray-600">No products found matching your filters</p>
          <button onClick={clearFilters} className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Group products by vendor */}
          {Array.from(new Set(currentProducts.map(p => p.vendor_name))).map(vendor => (
            <div key={vendor} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">{vendor}</h2>
                <span className="text-sm text-gray-500">
                  {currentProducts.filter(p => p.vendor_name === vendor).length}
                </span>
              </div>

              {/* Product List */}
              <div className="bg-white rounded-lg shadow-sm divide-y">
                {currentProducts.filter(p => p.vendor_name === vendor).map(product => (
                  <div key={product.id} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                    {/* Product Image - Clickable */}
                    <div
                      className="relative flex-shrink-0 w-16 h-16 mr-4 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={product.product_image || 'https://via.placeholder.com/80'}
                        alt={product.product_name}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>

                    {/* Product Details - Clickable */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <h3 className="font-semibold text-gray-900 hover:text-primary-600">
                        {product.product_name.length > 230
                          ? product.product_name.substring(0, 230) + '...'
                          : product.product_name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Unit Price = ${parseFloat(product.wholesale_unit_price || 0).toFixed(2)}</span>
                        <span>|</span>
                        <span>Case Price = ${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</span>
                        <span>|</span>
                        <span>MSRP = ${parseFloat(product.retail_unit_price || 0).toFixed(2)}</span>
                        <span>|</span>
                        <span className="text-green-600">GM: {parseFloat(product.gm_percent || 0).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Product ID - Clickable */}
                    <div
                      className="flex-shrink-0 text-right mr-4 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <span className="text-xs text-gray-500">ID #{product.id}</span>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={addedToCart[product.id]}
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        addedToCart[product.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                      aria-label="Add to cart"
                    >
                      {addedToCart[product.id] ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xl font-bold">+</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ProductsPage;
