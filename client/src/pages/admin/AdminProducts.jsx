import { useState, useEffect } from 'react';
import api from '../../config/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Pagination from '../../components/Pagination';
import { useSearch } from '../../context/SearchContext';
import { useFilter } from '../../context/FilterContext';
import FilterIcon from '../../components/FilterIcon';
import FilterModal from '../../components/FilterModal';
import FilterDetailPanel from '../../components/FilterDetailPanel';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedFilterField, setSelectedFilterField] = useState(null);

  // Use global search from context
  const { globalSearchTerm } = useSearch();
  const { filters } = useFilter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  // Bulk delete state
  const [selectedProducts, setSelectedProducts] = useState([]); // Array of product IDs
  const [selectAllPages, setSelectAllPages] = useState(false); // Whether "Select All Pages" is active
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState('vendor_name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchProducts();
  }, [sortField, sortOrder]);

  // Reset to first page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [globalSearchTerm, filters]);

  const fetchProducts = async () => {
    try {
      const params = {
        sort: sortField,
        order: sortOrder
      };
      const response = await api.get('/api/products', { params });
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      product_connect_id: '',
      vendor_name: '',
      state: '',
      product_name: '',
      product_description: '',
      size: '',
      case_pack: '',
      upc: '',
      wholesale_case_price: '',
      wholesale_unit_price: '',
      retail_unit_price: '',
      order_qty: 0,
      stock_level: 0,
      product_image: '',
      popular: false,
      seasonal: false,
      new: false,
      category: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({});
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingProduct) {
        // Update existing product
        await api.put(`/api/products/${editingProduct.id}`, formData);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await api.post('/api/products', formData);
        alert('Product created successfully!');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      alert('Error saving product: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/api/products/${productId}`);
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        alert('Error deleting product: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  // Handle individual checkbox toggle
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // Unselect
        return prev.filter(id => id !== productId);
      } else {
        // Select
        return [...prev, productId];
      }
    });
    // If manually selecting/deselecting, turn off "Select All Pages"
    setSelectAllPages(false);
  };

  // Handle "Select All on This Page"
  const handleSelectAllCurrentPage = () => {
    const allCurrentIds = currentProducts.map(p => p.id);
    const allSelected = allCurrentIds.every(id => selectedProducts.includes(id));

    if (allSelected) {
      // Deselect all on current page
      setSelectedProducts(prev => prev.filter(id => !allCurrentIds.includes(id)));
    } else {
      // Select all on current page
      const newSelection = [...new Set([...selectedProducts, ...allCurrentIds])];
      setSelectedProducts(newSelection);
    }
    setSelectAllPages(false);
  };

  // Handle "Select All Pages"
  const handleSelectAllPages = async () => {
    if (selectAllPages) {
      // Deselect all
      setSelectedProducts([]);
      setSelectAllPages(false);
    } else {
      try {
        // Fetch all product IDs with current filters
        const params = {};
        if (globalSearchTerm) params.search = globalSearchTerm;

        // Add all active filters
        Object.keys(filters).forEach(key => {
          const value = filters[key];
          if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            params[key] = Array.isArray(value) ? JSON.stringify(value) : value;
          }
        });

        const response = await api.get('/api/products/ids', { params });
        setSelectedProducts(response.data.productIds);
        setSelectAllPages(true);
      } catch (error) {
        console.error('Error selecting all products:', error);
        alert('Error selecting all products');
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to delete');
      return;
    }

    const confirmMessage = selectAllPages
      ? `Are you sure you want to delete ALL ${selectedProducts.length} products (across all pages)? This action cannot be undone.`
      : `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const response = await api.post('/api/products/bulk-delete', {
        productIds: selectedProducts
      });

      alert(`✅ ${response.data.deleted} product(s) deleted successfully!`);

      // Clear selection and refresh
      setSelectedProducts([]);
      setSelectAllPages(false);
      await fetchProducts();
    } catch (error) {
      alert('Error deleting products: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clear selection when page changes or filters change
  useEffect(() => {
    if (!selectAllPages) {
      setSelectedProducts([]);
    }
  }, [currentPage]);

  useEffect(() => {
    setSelectedProducts([]);
    setSelectAllPages(false);
  }, [globalSearchTerm, filters]);

  const openImportModal = () => {
    setShowImportModal(true);
    setImportFile(null);
    setImportResults(null);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResults(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (validTypes.includes(file.type) || ['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        setImportFile(file);
        setImportResults(null);
      } else {
        alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
        e.target.value = '';
      }
    }
  };

  const parseFileData = (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (error) => {
            reject(error);
          }
        });
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        // Parse Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      // Parse the file
      const parsedData = await parseFileData(importFile);

      if (!parsedData || parsedData.length === 0) {
        alert('No data found in the file');
        setImporting(false);
        return;
      }

      // Send to backend API for bulk import
      const response = await api.post('/api/products/bulk-import', {
        products: parsedData
      });

      setImportResults(response.data);
      alert(`Import completed!\n${response.data.created} products created\n${response.data.updated} products updated\n${response.data.failed} products failed`);

      // Refresh products list
      fetchProducts();

      // Keep modal open to show results
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing products: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'ID': '',
        'Product Connect ID': 10001,
        'Vendor Connect ID': '',
        'Vendor Name': 'Example Vendor',
        'Product Name': 'Sample Product',
        'Main Category': 'Snacks',
        'Sub-Category': 'Chips',
        'Allergens': 'Dairy-Free, Gluten-Free',
        'Dietary Preferences': 'Paleo, Low-Fat',
        'Cuisine Type': 'American',
        'Seasonal and Featured': 'Featured',
        'Size': '1.4 oz',
        'Case Pack': 36,
        'Wholesale Case Price': '$68.20',
        'Wholesale Unit Price': '$1.89',
        'Retail Unit Price (MSRP)': '$2.99',
        'GM%': '36.79%',
        'Case Minimum': 1,
        'Shelf Life': '7 months from manufacture date',
        'UPC': '123456789012',
        'State': 'MD',
        'Delivery Info': 'Ships within 2-3 business days',
        'Notes': 'Sample product notes',
        'Image': 'https://example.com/image.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product_import_template.xlsx');
  };

  const exportProducts = () => {
    // Use filtered products for export
    const productsToExport = filteredProducts.map(product => ({
      'ID': product.id || '',
      'Product Connect ID': product.product_connect_id || '',
      'Vendor Connect ID': product.vendor_connect_id || '',
      'Vendor Name': product.vendor_name || '',
      'Product Name': product.product_name || '',
      'Main Category': product.main_category || '',
      'Sub-Category': product.sub_category || '',
      'Allergens': product.allergens || '',
      'Dietary Preferences': product.dietary_preferences || '',
      'Cuisine Type': product.cuisine_type || '',
      'Seasonal and Featured': product.seasonal_and_featured || '',
      'Size': product.size || '',
      'Case Pack': product.case_pack || '',
      'Wholesale Case Price': product.wholesale_case_price || '',
      'Wholesale Unit Price': product.wholesale_unit_price || '',
      'Retail Unit Price (MSRP)': product.retail_unit_price || '',
      'GM%': product.gm_percent ? `${product.gm_percent}%` : '',
      'Case Minimum': product.case_minimum || '',
      'Shelf Life': product.shelf_life || '',
      'UPC': product.upc || '',
      'State': product.state || '',
      'Delivery Info': product.delivery_info || '',
      'Notes': product.notes || '',
      'Image': product.product_image || ''
    }));

    const ws = XLSX.utils.json_to_sheet(productsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products_export_${timestamp}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  // Filter handlers
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

  // Filter products based on global search term and advanced filters
  const filteredProducts = products.filter(product => {
    // Global search filter
    if (globalSearchTerm) {
      const searchLower = globalSearchTerm.toLowerCase();
      const matchesSearch = (
        product.product_name?.toLowerCase().includes(searchLower) ||
        product.vendor_name?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.product_description?.toLowerCase().includes(searchLower) ||
        product.size?.toLowerCase().includes(searchLower) ||
        product.upc?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }

    // Text filters
    if (filters.id && product.id !== parseInt(filters.id)) return false;
    if (filters.vendor_connect_id && product.vendor_connect_id !== filters.vendor_connect_id) return false;
    if (filters.product_name && !product.product_name?.toLowerCase().includes(filters.product_name.toLowerCase())) return false;
    if (filters.size && !product.size?.toLowerCase().includes(filters.size.toLowerCase())) return false;
    if (filters.upc && product.upc !== filters.upc) return false;
    if (filters.shelf_life && !product.shelf_life?.toLowerCase().includes(filters.shelf_life.toLowerCase())) return false;
    if (filters.delivery_info && !product.delivery_info?.toLowerCase().includes(filters.delivery_info.toLowerCase())) return false;
    if (filters.notes && !product.notes?.toLowerCase().includes(filters.notes.toLowerCase())) return false;

    // Multi-select filters
    if (filters.vendor?.length > 0 && !filters.vendor.includes(product.vendor_name)) return false;
    if (filters.main_categories?.length > 0 && !filters.main_categories.includes(product.main_category)) return false;
    if (filters.sub_categories?.length > 0 && !filters.sub_categories.includes(product.sub_category)) return false;

    // Dropdown filters
    if (filters.state && product.state !== filters.state) return false;
    if (filters.cuisine_type && product.cuisine_type !== filters.cuisine_type) return false;
    if (filters.seasonal_featured && product.seasonal_featured !== filters.seasonal_featured) return false;

    if (filters.allergens?.length > 0) {
      const productAllergens = product.allergens?.split(',').map(a => a.trim()) || [];
      if (!filters.allergens.some(allergen => productAllergens.includes(allergen))) return false;
    }

    if (filters.dietary_preferences?.length > 0) {
      const productPrefs = product.dietary_preferences?.split(',').map(d => d.trim()) || [];
      if (!filters.dietary_preferences.some(pref => productPrefs.includes(pref))) return false;
    }

    // Range filters
    if (filters.case_pack_min && parseFloat(product.case_pack) < parseFloat(filters.case_pack_min)) return false;
    if (filters.case_pack_max && parseFloat(product.case_pack) > parseFloat(filters.case_pack_max)) return false;
    if (filters.price_min && parseFloat(product.wholesale_case_price) < parseFloat(filters.price_min)) return false;
    if (filters.price_max && parseFloat(product.wholesale_case_price) > parseFloat(filters.price_max)) return false;
    if (filters.unit_price_min && parseFloat(product.wholesale_unit_price) < parseFloat(filters.unit_price_min)) return false;
    if (filters.unit_price_max && parseFloat(product.wholesale_unit_price) > parseFloat(filters.unit_price_max)) return false;
    if (filters.msrp_min && parseFloat(product.retail_unit_price) < parseFloat(filters.msrp_min)) return false;
    if (filters.msrp_max && parseFloat(product.retail_unit_price) > parseFloat(filters.msrp_max)) return false;
    if (filters.gm_min && parseFloat(product.gm_percent) < parseFloat(filters.gm_min)) return false;
    if (filters.gm_max && parseFloat(product.gm_percent) > parseFloat(filters.gm_max)) return false;
    if (filters.case_minimum_min && parseFloat(product.case_minimum) < parseFloat(filters.case_minimum_min)) return false;
    if (filters.case_minimum_max && parseFloat(product.case_minimum) > parseFloat(filters.case_minimum_max)) return false;

    // Boolean filters
    if (filters.popular && !product.popular) return false;
    if (filters.seasonal && !product.seasonal) return false;
    if (filters.new && !product.new) return false;

    return true;
  });

  // Calculate pagination using filtered products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title mb-0">Manage Products</h1>
        <div className="flex gap-3 items-center">
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
          <button onClick={openImportModal} className="btn-secondary">
            📥 Import Products
          </button>
          <button
            onClick={exportProducts}
            className="btn-secondary"
            title={`Export ${filteredProducts.length} product(s) to Excel`}
          >
            📤 Export Products ({filteredProducts.length})
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            + Add New Product
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-blue-900 font-semibold text-base">
              {selectAllPages
                ? `All ${selectedProducts.length} products selected (across all pages)`
                : `${selectedProducts.length} product(s) selected`}
            </span>
            <button
              onClick={() => {
                setSelectedProducts([]);
                setSelectAllPages(false);
              }}
              className="text-blue-700 hover:text-blue-900 underline text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {bulkDeleting ? 'Deleting...' : `🗑️ Delete ${selectedProducts.length} Product(s)`}
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="py-3 px-4">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleSelectAllPages}
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      selectAllPages
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={selectAllPages ? 'Deselect all pages' : 'Select all pages'}
                  >
                    {selectAllPages ? 'All' : 'All Pages'}
                  </button>
                  <input
                    type="checkbox"
                    checked={currentProducts.length > 0 && currentProducts.every(p => selectedProducts.includes(p.id))}
                    onChange={handleSelectAllCurrentPage}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    title="Select all on this page"
                  />
                </div>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentProducts.map(product => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <img
                    src={product.product_image || 'https://via.placeholder.com/60'}
                    alt={product.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="py-3 px-4">
                  <p className="font-semibold">{product.product_name}</p>
                  <p className="text-sm text-gray-600">{product.size}</p>
                </td>
                <td className="py-3 px-4">{product.vendor_name}</td>
                <td className="py-3 px-4">{product.main_category || product.category || '-'}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold">${parseFloat(product.wholesale_case_price || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">GM: {parseFloat(product.gm_percent || 0).toFixed(1)}%</p>
                </td>
                <td className="py-3 px-4">
                  <span className={product.stock_level > 100 ? 'text-green-600' : 'text-amber-600'}>
                    {product.stock_level}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.product_name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8 my-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Product Connect ID</label>
                <input
                  type="number"
                  value={formData.product_connect_id || ''}
                  onChange={(e) => handleInputChange('product_connect_id', e.target.value)}
                  className="input"
                  placeholder="e.g., 10001"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Vendor Connect ID</label>
                <input
                  type="text"
                  value={formData.vendor_connect_id || ''}
                  onChange={(e) => handleInputChange('vendor_connect_id', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.vendor_name || ''}
                  onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.product_name || ''}
                  onChange={(e) => handleInputChange('product_name', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Main Category</label>
                <input
                  type="text"
                  value={formData.main_category || ''}
                  onChange={(e) => handleInputChange('main_category', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Sub-Category</label>
                <input
                  type="text"
                  value={formData.sub_category || ''}
                  onChange={(e) => handleInputChange('sub_category', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Allergens</label>
                <input
                  type="text"
                  value={formData.allergens || ''}
                  onChange={(e) => handleInputChange('allergens', e.target.value)}
                  className="input"
                  placeholder="Dairy-Free, Gluten-Free"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Dietary Preferences</label>
                <input
                  type="text"
                  value={formData.dietary_preferences || ''}
                  onChange={(e) => handleInputChange('dietary_preferences', e.target.value)}
                  className="input"
                  placeholder="Paleo, Low-Fat"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Cuisine Type</label>
                <input
                  type="text"
                  value={formData.cuisine_type || ''}
                  onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                  className="input"
                  placeholder="American"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Seasonal and Featured</label>
                <input
                  type="text"
                  value={formData.seasonal_featured || ''}
                  onChange={(e) => handleInputChange('seasonal_featured', e.target.value)}
                  className="input"
                  placeholder="Featured, Seasonal"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Size</label>
                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="input"
                  placeholder="1.4 oz"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Case Pack</label>
                <input
                  type="number"
                  value={formData.case_pack || ''}
                  onChange={(e) => handleInputChange('case_pack', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Wholesale Case Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wholesale_case_price || ''}
                  onChange={(e) => handleInputChange('wholesale_case_price', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Wholesale Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wholesale_unit_price || ''}
                  onChange={(e) => handleInputChange('wholesale_unit_price', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Retail Unit Price (MSRP) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.retail_unit_price || ''}
                  onChange={(e) => handleInputChange('retail_unit_price', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">GM%</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gm_percent || ''}
                  onChange={(e) => handleInputChange('gm_percent', e.target.value)}
                  className="input"
                  placeholder="Calculated automatically"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Case Minimum</label>
                <input
                  type="number"
                  value={formData.case_minimum || ''}
                  onChange={(e) => handleInputChange('case_minimum', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Shelf Life</label>
                <input
                  type="text"
                  value={formData.shelf_life || ''}
                  onChange={(e) => handleInputChange('shelf_life', e.target.value)}
                  className="input"
                  placeholder="7 months from manufacture date"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">UPC</label>
                <input
                  type="text"
                  value={formData.upc || ''}
                  onChange={(e) => handleInputChange('upc', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Delivery Info</label>
                <textarea
                  value={formData.delivery_info || ''}
                  onChange={(e) => handleInputChange('delivery_info', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Ships within 2-3 business days"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input"
                  rows="2"
                  placeholder="Additional product notes"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Product Image URL</label>
                <input
                  type="url"
                  value={formData.product_image || ''}
                  onChange={(e) => handleInputChange('product_image', e.target.value)}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Stock Level</label>
                <input
                  type="number"
                  value={formData.stock_level || 0}
                  onChange={(e) => handleInputChange('stock_level', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                    className="w-6 h-6"
                  />
                  <span className="text-lg font-semibold text-gray-700">Mark as Featured</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.seasonal || false}
                    onChange={(e) => handleInputChange('seasonal', e.target.checked)}
                    className="w-6 h-6"
                  />
                  <span className="text-lg font-semibold text-gray-700">Mark as Seasonal</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.new || false}
                    onChange={(e) => handleInputChange('new', e.target.checked)}
                    className="w-6 h-6"
                  />
                  <span className="text-lg font-semibold text-gray-700">Mark as New</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
              </button>
              <button
                onClick={closeModal}
                disabled={saving}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Import Products</h2>

            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Import Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Upload a CSV or Excel file (.csv, .xlsx, .xls)</li>
                  <li><strong>To create new products:</strong> Leave both <strong>ID</strong> and <strong>Product Connect ID</strong> empty</li>
                  <li><strong>To update existing products:</strong> Include either <strong>ID</strong> or <strong>Product Connect ID</strong> (preferred)</li>
                  <li><strong>Product Connect ID</strong> is the primary relationship key used in orders and should be used for updates</li>
                  <li>Required fields: product_name, vendor_name, wholesale_case_price, wholesale_unit_price, retail_unit_price</li>
                  <li>Boolean fields (popular, seasonal, new) should be: true, false, 1, or 0</li>
                </ul>
              </div>

              {/* Download Template Button */}
              <div>
                <button
                  onClick={downloadTemplate}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  📄 Download Template File
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Select File to Import
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-600"
                />
                {importFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              {/* Import Results */}
              {importResults && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Import Results:</h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>✓ Created: {importResults.created} products</p>
                    <p>✓ Updated: {importResults.updated} products</p>
                    {importResults.failed > 0 && (
                      <p className="text-red-600">✗ Failed: {importResults.failed} products</p>
                    )}
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside">
                          {importResults.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-red-600">{error}</li>
                          ))}
                          {importResults.errors.length > 5 && (
                            <li className="text-red-600">... and {importResults.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="btn-primary flex-1"
                >
                  {importing ? 'Importing...' : '📥 Import Products'}
                </button>
                <button
                  onClick={closeImportModal}
                  disabled={importing}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default AdminProducts;
