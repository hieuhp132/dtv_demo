import Select from "react-select";

export default function Filters({
  searchText,
  setSearchText,
  suggestions = [],
  onSuggestionClick,
  filterLocation,
  setFilterLocation,
  filterCompany,
  setFilterCompany,
  filterCategory,
  setFilterCategory,
  locationOptions,
  companyOptions,
  categoryOptions,
  selectStyles,
}) {
  return (
    <div className="filter-bar">
      <div style={{ position: 'relative', flex: 2, minWidth: '240px' }}>
        <input
          type="text"
          placeholder="Search jobs, companies, skills..."
          className="filter-input"
          style={{ width: '100%' }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        
        {suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((s, i) => (
              <div 
                key={i} 
                className="suggestion-item"
                onClick={() => onSuggestionClick(s)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <Select
        placeholder="All Locations"
        options={locationOptions}
        isClearable
        styles={selectStyles}
        value={
          filterLocation
            ? { value: filterLocation, label: filterLocation }
            : null
        }
        onChange={(opt) => setFilterLocation(opt?.value || "")}
      />

      <Select
        placeholder="All Companies"
        options={companyOptions}
        isClearable
        styles={selectStyles}
        value={
          filterCompany ? { value: filterCompany, label: filterCompany } : null
        }
        onChange={(opt) => setFilterCompany(opt?.value || "")}
      />

      <Select
        placeholder="Filter By Keywords"
        options={categoryOptions}
        isClearable
        styles={selectStyles}
        value={
          filterCategory
            ? { value: filterCategory, label: filterCategory }
            : null
        }
        onChange={(opt) => setFilterCategory(opt?.value || "")}
      />
    </div>
  );
}
