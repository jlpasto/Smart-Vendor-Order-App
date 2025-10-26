import { useFilter } from '../context/FilterContext';

const FilterIcon = ({ onClick }) => {
  const { getActiveFilterCount } = useFilter();
  const activeCount = getActiveFilterCount();

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="Filter products"
      aria-label="Filter products"
    >
      {/* Filter Icon */}
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>

      {/* Active Filter Badge */}
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default FilterIcon;
