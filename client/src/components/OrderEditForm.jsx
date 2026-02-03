import { useState, useEffect } from 'react';
import axios from 'axios';

const OrderEditForm = ({ order, onSave, onCancel, adminEmail }) => {
  const [formData, setFormData] = useState({
    quantity: order.quantity || 0,
    pricing_mode: order.pricing_mode || 'case',
    unit_price: parseFloat(order.unit_price || 0).toFixed(2),
    case_price: parseFloat(order.case_price || 0).toFixed(2),
    admin_notes: order.admin_notes || ''
  });

  const [calculatedAmount, setCalculatedAmount] = useState(() => {
    const amount = parseFloat(order.amount || 0);
    return isNaN(amount) ? 0 : amount;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Calculate amount whenever quantity, pricing_mode, or prices change
  useEffect(() => {
    const price = formData.pricing_mode === 'unit'
      ? parseFloat(formData.unit_price || 0)
      : parseFloat(formData.case_price || 0);
    const qty = parseInt(formData.quantity) || 0;
    const amount = parseFloat((price * qty).toFixed(2));
    setCalculatedAmount(isNaN(amount) ? 0 : amount);

    // Check if there are changes from original order
    const hasModifications =
      formData.quantity !== order.quantity ||
      formData.pricing_mode !== order.pricing_mode ||
      parseFloat(formData.unit_price) !== parseFloat(order.unit_price || 0) ||
      parseFloat(formData.case_price) !== parseFloat(order.case_price || 0) ||
      formData.admin_notes !== (order.admin_notes || '');

    setHasChanges(hasModifications);
  }, [formData, order]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (parseFloat(formData.unit_price) < 0 || parseFloat(formData.case_price) < 0) {
      setError('Prices cannot be negative');
      return;
    }

    if (!hasChanges) {
      setError('No changes to save');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `http://localhost:5000/api/orders/${order.id}/modify`,
        {
          quantity: parseInt(formData.quantity),
          pricing_mode: formData.pricing_mode,
          unit_price: parseFloat(formData.unit_price),
          case_price: parseFloat(formData.case_price),
          admin_notes: formData.admin_notes.trim() || null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onSave(response.data.order);
      } else {
        setError(response.data.message || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      quantity: order.quantity || 0,
      pricing_mode: order.pricing_mode || 'case',
      unit_price: parseFloat(order.unit_price || 0).toFixed(2),
      case_price: parseFloat(order.case_price || 0).toFixed(2),
      admin_notes: order.admin_notes || ''
    });
    setError(null);
  };

  // Helper function to get human-readable replacement preference label
  const getReplacementPreferenceLabel = (action) => {
    const labels = {
      'curate': 'Cureate to replace if sold out',
      'replace_same_vendor': 'Replace with similar item under same vendor',
      'replace_other_vendors': 'Replace with similar item across other vendors',
      'remove': 'Remove it from my order'
    };
    return labels[action] || action;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Product Name (Read-only) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
        <p className="text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
          {order.product_name}
        </p>
      </div>

      {/* Vendor Name (Read-only) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Vendor</label>
        <p className="text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
          {order.vendor_name}
        </p>
      </div>

      {/* Replacement Preference (Read-only) */}
      {order.unavailable_action && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            User's Replacement Preference
          </label>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getReplacementPreferenceLabel(order.unavailable_action)}
                </p>
                {(order.unavailable_action === 'replace_same_vendor' ||
                  order.unavailable_action === 'replace_other_vendors') &&
                 order.replacement_product_name && (
                  <div className="mt-2 bg-white border border-blue-200 rounded px-2 py-1.5">
                    <p className="text-xs text-gray-600">Preferred Replacement:</p>
                    <p className="text-sm font-semibold text-gray-900">{order.replacement_product_name}</p>
                    {order.replacement_vendor_name && (
                      <p className="text-xs text-gray-600">from {order.replacement_vendor_name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This preference was set by the customer and cannot be modified by admins.
          </p>
        </div>
      )}

      {/* Two-column layout for editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formData.quantity !== order.quantity ? 'bg-yellow-50 border-yellow-400' : 'border-gray-300'
            }`}
            required
          />
        </div>

        {/* Pricing Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Pricing Mode <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.pricing_mode}
            onChange={(e) => handleInputChange('pricing_mode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formData.pricing_mode !== order.pricing_mode ? 'bg-yellow-50 border-yellow-400' : 'border-gray-300'
            }`}
            required
          >
            <option value="unit">By Unit</option>
            <option value="case">By Case</option>
          </select>
        </div>
      </div>

      {/* Two-column layout for prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unit Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Unit Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_price}
            onChange={(e) => handleInputChange('unit_price', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              parseFloat(formData.unit_price) !== parseFloat(order.unit_price || 0)
                ? 'bg-yellow-50 border-yellow-400'
                : 'border-gray-300'
            }`}
          />
        </div>

        {/* Case Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Case Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.case_price}
            onChange={(e) => handleInputChange('case_price', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              parseFloat(formData.case_price) !== parseFloat(order.case_price || 0)
                ? 'bg-yellow-50 border-yellow-400'
                : 'border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Calculated Amount Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">Calculated Total:</span>
          <div className="flex items-center gap-2">
            {calculatedAmount !== order.amount && (
              <span className="text-sm text-gray-500 line-through">
                ${parseFloat(order.amount || 0).toFixed(2)}
              </span>
            )}
            <span className="text-xl font-bold text-blue-600">
              ${(calculatedAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {formData.quantity} × ${formData.pricing_mode === 'unit' ? formData.unit_price : formData.case_price} ({formData.pricing_mode})
        </p>
      </div>

      {/* Admin Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Admin Notes (Optional)
        </label>
        <textarea
          value={formData.admin_notes}
          onChange={(e) => handleInputChange('admin_notes', e.target.value)}
          placeholder="Explain why this order was modified..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="3"
        />
      </div>

      {/* Change Indicator */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold text-yellow-800">Unsaved Changes</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!hasChanges || isSubmitting}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
            !hasChanges || isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || isSubmitting}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            !hasChanges || isSubmitting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Original Values Reference */}
      {hasChanges && (
        <div className="border-t border-gray-300 pt-3 mt-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">Original Values:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-semibold">Qty:</span> {order.quantity}
            </div>
            <div>
              <span className="font-semibold">Mode:</span> {order.pricing_mode}
            </div>
            <div>
              <span className="font-semibold">Unit Price:</span> ${parseFloat(order.unit_price || 0).toFixed(2)}
            </div>
            <div>
              <span className="font-semibold">Case Price:</span> ${parseFloat(order.case_price || 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default OrderEditForm;
