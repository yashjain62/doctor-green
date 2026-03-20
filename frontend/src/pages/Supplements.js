import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LangContext } from '../App';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ICONS = ['🌿', '🧪', '🔵', '🌱', '🍃', '🧴', '💧', '⚗️', '🌾', '🌻'];

const FALLBACK = [
  { supplement: 'Neem Oil', class: 'General', buy_link: 'https://www.amazon.in/s?k=neem+oil' },
  { supplement: 'Fungicide Spray', class: 'General', buy_link: 'https://www.amazon.in/s?k=fungicide+spray' },
  { supplement: 'Copper Fungicide', class: 'General', buy_link: 'https://www.amazon.in/s?k=copper+fungicide' },
  { supplement: 'Multi-Nutrient Fertilizer', class: 'General', buy_link: 'https://www.amazon.in/s?k=multi+nutrient+fertilizer' },
  { supplement: 'Neem Oil Spray', class: 'Tomato', buy_link: 'https://www.amazon.in/s?k=neem+oil+spray' },
  { supplement: 'Mancozeb Fungicide', class: 'Potato', buy_link: 'https://www.amazon.in/s?k=mancozeb+fungicide' },
  { supplement: 'Rust Protection Spray', class: 'Apple', buy_link: 'https://www.amazon.in/s?k=rust+protection+spray' },
  { supplement: 'Bordeaux Mixture', class: 'Grape', buy_link: 'https://www.amazon.in/s?k=bordeaux+mixture' },
];

export default function Supplements() {
  const { t } = useContext(LangContext);
  const [supps, setSupps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/supplements`)
      .then(({ data }) => setSupps(data.supplements || FALLBACK))
      .catch(() => setSupps(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="supps-page">
      <h1 className="page-title">{t.supplements_title}</h1>
      <p className="page-subtitle" style={{color:'var(--text-muted)', marginBottom:32}}>
        Recommended treatments and supplements for plant diseases
      </p>

      {loading ? (
        <div style={{textAlign:'center', padding:40}}>
          <div className="spinner" style={{margin:'0 auto'}} />
        </div>
      ) : (
        <div className="supps-grid">
          {supps.map((s, i) => (
            <div key={i} className="supp-card">
              <div className="supp-card-icon">{ICONS[i % ICONS.length]}</div>
              <p className="supp-card-name">{s.supplement}</p>
              <p className="supp-card-class">{(s.class || '').replace(/___/g,' — ').replace(/_/g,' ')}</p>
              <button
                className="supp-card-btn"
                onClick={() => window.open(s.buy_link || 'https://www.amazon.in', '_blank')}
              >
                {t.buy_now}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
