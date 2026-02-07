import { useState, useEffect, useRef } from 'react';

const ComboBoxInput = ({ value, onChange, options = [], placeholder = '', multi = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Parse multi-value (comma-separated string) into array
  const selectedItems = multi
    ? (value || '').split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // For single mode, sync inputValue with value
  useEffect(() => {
    if (!multi) {
      setInputValue(value || '');
    }
  }, [value, multi]);

  // Filter options based on input
  useEffect(() => {
    const search = inputValue.toLowerCase().trim();
    let filtered = options.filter(opt => {
      const optLower = opt.toLowerCase();
      if (!search) return true;
      return optLower.includes(search);
    });
    // In multi mode, exclude already-selected items
    if (multi) {
      filtered = filtered.filter(opt => !selectedItems.includes(opt));
    }
    setFilteredOptions(filtered);
  }, [inputValue, options, value, multi]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        // In single mode, if user typed something not in the list, keep it
        if (!multi && inputValue !== (value || '')) {
          onChange(inputValue);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, multi, onChange]);

  const handleSelect = (option) => {
    if (multi) {
      const newItems = [...selectedItems, option];
      onChange(newItems.join(', '));
      setInputValue('');
    } else {
      onChange(option);
      setInputValue(option);
      setShowDropdown(false);
    }
    inputRef.current?.focus();
  };

  const handleRemove = (item) => {
    const newItems = selectedItems.filter(i => i !== item);
    onChange(newItems.join(', '));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
    if (!multi) {
      onChange(e.target.value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;

      if (multi) {
        if (!selectedItems.includes(trimmed)) {
          const newItems = [...selectedItems, trimmed];
          onChange(newItems.join(', '));
        }
        setInputValue('');
      } else {
        onChange(trimmed);
        setShowDropdown(false);
      }
    }
  };

  // Check if input value is a new item (not in options)
  const isNewItem = inputValue.trim() &&
    !options.some(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) &&
    (multi ? !selectedItems.includes(inputValue.trim()) : true);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected tags for multi mode */}
      {multi && selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="text-primary-600 hover:text-primary-900 font-bold text-xs leading-none"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="input w-full"
        placeholder={multi && selectedItems.length > 0 ? 'Add more...' : placeholder}
      />

      {/* Dropdown */}
      {showDropdown && (filteredOptions.length > 0 || isNewItem) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {/* Add new item option */}
          {isNewItem && (
            <button
              type="button"
              onClick={() => {
                if (multi) {
                  const trimmed = inputValue.trim();
                  if (!selectedItems.includes(trimmed)) {
                    const newItems = [...selectedItems, trimmed];
                    onChange(newItems.join(', '));
                  }
                  setInputValue('');
                } else {
                  onChange(inputValue.trim());
                  setShowDropdown(false);
                }
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 text-primary-700 font-medium border-b border-gray-100"
            >
              + Add "{inputValue.trim()}"
            </button>
          )}

          {/* Existing options */}
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                !multi && option === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-900'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComboBoxInput;
