import { useState, useEffect } from 'react';
import api from '../../config/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
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
        id: '',
        vendor_name: 'Example Vendor',
        state: 'CA',
        product_name: 'Sample Product',
        product_description: 'Product description here',
        size: '12oz',
        case_pack: 24,
        upc: '123456789012',
        wholesale_case_price: 24.99,
        wholesale_unit_price: 1.04,
        retail_unit_price: 1.99,
        order_qty: 0,
        stock_level: 100,
        product_image: 'https://example.com/image.jpg',
        popular: false,
        seasonal: false,
        new: false,
        category: 'Beverages'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product_import_template.xlsx');
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
        <div className="flex gap-3">
          <button onClick={openImportModal} className="btn-secondary">
            📥 Import Products
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            + Add New Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Image</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Badges</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                <td className="py-3 px-4">{product.category}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold">${parseFloat(product.wholesale_case_price).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">GM: {parseFloat(product.gm_percent).toFixed(1)}%</p>
                </td>
                <td className="py-3 px-4">
                  <span className={product.stock_level > 100 ? 'text-green-600' : 'text-amber-600'}>
                    {product.stock_level}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {product.popular && <span className="badge bg-amber-500 text-white text-xs">Featured</span>}
                    {product.seasonal && <span className="badge bg-orange-500 text-white text-xs">Seasonal</span>}
                    {product.new && <span className="badge bg-green-500 text-white text-xs">New</span>}
                  </div>
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

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-8 my-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-4">
              <div>
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
                <label className="block text-lg font-semibold text-gray-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.vendor_name || ''}
                  onChange={(e) => handleInputChange('vendor_name', e.target.value)}
                  className="input"
                  required
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

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.product_description || ''}
                  onChange={(e) => handleInputChange('product_description', e.target.value)}
                  className="input"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Size</label>
                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="input"
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
                <label className="block text-lg font-semibold text-gray-700 mb-2">UPC</label>
                <input
                  type="text"
                  value={formData.upc || ''}
                  onChange={(e) => handleInputChange('upc', e.target.value)}
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
                <label className="block text-lg font-semibold text-gray-700 mb-2">Stock Level</label>
                <input
                  type="number"
                  value={formData.stock_level || 0}
                  onChange={(e) => handleInputChange('stock_level', e.target.value)}
                  className="input"
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
                  <li>Leave <strong>id</strong> empty for new products, or include existing id to update</li>
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
    </div>
  );
};

export default AdminProducts;
