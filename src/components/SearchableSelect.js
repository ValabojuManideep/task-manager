import React, { useRef, useEffect } from "react";
import useAppStore from "../store/useAppStore";
import "./SearchableSelect.css";

export default function SearchableSelect({ options, value, onChange, placeholder = "Select..." }) {
  const isOpen = useAppStore((s) => s.searchable_isOpen);
  const setIsOpen = useAppStore((s) => s.setSearchable_isOpen);
  const searchTerm = useAppStore((s) => s.searchable_searchTerm);
  const setSearchTerm = useAppStore((s) => s.setSearchable_searchTerm);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="searchable-select" ref={dropdownRef}>
      <div className="select-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="select-arrow">{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <input
            type="text"
            className="select-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`select-option ${value === option.value ? "selected" : ""}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="select-no-results">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
