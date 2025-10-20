import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

// Header component with navigation
const Header: React.FC = () => {
  const location = useLocation();

  // Navigation items
  const navItems = [
    { path: '/', label: 'Rankings', icon: '🏆' },
    { path: '/matches', label: 'Matches', icon: '🎯' },
    { path: '/players', label: 'Players', icon: '👤' }
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            {/* <span className="brand-icon">🏸</span> */}
            {/* Desktop/tablet logo - narrow version */}
            <img src="/images/CourtScore-narrow2.jpg" alt="CourtScore Logo" className="brand-logo brand-logo-desktop" />
            {/* Mobile logo - smaller square version */}
            <img src="/images/CourtScore.jpg" alt="CourtScore Logo" className="brand-logo brand-logo-mobile" />
          </Link>
        </div>
        
        <nav className="header-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
