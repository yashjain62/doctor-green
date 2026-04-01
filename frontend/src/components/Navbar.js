// src/components/Navbar.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { lang, setLang, t } = useContext(LangContext);
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setProfileOpen(false);
    setMenuOpen(false);
    try { await logout(); navigate('/'); } catch {}
  }

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : currentUser?.email?.[0]?.toUpperCase() || 'U';

  const navLinks = [
    { to: '/', label: t.home },
    { to: '/detect', label: t.detect },
    { to: '/supplements', label: t.supplements },
    { to: '/contact', label: t.contact },
    ...(currentUser ? [{ to: '/my-scans', label: 'My Scans' }] : []),
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
        <div className="nav-leaf" />
        {lang === 'hi' ? 'डॉक्टर ग्रीन' : 'Doctor Green'}
      </Link>

      <ul className="nav-links">
        {navLinks.map(link => (
          <li key={link.to}>
            <Link to={link.to} className={pathname === link.to ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-right">
        <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
          {lang === 'en' ? 'EN / हिंदी' : 'हिंदी / EN'}
        </button>

        {currentUser ? (
          <div className="nav-profile" ref={profileRef}>
            <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)} aria-label="Profile">
              <div className="profile-avatar">{initials}</div>
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-avatar-lg">{initials}</div>
                  <div>
                    <p className="profile-name">{currentUser.displayName || 'User'}</p>
                    <p className="profile-email">{currentUser.email}</p>
                  </div>
                </div>
                <hr className="profile-divider" />
                <Link to="/my-scans" className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                  📋 My Scans
                </Link>
                <button className="profile-menu-item profile-logout" onClick={handleLogout}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="nav-auth-login">Sign In</Link>
            <Link to="/signup" className="nav-auth-signup">Sign Up</Link>
          </div>
        )}

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-link ${pathname === link.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mobile-divider" />
          <button
            className="mobile-lang"
            onClick={() => { setLang(lang === 'en' ? 'hi' : 'en'); setMenuOpen(false); }}
          >
            🌐 {lang === 'en' ? 'Switch to हिंदी' : 'Switch to English'}
          </button>
          {currentUser ? (
            <button className="mobile-logout" onClick={handleLogout}>
              🚪 Sign Out
            </button>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-signin" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" className="mobile-signup-btn" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
