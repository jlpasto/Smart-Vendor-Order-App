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
      role: 'user'
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
        alert('User updated successfully!');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filter users based on global search term
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    user.id_no?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    user.id.toString().includes(globalSearchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title mb-0">Manage Users</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Add New User
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
                    {user.role}
                  </span>
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
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Role</label>
                  <select
                    value={formData.role || 'user'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="input"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
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
    </div>
  );
};

export default AdminUsers;
