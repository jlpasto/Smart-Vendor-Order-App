import { useState, useEffect } from 'react';
import api from '../config/api';

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

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

  const openDetailModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVendor(null);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="page-title">Vendors</h1>
        <p className="text-gray-600 mt-2">Browse our trusted vendor partners</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredVendors.map(vendor => (
          <div
            key={vendor.id}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openDetailModal(vendor)}
          >
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
                className="text-sm text-primary-600 hover:text-primary-700 text-center block truncate"
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
            {searchTerm ? 'No vendors found matching your search.' : 'No vendors available.'}
          </p>
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
                  <p className="text-sm font-semibold text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">{selectedVendor.email || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Phone</p>
                  <p className="text-lg text-gray-900">{selectedVendor.phone || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-500">Location</p>
                  <p className="text-lg text-gray-900">
                    {selectedVendor.city && selectedVendor.state
                      ? `${selectedVendor.city}, ${selectedVendor.state}`
                      : selectedVendor.city || selectedVendor.state || 'N/A'}
                  </p>
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
                  <p className="text-sm font-semibold text-gray-500">Description</p>
                  <p className="text-gray-900">{selectedVendor.description || 'No description available'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={closeDetailModal}
                className="btn-primary px-12"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsPage;
