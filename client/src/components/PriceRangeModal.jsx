import { useState, useEffect, useCallback } from 'react';

const PriceRangeModal = ({ isOpen, onClose, onApply, currentMin, currentMax, absoluteMin, absoluteMax }) => {
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(100);

  const safeAbsMin = absoluteMin || 0;
  const safeAbsMax = absoluteMax || 1000;

  useEffect(() => {
    if (isOpen) {
      setMinVal(currentMin !== '' && currentMin !== undefined ? Number(currentMin) : safeAbsMin);
      setMaxVal(currentMax !== '' && currentMax !== undefined ? Number(currentMax) : safeAbsMax);
    }
  }, [isOpen, currentMin, currentMax, safeAbsMin, safeAbsMax]);

  const handleMinChange = useCallback((e) => {
    const value = Math.min(Number(e.target.value), maxVal - 1);
    setMinVal(value);
  }, [maxVal]);

  const handleMaxChange = useCallback((e) => {
    const value = Math.max(Number(e.target.value), minVal + 1);
    setMaxVal(value);
  }, [minVal]);

  const handleApply = () => {
    onApply(minVal, maxVal);
    onClose();
  };

  const handleReset = () => {
    onApply('', '');
    onClose();
  };

  if (!isOpen) return null;

  // Calculate percentage for slider track fill
  const range = safeAbsMax - safeAbsMin || 1;
  const leftPercent = ((minVal - safeAbsMin) / range) * 100;
  const rightPercent = ((maxVal - safeAbsMin) / range) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-primary-700">Price Range</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-6">
            {/* Price Labels */}
            <div className="flex justify-between mb-6">
              <span className="text-sm font-semibold text-gray-700">
                ${minVal.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-gray-700">
                ${maxVal.toFixed(2)}
              </span>
            </div>

            {/* Dual Range Slider */}
            <div className="relative h-8 mb-6">
              {/* Track background */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 rounded-full" />

              {/* Active track */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary-500 rounded-full"
                style={{
                  left: `${leftPercent}%`,
                  width: `${rightPercent - leftPercent}%`
                }}
              />

              {/* Min Slider */}
              <input
                type="range"
                min={safeAbsMin}
                max={safeAbsMax}
                step={1}
                value={minVal}
                onChange={handleMinChange}
                className="absolute top-0 w-full h-8 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
                style={{ zIndex: minVal > safeAbsMax - 10 ? 5 : 3 }}
              />

              {/* Max Slider */}
              <input
                type="range"
                min={safeAbsMin}
                max={safeAbsMax}
                step={1}
                value={maxVal}
                onChange={handleMaxChange}
                className="absolute top-0 w-full h-8 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
                style={{ zIndex: 4 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              RESET
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              FILTER
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PriceRangeModal;
