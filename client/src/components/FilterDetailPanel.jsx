import FilterFieldDetail from './FilterFieldDetail';

const FilterDetailPanel = ({ field, isOpen, onBack }) => {
  if (!isOpen || !field) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onBack}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col p-6">
        <FilterFieldDetail
          field={field}
          onApply={onBack}
          onBack={onBack}
        />
      </div>
    </>
  );
};

export default FilterDetailPanel;
