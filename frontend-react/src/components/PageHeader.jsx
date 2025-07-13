import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import './PageHeader.scss';

const PageHeader = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="page-header">
      <div className="page-header-left">
        <img src={logo} alt="Navicare logo" className="page-header-logo" />
        <span className="page-header-title">Navicare</span>
      </div>
      <div
        className="page-header-right"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
        tabIndex={0}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        style={{ position: 'relative' }}
      >
        <div className="page-header-avatar">B</div>
        {dropdownOpen && (
          <div className="page-header-dropdown">
            <div className="dropdown-item">View Benefits</div>
            <div className="dropdown-divider" />
            <div className="dropdown-item">Edit Benefits</div>
            <div className="dropdown-divider" />
            <div className="dropdown-item">Sign Out</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader; 