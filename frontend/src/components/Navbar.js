import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LangContext } from '../App';

export default function Navbar() {
  const { lang, setLang, t } = useContext(LangContext);
  const { pathname } = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-leaf" />
        {lang === 'hi' ? 'डॉक्टर ग्रीन' : 'Doctor Green'}
      </Link>

      <ul className="nav-links">
        <li><Link to="/" className={pathname === '/' ? 'active' : ''}>{t.home}</Link></li>
        <li><Link to="/detect" className={pathname === '/detect' ? 'active' : ''}>{t.detect}</Link></li>
        <li><Link to="/supplements" className={pathname === '/supplements' ? 'active' : ''}>{t.supplements}</Link></li>
        <li><Link to="/contact" className={pathname === '/contact' ? 'active' : ''}>{t.contact}</Link></li>
      </ul>

      <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
        {lang === 'en' ? 'EN / हिंदी' : 'हिंदी / EN'}
      </button>
    </nav>
  );
}
