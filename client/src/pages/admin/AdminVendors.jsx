import { useState, useEffect } from 'react';
import api from '../../config/api';
import { useSearch } from '../../context/SearchContext';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const AdminVendors = () => {
  const { globalSearchTerm } = useSearch();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.vendor-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const fetchVendors = async () => {
    try {
      const response = await api.get('/api/vendors');
      setVendors(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setLoading(false);
    }
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData({
      vendor_connect_id: '',
      name: '',
      website_url: '',
      logo_url: '',
      phone: '',
      email: '',
      address: '',
      state: '',
      territory: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({});
  };

  const openDetailModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVendor(null);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingVendor) {
        // Update existing vendor
        await api.put(`/api/vendors/${editingVendor.id}`, formData);
        alert('Vendor updated successfully!');
      } else {
        // Create new vendor
        await api.post('/api/vendors', formData);
        alert('Vendor created successfully!');
      }
      closeModal();
      fetchVendors();
    } catch (error) {
      alert('Error saving vendor: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vendorId, vendorName) => {
    if (window.confirm(`Are you sure you want to delete "${vendorName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/api/vendors/${vendorId}`);
        alert('Vendor deleted successfully!');
        fetchVendors();
      } catch (error) {
        alert('Error deleting vendor: ' + (error.response?.data?.error || 'Unknown error'));
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
      const parsedData = await parseFileData(importFile);

      if (!parsedData || parsedData.length === 0) {
        alert('No data found in the file');
        setImporting(false);
        return;
      }

      const response = await api.post('/api/vendors/bulk-import', {
        vendors: parsedData
      });

      setImportResults(response.data);
      alert(`Import completed!\n${response.data.created} vendors created\n${response.data.updated} vendors updated\n${response.data.failed} vendors failed`);

      fetchVendors();
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing vendors: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'ID': '',
        'Vendor Connect ID': '',
        'Vendor Name': 'Example Vendor',
        'URL': 'https://example.com',
        'Logo': 'https://example.com/logo.png',
        'Phone': '(555) 123-4567',
        'Email': 'contact@example.com',
        'Address': '123 Main St, Suite 100',
        'State': 'CA',
        'Territory': 'West Coast'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');
    XLSX.writeFile(wb, 'vendor_import_template.xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filter vendors based on global search term
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    vendor.city?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    vendor.state?.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
    vendor.description?.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title mb-0">Manage Vendors</h1>
        <div className="flex gap-3">
          {/* Temporarily disabled - Import Vendors button */}
          {/* <button onClick={openImportModal} className="btn-secondary">
            📥 Import Vendors
          </button> */}
          <button onClick={openCreateModal} className="btn-primary">
            + Add New Vendor
          </button>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            className="card hover:shadow-lg transition-shadow cursor-pointer relative"
            onClick={() => openDetailModal(vendor)}
          >
            {/* 3-Dot Menu Button */}
            <div className="absolute top-4 right-4 vendor-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === vendor.id ? null : vendor.id);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="8" cy="2" r="1.5"/>
                  <circle cx="8" cy="8" r="1.5"/>
                  <circle cx="8" cy="14" r="1.5"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {openMenuId === vendor.id && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      openEditModal(vendor);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium rounded-t-lg"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      handleDelete(vendor.id, vendor.name);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium rounded-b-lg"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {/* Vendor Logo */}
            <div className="flex justify-center mb-4">
              <img
                src={vendor.logo_url || 'https://via.placeholder.com/100/CCCCCC/666666?text=No+Logo'}
                alt={vendor.name}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100/CCCCCC/666666?text=' + vendor.name.charAt(0);
                }}
              />
            </div>

            {/* Vendor Name */}
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2 truncate">
              {vendor.name}
            </h3>

            {/* Website Link */}
            {vendor.website_url && (
              <a
                href={vendor.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 text-center block mb-4 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {vendor.website_url.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            )}
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {globalSearchTerm ? 'No vendors found matching your search.' : 'No vendors found. Add your first vendor!'}
          </p>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 my-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input"
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
                <label className="block text-lg font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="input"
                  placeholder="e.g., CA"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Territory</label>
                <input
                  type="text"
                  value={formData.territory || ''}
                  onChange={(e) => handleInputChange('territory', e.target.value)}
                  className="input"
                  placeholder="e.g., West Coast"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url || ''}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  className="input"
                  placeholder="https://example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url || ''}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="input"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Full address"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Saving...' : (editingVendor ? 'Update Vendor' : 'Create Vendor')}
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

      {/* Detail Modal */}
      {showDetailModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Vendor Details</h2>
              <button
                onClick={closeDetailModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img
                  src={selectedVendor.logo_url || 'https://via.placeholder.com/150/CCCCCC/666666?text=No+Logo'}
                  alt={selectedVendor.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Name</p>
                  <p className="text-lg text-gray-900">{selectedVendor.name}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Vendor Connect ID</p>
                  <p className="text-lg text-gray-900">{selectedVendor.vendor_connect_id || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">{selectedVendor.email || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Phone</p>
                  <p className="text-lg text-gray-900">{selectedVendor.phone || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">State</p>
                  <p className="text-lg text-gray-900">{selectedVendor.state || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Territory</p>
                  <p className="text-lg text-gray-900">{selectedVendor.territory || 'N/A'}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-500">Website</p>
                  {selectedVendor.website_url ? (
                    <a
                      href={selectedVendor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-primary-600 hover:text-primary-700"
                    >
                      {selectedVendor.website_url}
                    </a>
                  ) : (
                    <p className="text-lg text-gray-900">N/A</p>
                  )}
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-500">Address</p>
                  <p className="text-gray-900">{selectedVendor.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  closeDetailModal();
                  openEditModal(selectedVendor);
                }}
                className="btn-primary flex-1"
              >
                Edit Vendor
              </button>
              <button
                onClick={closeDetailModal}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Import Vendors</h2>

            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Import Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Upload a CSV or Excel file (.csv, .xlsx, .xls)</li>
                  <li>Leave <strong>ID</strong> empty for new vendors, or include existing ID to update</li>
                  <li>Required field: Vendor Name</li>
                  <li>Optional fields: Vendor Connect ID, URL, Logo, Phone, Email, Address, State, Territory</li>
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
                    <p>✓ Created: {importResults.created} vendors</p>
                    <p>✓ Updated: {importResults.updated} vendors</p>
                    {importResults.failed > 0 && (
                      <p className="text-red-600">✗ Failed: {importResults.failed} vendors</p>
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
                  {importing ? 'Importing...' : '📥 Import Vendors'}
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

export default AdminVendors;
