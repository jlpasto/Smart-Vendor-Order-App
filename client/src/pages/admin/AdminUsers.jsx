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
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned Vendors</th>
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
                      {user.assigned_vendor_ids && user.assigned_vendor_ids.length > 0
                        ? `${user.assigned_vendor_ids.length} vendor${user.assigned_vendor_ids.length !== 1 ? 's' : ''}`
                        : 'All vendors'}
                    </span>
                    <button
                      onClick={() => openVendorModal(user)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-xs"
                    >
                      View Vendors
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

// Vendor Assignment Modal Component
const VendorAssignmentModal = ({ user, onClose, onSave }) => {
  const [allVendors, setAllVendors] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState(user.assigned_vendor_ids || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/vendors');
      // Sort by name
      const sortedVendors = response.data.sort((a, b) => a.name.localeCompare(b.name));
      setAllVendors(sortedVendors);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setLoading(false);
    }
  };

  const handleToggleVendor = (vendorId) => {
    setSelectedVendorIds(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    const filtered = getFilteredVendors();
    const filteredIds = filtered.map(v => v.id);
    setSelectedVendorIds([...new Set([...selectedVendorIds, ...filteredIds])]);
  };

  const handleClearAll = () => {
    setSelectedVendorIds([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/users/${user.id}`, {
        assigned_vendors: selectedVendorIds
      });
      alert('Vendor assignments updated successfully!');
      onSave();
      onClose();
    } catch (error) {
      alert('Error updating vendors: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const getFilteredVendors = () => {
    return allVendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredVendors = getFilteredVendors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Assign Vendors
        </h2>
        <p className="text-gray-600 mb-6">
          Managing vendors for: <span className="font-semibold">{user.name || user.email}</span>
        </p>

        {/* Search and Actions */}
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
          <div className="flex gap-2 justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{selectedVendorIds.length}</span> of{' '}
              <span className="font-semibold">{allVendors.length}</span> vendors selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-sm"
              >
                Select All Shown
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Vendor List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto mb-6">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No vendors found matching your search.' : 'No vendors available.'}
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <label
                  key={vendor.id}
                  className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedVendorIds.includes(vendor.id)}
                    onChange={() => handleToggleVendor(vendor.id)}
                    className="w-5 h-5 mr-3 cursor-pointer"
                  />
                  <span className="text-base text-gray-800">{vendor.name}</span>
                </label>
              ))
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
