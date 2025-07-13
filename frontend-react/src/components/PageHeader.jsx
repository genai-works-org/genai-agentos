import React, { useState } from 'react';
import logo from '../assets/logo.svg';
import './PageHeader.scss';
import { useCookies } from 'react-cookie';
import { useNavigate } from 'react-router-dom';

const PageHeader = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [, , removeCookie] = useCookies(['username']);
  const navigate = useNavigate();

  const handleSignOut = () => {
    removeCookie('username', { path: '/' });
    window.location.reload();
  };

  const handleEditBenefits = () => {
    navigate('/intakeprocess');
  };

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
            <div className="dropdown-item" onClick={handleEditBenefits}>Edit Benefits</div>
            <div className="dropdown-divider" />
            <div className="dropdown-item" onClick={handleSignOut}>Sign Out</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader; 