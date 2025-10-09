import { useState, useEffect } from 'react';
import api from '../config/api';
import { useCart } from '../context/CartContext';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showPopular, setShowPopular] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Filter options
  const [vendors, setVendors] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);

  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchFilterOptions();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedVendor, selectedState, selectedCategory, showPopular, showNew]);

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

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
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

    // Popular filter
    if (showPopular) {
      filtered = filtered.filter(p => p.popular);
    }

    // New filter
    if (showNew) {
      filtered = filtered.filter(p => p.new);
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    setAddedToCart({ ...addedToCart, [product.id]: true });
    setTimeout(() => {
      setAddedToCart({ ...addedToCart, [product.id]: false });
    }, 2000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedVendor('');
    setSelectedState('');
    setSelectedCategory('');
    setShowPopular(false);
    setShowNew(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Browse Products</h1>

      {/* Search and Filters */}
      <div className="card mb-8">
        {/* Search Bar */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-lg font-semibold text-gray-700 mb-2">
            Search Products
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, description, or vendor..."
            className="input"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
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
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowPopular(!showPopular)}
              className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                showPopular
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⭐ Popular
            </button>
            <button
              onClick={() => setShowNew(!showNew)}
              className={`px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
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
            className="btn-secondary"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-xl text-gray-700">
          Showing <span className="font-bold">{filteredProducts.length}</span> of{' '}
          <span className="font-bold">{products.length}</span> products
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-2xl text-gray-600">No products found matching your filters</p>
          <button onClick={clearFilters} className="btn-primary mt-6">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="card hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="relative mb-4">
                <img
                  src={product.product_image || 'https://via.placeholder.com/400'}
                  alt={product.product_name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                  {product.popular && (
                    <span className="badge bg-amber-500 text-white">⭐ Popular</span>
                  )}
                  {product.new && (
                    <span className="badge bg-green-500 text-white">🆕 New</span>
                  )}
                </div>
                {/* Favorite Star */}
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-2 right-2 w-12 h-12 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <span className="text-2xl">
                    {favorites.includes(product.id) ? '⭐' : '☆'}
                  </span>
                </button>
              </div>

              {/* Product Info */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.product_name}</h3>
                <p className="text-gray-600 mb-2">{product.product_description}</p>
                <p className="text-sm text-gray-500 mb-1">
                  <strong>Vendor:</strong> {product.vendor_name}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  <strong>Size:</strong> {product.size} | <strong>Case Pack:</strong> {product.case_pack}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  <strong>Category:</strong> {product.category}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-semibold">Case Price:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${parseFloat(product.wholesale_case_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Unit Price:</span>
                  <span className="font-semibold">
                    ${parseFloat(product.wholesale_unit_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-600">GM:</span>
                  <span className="font-semibold text-green-600">
                    {parseFloat(product.gm_percent).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stock Level */}
              <p className="text-sm mb-4">
                <span className={product.stock_level > 100 ? 'text-green-600' : 'text-amber-600'}>
                  <strong>In Stock:</strong> {product.stock_level} units
                </span>
              </p>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={addedToCart[product.id]}
                className={`w-full ${addedToCart[product.id] ? 'bg-green-500' : ''} btn-primary`}
              >
                {addedToCart[product.id] ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
