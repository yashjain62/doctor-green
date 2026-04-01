import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LangContext } from '../App';

export default function Home() {
  const { t } = useContext(LangContext);

  return (
    <section>
      <div className="hero-section">
        <div className="hero-left">
          <div className="hero-badge">🌿 AI-Powered Plant Health</div>
          <h1 className="hero-title">
            {t.hero_title.split(' ').length > 1
              ? <>{t.hero_title.split(' ')[0]}<br /><em>{t.hero_title.split(' ').slice(1).join(' ')}</em></>
              : <>{t.hero_title}<br /><em>Green</em></>
            }
          </h1>
          <p className="hero-desc">{t.hero_desc}</p>
          <Link to="/detect" className="btn-primary">
            <span>🌱</span> {t.get_started}
          </Link>
        </div>

        <div className="glass-card hero-demo">
          <div className="upload-zone-demo">
            <span className="upload-icon">🍃</span>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>Leaf.jpg</p>
          </div>
          <div className="demo-result">
            <div className="result-status-wrap">
              <span className="status-badge diseased">● DISEASED</span>
            </div>
            <p className="demo-disease-name">🍃 Apple — Cedar apple rust</p>
            <p className="conf-row">Confidence: <strong style={{color:'#1a9e56'}}>99.1%</strong></p>
            <div className="conf-bar"><div className="conf-fill" style={{width:'99.1%'}} /></div>
            <p className="conf-row" style={{marginBottom:12}}>
              <strong>Description:</strong> Orange rust spots on leaves.
            </p>
            <div className="supp-row">
              <div className="supp-ico">🧴</div>
              <span className="supp-label">Rust Protection Spray</span>
              <a href="https://www.amazon.in/s?k=rust+protection+spray" className="amazon-btn" target="_blank" rel="noreferrer">
                Buy ›
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards — mobile-friendly grid */}
      <div className="features-grid">
        {[
          { icon: '🔬', title: 'Advanced AI', desc: 'ResNet50 deep learning model trained on 87,000+ plant images across 38 disease classes.' },
          { icon: '📸', title: 'Camera & Upload', desc: 'Capture live photos or upload from gallery. Works on any device instantly.' },
          { icon: '💊', title: 'Supplement Guide', desc: 'Get targeted treatment recommendations and buy directly from Amazon.' },
        ].map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
