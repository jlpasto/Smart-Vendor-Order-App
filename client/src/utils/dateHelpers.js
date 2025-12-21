/**
 * Date Helper Utilities
 * Functions for calculating date ranges and formatting dates
 */

/**
 * Get the start and end dates for the current week (Monday - Sunday)
 * @returns {Object} { startDate: Date, endDate: Date }
 */
export function getThisWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate Monday (start of week)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  // Calculate Sunday (end of week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: monday,
    endDate: sunday
  };
}

/**
 * Get the start and end dates for the current month
 * @returns {Object} { startDate: Date, endDate: Date }
 */
export function getThisMonth() {
  const today = new Date();

  // First day of current month
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);

  // Last day of current month
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate,
    endDate
  };
}

/**
 * Get the start and end dates for the last 7 days
 * @returns {Object} { startDate: Date, endDate: Date }
 */
export function getLast7Days() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // -6 because today counts as day 1
  sevenDaysAgo.setHours(0, 0, 0, 0);

  return {
    startDate: sevenDaysAgo,
    endDate: today
  };
}

/**
 * Get the start and end dates for the last 30 days
 * @returns {Object} { startDate: Date, endDate: Date }
 */
export function getLast30Days() {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // -29 because today counts as day 1
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  return {
    startDate: thirtyDaysAgo,
    endDate: today
  };
}

/**
 * Format a date for display (e.g., "Dec 21, 2025")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(date) {
  if (!date) return 'No activity';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid date';

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format a date for API calls (ISO string)
 * @param {Date} date - Date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function formatDateForAPI(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

/**
 * Get date range based on preset option
 * @param {string} rangeType - 'thisWeek', 'thisMonth', 'last7Days', 'last30Days'
 * @returns {Object} { startDate: Date, endDate: Date }
 */
export function getDateRange(rangeType) {
  switch (rangeType) {
    case 'thisWeek':
      return getThisWeek();
    case 'thisMonth':
      return getThisMonth();
    case 'last7Days':
      return getLast7Days();
    case 'last30Days':
      return getLast30Days();
    default:
      return getThisWeek(); // Default to this week
  }
}

/**
 * Format a date input value (YYYY-MM-DD) from a Date object
 * @param {Date} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format for input fields
 */
export function formatDateForInput(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
