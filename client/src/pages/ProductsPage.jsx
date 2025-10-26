import { useState, useEffect } from 'react';
import api from '../config/api';
import { useCart } from '../context/CartContext';
import { useSearch } from '../context/SearchContext';
import { useFilter } from '../context/FilterContext';
import ProductDetailModal from '../components/ProductDetailModal';
import Pagination from '../components/Pagination';
import FilterIcon from '../components/FilterIcon';
import FilterModal from '../components/FilterModal';
import FilterDetailPanel from '../components/FilterDetailPanel';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  useEffect(() => {
    fetchProducts();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, globalSearchTerm, filters]);

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

    // Global search filter
    if (globalSearchTerm) {
      const term = globalSearchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(term) ||
        p.product_description?.toLowerCase().includes(term) ||
        p.vendor_name.toLowerCase().includes(term)
      );
    }

    // Text filters
    if (filters.id) {
      filtered = filtered.filter(p => p.id === parseInt(filters.id));
    }
    if (filters.vendor_connect_id) {
      filtered = filtered.filter(p => p.vendor_connect_id === filters.vendor_connect_id);
    }
    if (filters.product_name) {
      filtered = filtered.filter(p => p.product_name?.toLowerCase().includes(filters.product_name.toLowerCase()));
    }
    if (filters.size) {
      filtered = filtered.filter(p => p.size?.toLowerCase().includes(filters.size.toLowerCase()));
    }
    if (filters.upc) {
      filtered = filtered.filter(p => p.upc === filters.upc);
    }
    if (filters.shelf_life) {
      filtered = filtered.filter(p => p.shelf_life?.toLowerCase().includes(filters.shelf_life.toLowerCase()));
    }
    if (filters.delivery_info) {
      filtered = filtered.filter(p => p.delivery_info?.toLowerCase().includes(filters.delivery_info.toLowerCase()));
    }
    if (filters.notes) {
      filtered = filtered.filter(p => p.notes?.toLowerCase().includes(filters.notes.toLowerCase()));
    }

    // Dropdown filters
    if (filters.vendor) {
      filtered = filtered.filter(p => p.vendor_name === filters.vendor);
    }
    if (filters.state) {
      filtered = filtered.filter(p => p.state === filters.state);
    }
    if (filters.cuisine_type) {
      filtered = filtered.filter(p => p.cuisine_type === filters.cuisine_type);
    }
    if (filters.seasonal_featured) {
      filtered = filtered.filter(p => p.seasonal_featured === filters.seasonal_featured);
    }

    // Multi-select filters
    if (filters.main_categories && filters.main_categories.length > 0) {
      filtered = filtered.filter(p => filters.main_categories.includes(p.main_category));
    }
    if (filters.sub_categories && filters.sub_categories.length > 0) {
      filtered = filtered.filter(p => filters.sub_categories.includes(p.sub_category));
    }
    if (filters.allergens && filters.allergens.length > 0) {
      filtered = filtered.filter(p => {
        const productAllergens = p.allergens?.split(',').map(a => a.trim()) || [];
        return filters.allergens.some(allergen => productAllergens.includes(allergen));
      });
    }
    if (filters.dietary_preferences && filters.dietary_preferences.length > 0) {
      filtered = filtered.filter(p => {
        const productPrefs = p.dietary_preferences?.split(',').map(d => d.trim()) || [];
        return filters.dietary_preferences.some(pref => productPrefs.includes(pref));
      });
    }

    // Range filters
    if (filters.case_pack_min) {
      filtered = filtered.filter(p => parseFloat(p.case_pack) >= parseFloat(filters.case_pack_min));
    }
    if (filters.case_pack_max) {
      filtered = filtered.filter(p => parseFloat(p.case_pack) <= parseFloat(filters.case_pack_max));
    }
    if (filters.price_min) {
      filtered = filtered.filter(p => parseFloat(p.wholesale_case_price) >= parseFloat(filters.price_min));
    }
    if (filters.price_max) {
      filtered = filtered.filter(p => parseFloat(p.wholesale_case_price) <= parseFloat(filters.price_max));
    }
    if (filters.unit_price_min) {
      filtered = filtered.filter(p => parseFloat(p.wholesale_unit_price) >= parseFloat(filters.unit_price_min));
    }
    if (filters.unit_price_max) {
      filtered = filtered.filter(p => parseFloat(p.wholesale_unit_price) <= parseFloat(filters.unit_price_max));
    }
    if (filters.msrp_min) {
      filtered = filtered.filter(p => parseFloat(p.retail_unit_price) >= parseFloat(filters.msrp_min));
    }
    if (filters.msrp_max) {
      filtered = filtered.filter(p => parseFloat(p.retail_unit_price) <= parseFloat(filters.msrp_max));
    }
    if (filters.gm_min) {
      filtered = filtered.filter(p => parseFloat(p.gm_percent) >= parseFloat(filters.gm_min));
    }
    if (filters.gm_max) {
      filtered = filtered.filter(p => parseFloat(p.gm_percent) <= parseFloat(filters.gm_max));
    }
    if (filters.case_minimum_min) {
      filtered = filtered.filter(p => parseFloat(p.case_minimum) >= parseFloat(filters.case_minimum_min));
    }
    if (filters.case_minimum_max) {
      filtered = filtered.filter(p => parseFloat(p.case_minimum) <= parseFloat(filters.case_minimum_max));
    }

    // Boolean filters
    if (filters.popular) {
      filtered = filtered.filter(p => p.popular);
    }
    if (filters.seasonal) {
      filtered = filtered.filter(p => p.seasonal);
    }
    if (filters.new) {
      filtered = filtered.filter(p => p.new);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <FilterIcon onClick={handleFilterIconClick} />
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
