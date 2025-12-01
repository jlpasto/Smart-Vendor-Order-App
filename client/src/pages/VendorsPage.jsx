import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Infinite scroll hook
  const observerTarget = useInfiniteScroll({
    loading: loadingMore,
    hasMore,
    onLoadMore: loadMoreVendors,
    rootMargin: '100px'
  });

  // Reset and load vendors when search changes
  useEffect(() => {
    resetAndLoadVendors();
  }, [searchTerm]);

  const resetAndLoadVendors = useCallback(async () => {
    setVendors([]);
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    setError('');

    try {
      await fetchVendors(null);
    } catch (err) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchVendors = async (currentCursor) => {
    const params = {
      cursor: currentCursor,
      limit: 20,
      sort: 'name',
      order: 'asc',
      search: searchTerm || undefined
    };

    const response = await api.get('/api/vendors', { params });

    // Handle cursor pagination response
    if (response.data.items) {
      const { items, pagination } = response.data;

      setVendors(prev => currentCursor ? [...prev, ...items] : items);
      setCursor(pagination.nextCursor);
      setHasMore(pagination.hasMore);
    } else {
      // Backward compatibility: if API returns array (old format)
      setVendors(response.data);
      setHasMore(false);
    }

    return response.data;
  };

  async function loadMoreVendors() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError('');

    try {
      await fetchVendors(cursor);
    } catch (err) {
      setError('Failed to load more vendors');
    } finally {
      setLoadingMore(false);
    }
  }

  const openDetailModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVendor(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading vendors...</p>
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
        {vendors.map(vendor => (
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

      {/* No results */}
      {vendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No vendors found matching your search.' : 'No vendors available.'}
          </p>
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading more vendors...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="text-red-600 text-center">
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={loadMoreVendors}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Intersection Observer Target */}
      {hasMore && !loadingMore && !error && (
        <div
          ref={observerTarget}
          className="h-20 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="text-gray-400 text-sm">Scroll for more</div>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && vendors.length > 0 && (
        <div className="text-center py-12 border-t border-gray-200 mt-8">
          <p className="text-xl font-semibold text-gray-700">You've reached the end!</p>
          <p className="text-gray-500 mt-2">Showing all {vendors.length} vendors</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Top ↑
          </button>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loadingMore && 'Loading more vendors'}
        {!hasMore && `All ${vendors.length} vendors loaded`}
      </div>

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
