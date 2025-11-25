import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext';
import FilterFieldList from './FilterFieldList';
import FilterFieldDetail from './FilterFieldDetail';

const FilterSidebar = ({ className = '' }) => {
  const { sidebarOpen } = useSidebar();
  const [selectedFilterField, setSelectedFilterField] = useState(null);

  const handleSelectField = (field) => {
    setSelectedFilterField(field);
  };

  const handleBack = () => {
    setSelectedFilterField(null);
  };

  return (
    <div className={`w-80 flex-shrink-0 ${className}`}>
      <div
        className={`fixed top-16 w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col z-10 pt-3 transition-all duration-300 ${
          sidebarOpen ? 'left-64' : 'left-20'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        {/* Filter Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedFilterField ? (
            /* Filter List View */
            <div className="flex-1 flex flex-col px-3 overflow-hidden">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Filters</h2>
              <FilterFieldList
                onSelectField={handleSelectField}
              />
            </div>
          ) : (
            /* Filter Detail View */
            <div className="flex-1 flex flex-col px-3 overflow-hidden">
              <FilterFieldDetail
                field={selectedFilterField}
                onApply={handleBack}
                onBack={handleBack}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
