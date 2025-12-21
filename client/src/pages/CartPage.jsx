import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import ReplacementPreferenceModal from '../components/ReplacementPreferenceModal';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, updatePricingMode, updateReplacementPreference, clearCart, getCartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingReplacementItem, setEditingReplacementItem] = useState(null);
  const [showReplacementModal, setShowReplacementModal] = useState(false);

  const handleQuantityChange = (productId, newQuantity) => {
    const qty = parseInt(newQuantity);
    if (qty > 0) {
      updateQuantity(productId, qty);
    }
  };

  const handleRemove = (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(productId);
    }
  };

  const handleEditReplacementPreference = (item) => {
    setEditingReplacementItem(item);
    setShowReplacementModal(true);
  };

  const handleCloseReplacementModal = () => {
    setEditingReplacementItem(null);
    setShowReplacementModal(false);
  };

  const handleSaveReplacementPreference = (unavailableAction, replacementProductId, replacementProductName) => {
    if (!editingReplacementItem) return;

    // Update the cart item with new replacement preferences
    updateReplacementPreference(editingReplacementItem.id, unavailableAction, replacementProductId, replacementProductName);
    handleCloseReplacementModal();
  };

  // Helper function to get human-readable replacement preference label
  const getReplacementPreferenceLabel = (action) => {
    const labels = {
      'curate': 'Curate to replace if sold out',
      'replace_same_vendor': 'Replace with similar item under same vendor',
      'replace_other_vendors': 'Replace with similar item across other vendors',
      'remove': 'Remove it from my order'
    };
    return labels[action] || 'Curate to replace if sold out';
  };

  // Helper function to get replacement product name from item
  const getReplacementProductName = (item) => {
    // Use the stored replacement_product_name if available, otherwise show ID
    return item.replacement_product_name || `Product #${item.replacement_product_id}`;
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (window.confirm(`Submit order with ${cart.length} items for $${getCartTotal().toFixed(2)}?`)) {
      setSubmitting(true);
      setError('');

      try {
        const response = await api.post('/api/orders/submit', {
          items: cart
        });

        // Show success message
        alert(`✅ Order submitted successfully!\n\nBatch Number: ${response.data.batchNumber}\n\nYou will receive an email confirmation shortly.`);

        // Clear cart
        clearCart();

        // Navigate to orders page
        navigate('/orders');
      } catch (err) {
        console.error('Order submission error:', err);
        console.error('Error response:', err.response);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to submit order';
        setError(errorMessage);
        alert(`Error submitting order: ${errorMessage}`);
        setSubmitting(false);
      }
    }
  };

  // Helper function to aggregate units by vendor and case pack
  const aggregateUnitsByVendorAndCasePack = (cartItems) => {
    const groups = {};

    cartItems.forEach(item => {
      // Only process UNIT mode items with valid case_pack
      if (item.pricing_mode !== 'unit' || !item.case_pack || item.case_pack <= 0) {
        return;
      }

      // Create unique group key
      const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          vendor_name: item.vendor_name,
          case_pack: item.case_pack,
          total_units: 0,
          items: [],
          is_complete: false,
          units_needed: 0
        };
      }

      groups[groupKey].total_units += item.quantity;
      groups[groupKey].items.push({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity
      });
    });

    // Calculate completion status
    Object.values(groups).forEach(group => {
      group.is_complete = group.total_units >= group.case_pack;
      group.units_needed = Math.max(0, group.case_pack - group.total_units);
    });

    return groups;
  };

  // Helper function to check if case pack warning should be shown
  const shouldShowCasePackWarning = (item, aggregateGroups) => {
    if (item.pricing_mode !== 'unit') return false;
    if (!item.case_pack || item.case_pack <= 0) return false;

    const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}`;
    const group = aggregateGroups[groupKey];

    if (!group) return false;

    return !group.is_complete;
  };

  // Helper function to check if case pack success should be shown
  const shouldShowCasePackSuccess = (item, aggregateGroups) => {
    if (item.pricing_mode !== 'unit') return false;
    if (!item.case_pack || item.case_pack <= 0) return false;

    const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}`;
    const group = aggregateGroups[groupKey];

    if (!group) return false;

    return group.is_complete;
  };

  // Helper function to get case pack warning data
  const getCasePackWarningData = (item, aggregateGroups) => {
    const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}`;
    const group = aggregateGroups[groupKey];

    if (!group) return null;

    return {
      current_units: group.total_units,
      required_units: group.case_pack,
      units_needed: group.units_needed,
      products_in_group: group.items.length,
      is_part_of_group: group.items.length > 1
    };
  };

  // Helper function to aggregate split case products
  const aggregateSplitCaseByVendorAndCasePack = (cartItems) => {
    const groups = {};

    cartItems.forEach(item => {
      // Only process UNIT mode items that are split case
      if (item.pricing_mode !== 'unit') return;

      const isSplitCase = item.is_split_case === true ||
                         item.is_split_case === 1 ||
                         item.is_split_case === 'Yes' ||
                         item.is_split_case === 'yes';

      if (!isSplitCase || !item.case_pack || item.case_pack <= 0) return;

      // Create unique group key
      const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}_split`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          vendor_name: item.vendor_name,
          case_pack: item.case_pack,
          total_units: 0,
          items: [],
          is_valid: false
        };
      }

      groups[groupKey].total_units += item.quantity;
      groups[groupKey].items.push({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity
      });
    });

    // Calculate validation status - total must be divisible by full case_pack (not half)
    Object.values(groups).forEach(group => {
      group.is_valid = group.total_units % group.case_pack === 0;
    });

    return groups;
  };

  // Helper function to check if minimum units warning should be shown
  const shouldShowMinimumUnitsWarning = (item) => {
    if (item.pricing_mode !== 'unit') return false;

    // Check if split case is enabled
    const isSplitCase = item.is_split_case === true ||
                       item.is_split_case === 1 ||
                       item.is_split_case === 'Yes' ||
                       item.is_split_case === 'yes';

    // For split case products, check if quantity is valid split case amount
    if (isSplitCase && item.case_pack != null && item.case_pack > 0) {
      const fullCase = item.case_pack;
      const halfCase = Math.floor(item.case_pack / 2);

      // Valid quantities are: halfCase, fullCase, or multiples of halfCase
      // Check if quantity is NOT a valid split case amount
      return item.quantity !== halfCase && item.quantity !== fullCase && item.quantity % halfCase !== 0;
    }

    // For non-split case products, use minimum_units or case_pack
    // If minimum_units is set, use it
    if (item.minimum_units != null && item.minimum_units > 0) {
      return item.quantity < item.minimum_units;
    }

    // If minimum_units is empty but case_pack exists, use case_pack as minimum
    if ((!item.minimum_units || item.minimum_units === 0) &&
        item.case_pack != null &&
        item.case_pack > 0) {
      return item.quantity < item.case_pack;
    }

    return false;
  };

  // Helper function to check if case minimum warning should be shown
  const shouldShowCaseMinimumWarning = (item) => {
    return (
      item.pricing_mode === 'case' &&
      item.case_minimum != null &&
      item.case_minimum > 0 &&
      item.quantity < item.case_minimum
    );
  };

  // Helper function to check if minimum cost warning should be shown
  const shouldShowMinimumCostWarning = (item) => {
    if (!item.minimum_cost || item.minimum_cost <= 0) return false;

    const price = item.pricing_mode === 'unit'
      ? (item.wholesale_unit_price || 0)
      : (item.wholesale_case_price || 0);
    const totalPrice = price * item.quantity;

    return totalPrice < parseFloat(item.minimum_cost);
  };

  // Calculate case pack groups with memoization for performance
  const casePackGroups = useMemo(() => {
    const groups = aggregateUnitsByVendorAndCasePack(cart);
    console.log('Case Pack Groups:', groups);
    console.log('Cart items:', cart.map(item => ({
      id: item.id,
      name: item.product_name,
      pricing_mode: item.pricing_mode,
      case_pack: item.case_pack,
      quantity: item.quantity
    })));
    return groups;
  }, [cart]);

  // Calculate split case groups with memoization
  const splitCaseGroups = useMemo(() => {
    const groups = aggregateSplitCaseByVendorAndCasePack(cart);
    console.log('Split Case Groups:', groups);
    return groups;
  }, [cart]);

  // Helper function to check if split case aggregation warning should be shown
  const shouldShowSplitCaseAggregateWarning = (item, splitGroups) => {
    if (item.pricing_mode !== 'unit') return false;

    const isSplitCase = item.is_split_case === true ||
                       item.is_split_case === 1 ||
                       item.is_split_case === 'Yes' ||
                       item.is_split_case === 'yes';

    if (!isSplitCase || !item.case_pack || item.case_pack <= 0) return false;

    const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}_split`;
    const group = splitGroups[groupKey];

    if (!group) return false;

    return !group.is_valid;
  };

  // Helper function to get split case aggregate data
  const getSplitCaseAggregateData = (item, splitGroups) => {
    const groupKey = `${item.vendor_name || 'unknown'}_${item.case_pack}_split`;
    const group = splitGroups[groupKey];

    if (!group) return null;

    const remainder = group.total_units % group.case_pack;
    const unitsNeeded = remainder > 0 ? group.case_pack - remainder : 0;

    return {
      total_units: group.total_units,
      full_case_pack: group.case_pack,
      remainder: remainder,
      units_needed: unitsNeeded,
      products_in_group: group.items.length,
      is_part_of_group: group.items.length > 1
    };
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="card text-center py-16">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Purchase Order is Empty</h2>
          <p className="text-lg text-gray-600 mb-8">Add some products to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="btn-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Group cart items by vendor
  const groupedByVendor = cart.reduce((groups, item) => {
    const vendorName = item.vendor_name || 'Unknown Vendor';
    if (!groups[vendorName]) {
      groups[vendorName] = [];
    }
    groups[vendorName].push(item);
    return groups;
  }, {});

  // Calculate subtotal for each vendor
  const getVendorSubtotal = (items) => {
    return items.reduce((total, item) => {
      const price = item.pricing_mode === 'unit'
        ? (item.wholesale_unit_price || 0)
        : (item.wholesale_case_price || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="page-title mb-6">Purchase Order</h1>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
          <p className="font-semibold text-lg">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items Grouped by Vendor */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedByVendor).map(([vendorName, items]) => {
            const vendorSubtotal = getVendorSubtotal(items);

            return (
              <div key={vendorName} className="space-y-4">
                {/* Vendor Header */}
                <div className="bg-primary-600 text-white px-6 py-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">{vendorName}</h2>
                    <div className="text-right">
                      <p className="text-xs opacity-90">Vendor Subtotal</p>
                      <p className="text-lg font-bold">${vendorSubtotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Items for this vendor */}
                {items.map(item => {
                  const price = item.pricing_mode === 'unit'
                    ? (item.wholesale_unit_price || 0)
                    : (item.wholesale_case_price || 0);
                  const itemTotal = price * item.quantity;

                  return (
                    <div key={item.id} className="card p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Product Image */}
                        <img
                          src={item.product_image || 'https://via.placeholder.com/150'}
                          alt={item.product_name}
                          className="w-full sm:w-24 h-24 object-cover rounded-lg"
                        />

                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-gray-900 mb-1">{item.product_name}</h3>

                          {/* Pricing Mode Dropdown */}
                          <div className="mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <label htmlFor={`pricing-mode-${item.id}`} className="text-sm text-gray-600">
                                Order by:
                              </label>
                              <select
                                id={`pricing-mode-${item.id}`}
                                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={item.pricing_mode || 'case'}
                                onChange={(e) => updatePricingMode(item.id, e.target.value)}
                              >
                                <option value="case">By Case</option>
                                <option value="unit">By Unit</option>
                              </select>
                              <span className="text-sm font-semibold text-primary-600">
                                ${parseFloat(price).toFixed(2)} per {item.pricing_mode === 'unit' ? 'unit' : 'case'}
                              </span>
                            </div>

                            {/* Show case minimum info below pricing mode */}
                            {item.pricing_mode === 'case' && item.case_minimum && item.case_minimum > 0 && (
                              <div className="mt-1 text-xs text-gray-600">
                                <span className="font-semibold">Case Minimum:</span> {item.case_minimum} case{item.case_minimum > 1 ? 's' : ''}
                              </div>
                            )}

                            {/* Show minimum units info below pricing mode */}
                            {item.pricing_mode === 'unit' && (() => {
                              // Show minimum_units if set, otherwise show case_pack as minimum
                              if (item.minimum_units && item.minimum_units > 0) {
                                return (
                                  <div className="mt-1 text-xs text-gray-600">
                                    <span className="font-semibold">Minimum Units:</span> {item.minimum_units} unit{item.minimum_units > 1 ? 's' : ''}
                                  </div>
                                );
                              } else if (item.case_pack && item.case_pack > 0) {
                                return (
                                  <div className="mt-1 text-xs text-gray-600">
                                    <span className="font-semibold">Minimum Units (Case Pack):</span> {item.case_pack} unit{item.case_pack > 1 ? 's' : ''}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center">
                              <label htmlFor={`qty-${item.id}`} className="font-semibold text-gray-700 mr-2 text-sm">
                                Qty:
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-base"
                                >
                                  −
                                </button>
                                <input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-20 text-center input text-sm py-1"
                                />
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-base"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 text-right">
                              <p className="text-xs text-gray-600">Item Total</p>
                              <p className="text-base font-bold text-gray-900">
                                ${itemTotal.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Case Pack Warning (UNIT mode) */}
                          {shouldShowCasePackWarning(item, casePackGroups) && (() => {
                            const warningData = getCasePackWarningData(item, casePackGroups);
                            if (!warningData) return null;

                            return (
                              <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⚠️ Case Pack Incomplete ({warningData.current_units}/{warningData.required_units} units)
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    {warningData.is_part_of_group ? (
                                      <>Add <strong>{warningData.units_needed}</strong> more units from similar products to complete the case pack.</>
                                    ) : (
                                      <>
                                        This product requires <strong>{warningData.required_units}</strong> units per case pack.
                                        You currently have <strong>{warningData.current_units}</strong> units.
                                        Add <strong>{warningData.units_needed}</strong> more units to complete the case pack.
                                        <br />
                                        <span className="text-xs mt-1 block">💡 Tip: You can combine with similar products from {item.vendor_name} with the same case pack size ({warningData.required_units} units) to meet this requirement.</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Case Minimum Warning */}
                          {shouldShowCaseMinimumWarning(item) && (
                            <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-yellow-800">
                                  Case Minimum Not Met
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                  Please order at least <strong>{item.case_minimum}</strong> case{item.case_minimum > 1 ? 's' : ''}.
                                  Currently ordering <strong>{item.quantity}</strong> case{item.quantity > 1 ? 's' : ''}.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Split Case Aggregate Warning */}
                          {shouldShowSplitCaseAggregateWarning(item, splitCaseGroups) && (() => {
                            const aggregateData = getSplitCaseAggregateData(item, splitCaseGroups);
                            if (!aggregateData) return null;

                            return (
                              <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⚠️ Split Case Requirement Not Met
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    {aggregateData.is_part_of_group ? (
                                      <>
                                        You have <strong>{aggregateData.total_units}</strong> units total across <strong>{aggregateData.products_in_group}</strong> split case products from {item.vendor_name}.
                                        The total must be divisible by <strong>{aggregateData.full_case_pack}</strong> (full case).
                                        Add <strong>{aggregateData.units_needed}</strong> more units to complete the requirement.
                                      </>
                                    ) : (
                                      <>
                                        This split case product requires the total quantity to be divisible by <strong>{aggregateData.full_case_pack}</strong> (full case).
                                        You currently have <strong>{aggregateData.total_units}</strong> units.
                                        Add <strong>{aggregateData.units_needed}</strong> more units to meet the requirement.
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Minimum Units Warning (for non-split case or individual quantity validation) */}
                          {shouldShowMinimumUnitsWarning(item) && (() => {
                            // Check if split case is enabled
                            const isSplitCase = item.is_split_case === true ||
                                               item.is_split_case === 1 ||
                                               item.is_split_case === 'Yes' ||
                                               item.is_split_case === 'yes';

                            // For split case products
                            if (isSplitCase && item.case_pack != null && item.case_pack > 0) {
                              const fullCase = item.case_pack;
                              const halfCase = Math.floor(item.case_pack / 2);

                              return (
                                <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-yellow-800">
                                      Invalid Split Case Quantity
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                      This product allows split case. Please order <strong>{halfCase}</strong> units (half case) or <strong>{fullCase}</strong> units (full case), or multiples of <strong>{halfCase}</strong>.
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            // For non-split case products
                            const effectiveMinimum = (item.minimum_units != null && item.minimum_units > 0)
                              ? item.minimum_units
                              : item.case_pack;

                            return (
                              <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    Minimum Units Not Met
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    Please order at least <strong>{effectiveMinimum}</strong> unit{effectiveMinimum > 1 ? 's' : ''}.
                                    Currently ordering <strong>{item.quantity}</strong> unit{item.quantity > 1 ? 's' : ''}.
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Minimum Cost Warning */}
                          {shouldShowMinimumCostWarning(item) && (() => {
                            const price = item.pricing_mode === 'unit'
                              ? (item.wholesale_unit_price || 0)
                              : (item.wholesale_case_price || 0);
                            const totalPrice = price * item.quantity;

                            return (
                              <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 px-4 py-3 rounded-r-lg flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    Minimum Cost Not Met
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    This product requires a minimum order cost of <strong>${parseFloat(item.minimum_cost).toFixed(2)}</strong>.
                                    Current total: <strong>${totalPrice.toFixed(2)}</strong>
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Replacement Preference Display */}
                          <div className="mt-3 border-t border-gray-200 pt-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-1">If unavailable:</p>
                                <p className="text-sm text-gray-900">
                                  {getReplacementPreferenceLabel(item.unavailable_action || 'curate')}
                                </p>
                                {(item.unavailable_action === 'replace_same_vendor' ||
                                  item.unavailable_action === 'replace_other_vendors') &&
                                 item.replacement_product_id && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Replacement: <span className="font-medium">{getReplacementProductName(item)}</span>
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleEditReplacementPreference(item)}
                                className="text-xs text-primary-600 hover:text-primary-700 font-semibold ml-2"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="self-start p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors sm:ml-auto"
                          title="Remove item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Items:</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Total Units:</span>
                <span className="font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              {/* Vendor Subtotals Breakdown */}
              <div className="border-t-2 border-gray-200 pt-3">
                <h3 className="font-semibold text-gray-900 mb-2 text-base">Subtotals by Vendor:</h3>
                <div className="space-y-1.5">
                  {Object.entries(groupedByVendor).map(([vendorName, items]) => {
                    const vendorSubtotal = getVendorSubtotal(items);
                    return (
                      <div key={vendorName} className="flex justify-between text-sm">
                        <span className="text-gray-700">{vendorName}:</span>
                        <span className="font-semibold text-gray-900">
                          ${vendorSubtotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {user && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Order will be placed as:</p>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="btn-primary w-full mb-4"
            >
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>

            <button
              onClick={() => navigate('/products')}
              className="btn-secondary w-full"
            >
              Continue Shopping
            </button>

            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Note:</strong> After submitting, you'll receive an email confirmation with your batch order number.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Replacement Preference Modal */}
      <ReplacementPreferenceModal
        item={editingReplacementItem}
        isOpen={showReplacementModal}
        onClose={handleCloseReplacementModal}
        onSave={handleSaveReplacementPreference}
      />
    </div>
  );
};

export default CartPage;
