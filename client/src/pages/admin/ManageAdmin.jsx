import { useState, useEffect } from 'react';
import api from '../../config/api';
import { useSearch } from '../../context/SearchContext';

const ManageAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { globalSearchTerm } = useSearch();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/api/users/admins');
      setAdmins(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setLoading(false);
    }
  };

  // Password generation function
  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Open create modal
  const openCreateModal = () => {
    const randomPassword = generateRandomPassword();
    setGeneratedPassword(randomPassword);
    setFormData({
      email: '',
      password: randomPassword,
      role: 'admin'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setGeneratedPassword('');
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
    setFormData({ ...formData, password: newPassword });
  };

  // Save admin
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.post('/api/users/admin', formData);
      alert(`Admin created successfully!\n\nUsername: ${response.data.email}\nPassword: ${response.data.password}\n\nPlease save this password, it won't be shown again.`);
      closeModal();
      fetchAdmins();
    } catch (error) {
      alert('Error creating admin: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminId, adminName) => {
    if (window.confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/api/users/admin/${adminId}`);
        alert('Admin deleted successfully!');
        fetchAdmins();
      } catch (error) {
        alert('Error deleting admin: ' + (error.response?.data?.error || 'Unknown error'));
      }
    }
  };

  // Filter admins based on search term
  const filteredAdmins = admins.filter(admin => {
    if (!globalSearchTerm) return true;
    const searchLower = globalSearchTerm.toLowerCase();
    return (
      admin.email?.toLowerCase().includes(searchLower) ||
      admin.role?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title mb-0">Manage Admins</h1>
        <button onClick={openCreateModal} className="btn-primary">
          + Add New Admin
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Created At</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map(admin => (
              <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-600">{admin.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{admin.email}</td>
                <td className="py-3 px-4">
                  {admin.role === 'superadmin' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      🔐 Super Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  {admin.role === 'superadmin' ? (
                    <span className="text-gray-400 text-sm italic">Read only</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(admin.id, admin.name || admin.email)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {globalSearchTerm ? 'No admins match your search.' : 'No admin users found. Add your first admin!'}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Add New Admin
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role || 'admin'}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Auto-generated Password */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Password (Auto-generated)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.password || ''}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This password will be shown only once. Make sure to save it.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                disabled={saving || !formData.email}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create Admin'}
              </button>
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
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

export default ManageAdmin;
