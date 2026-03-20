import React, { useContext } from 'react';
import { LangContext } from '../App';

export default function Footer() {
  const { t } = useContext(LangContext);
  return (
    <footer className="footer">
      🌿 <span>{t.footer_msg}</span>
    </footer>
  );
}
