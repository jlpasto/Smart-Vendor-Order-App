import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
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
        await axios.put(`/api/products/${editingProduct.id}`, formData);
        alert('Product updated successfully!');
      } else {
        // Create new product
        await axios.post('/api/products', formData);
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
        await axios.delete(`/api/products/${productId}`);
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        alert('Error deleting product: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
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
        <button onClick={openCreateModal} className="btn-primary">
          + Add New Product
        </button>
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
                    {product.popular && <span className="badge bg-amber-500 text-white text-xs">Popular</span>}
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
                  <span className="text-lg font-semibold text-gray-700">Mark as Popular</span>
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
    </div>
  );
};

export default AdminProducts;
