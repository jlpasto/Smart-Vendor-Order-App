import { useState, useEffect } from 'react';

const CheckboxFilterModal = ({ isOpen, onClose, title, options, selected, onApply, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLocalSelected(selected || []);
      setSearchTerm('');
    }
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (option) => {
    setLocalSelected(prev =>
      prev.includes(option)
        ? prev.filter(v => v !== option)
        : [...prev, option]
    );
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  const handleClear = () => {
    onApply([]);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-primary-700">{title}</h3>
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

          {/* Search */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
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
                placeholder={`Search ${title.replace(' Filter', '')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="flex-1 overflow-y-auto px-5 py-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No results found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 px-2 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={localSelected.includes(option)}
                      onChange={() => toggleOption(option)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-800">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              RESET
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              APPLY{localSelected.length > 0 ? ` (${localSelected.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckboxFilterModal;
