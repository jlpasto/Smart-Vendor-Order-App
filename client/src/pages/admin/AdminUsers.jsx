import { useState, useEffect } from 'react';
import api from '../../config/api';
import { useSearch } from '../../context/SearchContext';

const AdminUsers = () => {
  const { globalSearchTerm } = useSearch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorModalUser, setVendorModalUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const openCreateModal = () => {
    setEditingUser(null);
    const randomPassword = generateRandomPassword();
    setGeneratedPassword(randomPassword);
    setFormData({
      name: '',
      email: '',
      id_no: '',
      password: randomPassword,
      role: 'buyer'
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setGeneratedPassword('');
    setFormData({
      name: user.name || '',
      email: user.email,
      id_no: user.id_no || '',
      role: user.role
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({});
    setGeneratedPassword('');
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        await api.put(`/api/users/${editingUser.id}`, formData);

        // Show different message if password was reset
        if (generatedPassword) {
          alert(`User updated successfully!\n\nNEW PASSWORD: ${generatedPassword}\n\nPlease save this password and share it with the user. It won't be shown again.`);
        } else {
          alert('User updated successfully!');
        }
      } else {
        // Create new user
        const response = await api.post('/api/users', formData);
        alert(`User created successfully!\n\nEmail: ${response.data.email}\nPassword: ${response.data.password}\n\nPlease save this password, it won't be shown again.`);
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      alert('Error saving user: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/api/users/${userId}`);
        alert('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        alert('Error deleting user: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  const handleRegeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setFormData({ ...formData, password: newPassword });
  };

  const openVendorModal = (user) => {
    setVendorModalUser(user);
    setShowVendorModal(true);
  };

  const closeVendorModal = () => {
    setShowVendorModal(false);
    setVendorModalUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filter users based on global search term and hide admin users
  const filteredUsers = users.filter(user =>
    user.role !== 'admin' && (
      user.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      user.id_no?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      user.id.toString().includes(globalSearchTerm)
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title mb-0">Manage Buyers</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Add New Buyer
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID No</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Products</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4">{user.name || '-'}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.id_no || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'buyer' ? 'Buyer' : user.role === 'admin' ? 'Admin' : user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">
                      {user.assigned_product_ids && user.assigned_product_ids.length > 0
                        ? `${user.assigned_product_ids.length} product${user.assigned_product_ids.length !== 1 ? 's' : ''}`
                        : 'No products'}
                    </span>
                    <button
                      onClick={() => openVendorModal(user)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-xs"
                    >
                      Manage Products
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.name || user.email)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {globalSearchTerm ? 'No users found matching your search.' : 'No users found. Add your first user!'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">ID No</label>
                <input
                  type="text"
                  value={formData.id_no || ''}
                  onChange={(e) => handleInputChange('id_no', e.target.value)}
                  className="input"
                  placeholder="Enter ID number"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">
                    Password (Auto-generated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.password || ''}
                      readOnly
                      className="input flex-1 bg-gray-50"
                    />
                    <button
                      onClick={handleRegeneratePassword}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    This password will be shown only once. Make sure to save it.
                  </p>
                </div>
              )}

              {editingUser && (
                <>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.role || 'buyer'}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="input"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">
                      Reset Password
                    </label>
                    {!generatedPassword ? (
                      <button
                        type="button"
                        onClick={handleRegeneratePassword}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold w-full"
                      >
                        🔑 Generate New Password
                      </button>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={generatedPassword}
                            readOnly
                            className="input flex-1 bg-green-50 border-green-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(generatedPassword);
                              alert('Password copied to clipboard!');
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={handleRegeneratePassword}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                          >
                            🔄
                          </button>
                        </div>
                        <p className="text-sm text-green-700 mt-2 font-semibold">
                          ✓ New password generated! Make sure to copy it before saving.
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Generate a new password for this user. They will need to use the new password to login.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
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

      {/* Vendor Assignment Modal */}
      {showVendorModal && vendorModalUser && (
        <VendorAssignmentModal
          user={vendorModalUser}
          onClose={closeVendorModal}
          onSave={fetchUsers}
        />
      )}
    </div>
  );
};

// Product Assignment Modal Component (with collapsible vendors)
const VendorAssignmentModal = ({ user, onClose, onSave }) => {
  const [vendorsWithProducts, setVendorsWithProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState(user.assigned_product_ids || []);
  const [expandedVendors, setExpandedVendors] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVendorsWithProducts();
  }, []);

  const fetchVendorsWithProducts = async () => {
    try {
      const response = await api.get('/api/products/grouped-by-vendor');
      setVendorsWithProducts(response.data.vendors);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors with products:', error);
      setLoading(false);
    }
  };

  // Toggle vendor expansion
  const handleToggleVendor = (vendorId) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  // Toggle vendor checkbox (selects/deselects ALL products under vendor)
  const handleVendorCheckbox = (vendor) => {
    const vendorProductIds = vendor.products.map(p => p.id);
    const allSelected = vendorProductIds.every(id => selectedProductIds.includes(id));

    if (allSelected) {
      // Deselect all products from this vendor
      setSelectedProductIds(prev =>
        prev.filter(id => !vendorProductIds.includes(id))
      );
    } else {
      // Select all products from this vendor
      setSelectedProductIds(prev =>
        [...new Set([...prev, ...vendorProductIds])]
      );
    }
  };

  // Toggle individual product checkbox
  const handleProductCheckbox = (productId) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Calculate vendor checkbox state (none, all, or partial)
  const getVendorCheckboxState = (vendor) => {
    const vendorProductIds = vendor.products.map(p => p.id);
    const selectedCount = vendorProductIds.filter(id =>
      selectedProductIds.includes(id)
    ).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === vendorProductIds.length) return 'all';
    return 'partial'; // indeterminate state
  };

  // Select all products (from all vendors)
  const handleSelectAll = () => {
    const allProductIds = filteredVendors.flatMap(v => v.products.map(p => p.id));
    setSelectedProductIds([...new Set([...selectedProductIds, ...allProductIds])]);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  // Expand all vendors
  const handleExpandAll = () => {
    const allVendorIds = filteredVendors.map(v => v.id);
    setExpandedVendors(new Set(allVendorIds));
  };

  // Collapse all vendors
  const handleCollapseAll = () => {
    setExpandedVendors(new Set());
  };

  // Save assignments
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}`, {
        assigned_products: selectedProductIds
      });
      alert('Product assignments updated successfully!');
      onSave();
      onClose();
    } catch (error) {
      alert('Error updating products: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Filter vendors and products by search term
  const getFilteredVendors = () => {
    if (!searchTerm.trim()) return vendorsWithProducts;

    return vendorsWithProducts.map(vendor => {
      const matchesVendor = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
      const filteredProducts = vendor.products.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Include vendor if name matches or if any products match
      if (matchesVendor || filteredProducts.length > 0) {
        return {
          ...vendor,
          products: matchesVendor ? vendor.products : filteredProducts
        };
      }
      return null;
    }).filter(v => v !== null);
  };

  const filteredVendors = getFilteredVendors();
  const totalProducts = vendorsWithProducts.reduce((sum, v) => sum + v.product_count, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full p-8 max-h-[90vh] flex flex-col">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Assign Products
        </h2>
        <p className="text-gray-600 mb-6">
          Managing product access for: <span className="font-semibold">{user.name || user.email}</span>
        </p>

        {/* Search and Stats */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search vendors or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
          <div className="flex gap-2 justify-between items-center flex-wrap">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-primary-600">{selectedProductIds.length}</span> of{' '}
              <span className="font-semibold">{totalProducts}</span> products selected
              {' '}across{' '}
              <span className="font-semibold">{vendorsWithProducts.length}</span> vendors
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExpandAll}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-xs"
              >
                Expand All
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-xs"
              >
                Collapse All
              </button>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-xs"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-xs"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Vendor List with Products */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden flex-1 overflow-y-auto mb-6">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No vendors or products found matching your search.' : 'No vendors with products available.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredVendors.map((vendor) => {
                  const isExpanded = expandedVendors.has(vendor.id);
                  const checkboxState = getVendorCheckboxState(vendor);
                  const selectedCount = vendor.products.filter(p =>
                    selectedProductIds.includes(p.id)
                  ).length;

                  return (
                    <div key={vendor.id} className="bg-white">
                      {/* Vendor Header */}
                      <div className="flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => handleToggleVendor(vendor.id)}
                          className="mr-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>

                        {/* Vendor Checkbox */}
                        <input
                          type="checkbox"
                          checked={checkboxState === 'all'}
                          ref={el => {
                            if (el) el.indeterminate = checkboxState === 'partial';
                          }}
                          onChange={() => handleVendorCheckbox(vendor)}
                          className="w-5 h-5 mr-3 cursor-pointer"
                        />

                        {/* Vendor Name */}
                        <div className="flex-1">
                          <span className="text-base font-semibold text-gray-900">{vendor.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({vendor.product_count} product{vendor.product_count !== 1 ? 's' : ''})
                          </span>
                        </div>

                        {/* Selection Badge */}
                        {selectedCount > 0 && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                            {selectedCount} of {vendor.product_count} selected
                          </span>
                        )}
                      </div>

                      {/* Collapsible Product List */}
                      {isExpanded && (
                        <div className="bg-white">
                          {vendor.products.map(product => (
                            <label
                              key={product.id}
                              className="flex items-center px-4 py-2 pl-12 cursor-pointer hover:bg-gray-50 border-t border-gray-100"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(product.id)}
                                onChange={() => handleProductCheckbox(product.id)}
                                className="w-4 h-4 mr-3 cursor-pointer"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-gray-800">{product.product_name}</span>
                                <span className="text-xs text-gray-500 ml-2">(#{product.id})</span>
                              </div>
                              {product.wholesale_case_price && (
                                <span className="text-xs text-gray-600">
                                  ${parseFloat(product.wholesale_case_price).toFixed(2)}
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary flex-1"
          >
            {saving ? 'Saving...' : 'Save Assignments'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
