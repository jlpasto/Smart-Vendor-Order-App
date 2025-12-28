import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import {
  getDateRange,
  formatDateForDisplay,
  formatDateForInput,
  formatDateForAPI
} from '../../utils/dateHelpers';

export default function AdminBuyerOverview() {
  const navigate = useNavigate();

  // State management
  const [buyers, setBuyers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [summary, setSummary] = useState({ totalBuyers: 0, activeBuyers: 0, inactiveBuyers: 0 });
  const [loading, setLoading] = useState(true);

  // Filter and sort state
  const [dateRange, setDateRange] = useState('thisWeek');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastActivity'); // 'name' or 'lastActivity'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Initialize date range on component mount
  useEffect(() => {
    const { startDate: start, endDate: end } = getDateRange('thisWeek');
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  }, []);

  // Fetch buyer overview data
  useEffect(() => {
    if (startDate && endDate) {
      fetchBuyerOverview();
    }
  }, [startDate, endDate]);

  // Filter and sort buyers when search or sort changes
  useEffect(() => {
    let filtered = [...buyers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(buyer =>
        buyer.user_name?.toLowerCase().includes(query) ||
        buyer.user_email?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'name') {
        aValue = a.user_name?.toLowerCase() || a.user_email?.toLowerCase() || '';
        bValue = b.user_name?.toLowerCase() || b.user_email?.toLowerCase() || '';
      } else if (sortBy === 'lastActivity') {
        aValue = a.last_activity_date ? new Date(a.last_activity_date).getTime() : 0;
        bValue = b.last_activity_date ? new Date(b.last_activity_date).getTime() : 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBuyers(filtered);
  }, [buyers, searchQuery, sortBy, sortDirection]);

  const fetchBuyerOverview = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/buyer-overview', {
        params: {
          startDate: formatDateForAPI(new Date(startDate)),
          endDate: formatDateForAPI(new Date(endDate))
        }
      });

      setBuyers(response.data.buyers);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching buyer overview:', error);
      alert('Error loading buyer overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRange(value);

    if (value !== 'custom') {
      const { startDate: start, endDate: end } = getDateRange(value);
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(end));
    }
  };

  const handleRefresh = () => {
    fetchBuyerOverview();
  };

  const handleViewOrders = (buyer) => {
    // Navigate to Admin Orders page with pre-applied filters
    navigate('/admin/orders', {
      state: {
        filters: {
          userEmail: buyer.user_email,
          userName: buyer.user_name,
          startDate: startDate,
          endDate: endDate,
          status: '' // Show all statuses
        }
      }
    });
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortDirection(column === 'lastActivity' ? 'desc' : 'asc');
    }
  };

  const hasActivity = (buyer) => {
    return parseInt(buyer.in_cart_count) > 0 ||
      parseInt(buyer.pending_batches) > 0 ||
      parseInt(buyer.completed_batches) > 0 ||
      parseInt(buyer.cancelled_batches) > 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Buyer Overview Dashboard</h1>
        <p className="text-gray-600">Track order activity across all buyers</p>
      </div>

      {/* Date Range Selector */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Date Range:</label>
            <select
              value={dateRange}
              onChange={handleDateRangeChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="last7Days">Last 7 Days</option>
              <option value="last30Days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <button onClick={handleRefresh} className="btn-secondary whitespace-nowrap">
            🔄 Refresh
          </button>

          <div className="flex-1" />

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Buyers</p>
          <p className="text-3xl font-bold text-blue-900">{summary.totalBuyers}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Active Buyers</p>
          <p className="text-3xl font-bold text-green-900">{summary.activeBuyers}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium mb-1">Inactive Buyers</p>
          <p className="text-3xl font-bold text-gray-900">{summary.inactiveBuyers}</p>
        </div>
      </div>

      {/* Buyers Table - Desktop */}
      <div className="card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Buyer Name/Email
                    {sortBy === 'name' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Cart
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('lastActivity')}
                >
                  <div className="flex items-center gap-2">
                    Last Activity
                    {sortBy === 'lastActivity' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuyers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'No buyers match your search' : 'No buyers found'}
                  </td>
                </tr>
              ) : (
                filteredBuyers.map((buyer) => {
                  const isActive = hasActivity(buyer);
                  return (
                    <tr
                      key={buyer.user_id}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-white hover:bg-blue-50'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      {/* Buyer Name/Email */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {buyer.user_name || buyer.user_email.split('@')[0]}
                        </div>
                        <div className="text-sm text-gray-500">{buyer.user_email}</div>
                      </td>

                      {/* In Cart */}
                      <td className="px-6 py-4 text-center">
                        {parseInt(buyer.in_cart_count) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                            🛒 {buyer.in_cart_count}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Pending */}
                      <td className="px-6 py-4 text-center">
                        {parseInt(buyer.pending_batches) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium text-sm">
                            ⏳ {buyer.pending_batches}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Completed */}
                      <td className="px-6 py-4 text-center">
                        {parseInt(buyer.completed_batches) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium text-sm">
                            ✓ {buyer.completed_batches}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateForDisplay(buyer.last_activity_date)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        {isActive ? (
                          <button
                            onClick={() => handleViewOrders(buyer)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            View Orders
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buyers Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {filteredBuyers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? 'No buyers match your search' : 'No buyers found'}
            </p>
          </div>
        ) : (
          filteredBuyers.map((buyer) => {
            const isActive = hasActivity(buyer);
            return (
              <div
                key={buyer.user_id}
                className={`card ${isActive ? 'bg-white' : 'bg-gray-50'}`}
              >
                {/* Buyer Info */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900">
                    {buyer.user_name || buyer.user_email.split('@')[0]}
                  </h3>
                  <p className="text-sm text-gray-500">{buyer.user_email}</p>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Cart</p>
                    {parseInt(buyer.in_cart_count) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">
                        🛒 {buyer.in_cart_count}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Pending</p>
                    {parseInt(buyer.pending_batches) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium text-xs">
                        ⏳ {buyer.pending_batches}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    {parseInt(buyer.completed_batches) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium text-xs">
                        ✓ {buyer.completed_batches}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="mb-4 text-sm">
                  <span className="text-gray-500">Last Activity: </span>
                  <span className="text-gray-900">
                    {formatDateForDisplay(buyer.last_activity_date)}
                  </span>
                </div>

                {/* Action Button */}
                <div>
                  {isActive ? (
                    <button
                      onClick={() => handleViewOrders(buyer)}
                      className="btn-primary w-full"
                    >
                      View Orders
                    </button>
                  ) : (
                    <div className="text-center text-gray-400 py-2">No activity</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
