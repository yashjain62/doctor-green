import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LangContext } from '../App';

const HEALTHY_TIPS = [
  '💧 Water at the base, not on leaves',
  '☀️ Ensure 6-8 hours of sunlight daily',
  '🪴 Check soil moisture before watering',
  '✂️ Prune dead or yellowing leaves promptly',
  '🌱 Apply balanced fertilizer monthly',
];

export default function Result({ result, scanHistory }) {
  const { t } = useContext(LangContext);
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="page-container" style={{textAlign:'center', paddingTop:80}}>
        <div style={{fontSize:64, marginBottom:16}}>🍃</div>
        <p style={{color:'var(--text-muted)', fontSize:16, marginBottom:24}}>{t.no_result}</p>
        <button className="btn-primary" onClick={() => navigate('/detect')}>
          🔍 {t.detect_btn}
        </button>
      </div>
    );
  }

  const { status, top_prediction, confidence, description, prevention, supplement, buy_link, top3, imageUrl, note } = result;
  const isHealthy = status === 'healthy';
  const displayName = (top_prediction || '').replace(/___/g, ' — ').replace(/_/g, ' ');

  return (
    <div className="result-page">
      {/* Demo mode banner */}
      {result.demo_mode && (
        <div style={{background:'rgba(234,179,8,0.13)', border:'1px solid rgba(234,179,8,0.35)', borderRadius:14, padding:'14px 20px', marginBottom:22, display:'flex', alignItems:'flex-start', gap:12}}>
          <span style={{fontSize:22, flexShrink:0}}>🧪</span>
          <div>
            <p style={{color:'#fde68a', fontWeight:700, fontSize:14, marginBottom:4}}>Demo Mode — No Trained Model Detected</p>
            <p style={{color:'rgba(253,230,138,0.8)', fontSize:13, lineHeight:1.6}}>
              The result below is a <strong>simulated prediction</strong>. For real AI-powered detection, run:<br/>
              <code style={{background:'rgba(0,0,0,0.3)', padding:'2px 8px', borderRadius:6, fontSize:12}}>cd backend &amp;&amp; python train_model.py</code>
            </p>
          </div>
        </div>
      )}

      {isHealthy ? (
        <div className="healthy-banner">
          <span className="healthy-icon">🌿</span>
          <h2 className="healthy-heading">{t.healthy_title}</h2>
          <p style={{color:'var(--text-muted)', marginBottom:16}}>{t.healthy_tips}</p>
          <ul style={{textAlign:'left', display:'inline-block', color:'rgba(255,255,255,0.85)', fontSize:14}}>
            {HEALTHY_TIPS.map((tip, i) => <li key={i} style={{marginBottom:6, listStyle:'none'}}>{tip}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="result-header">
        <div className="result-img-wrap">
          {imageUrl
            ? <img src={imageUrl} alt="scanned leaf" />
            : <div style={{width:'100%', height:280, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:64}}>🍃</div>
          }
        </div>

        <div className="result-info">
          <div className="result-status-wrap">
            <span className={`status-badge ${isHealthy ? 'healthy' : 'diseased'}`}>
              {isHealthy ? '✓ ' + t.status_healthy : '● ' + t.status_diseased}
            </span>
          </div>
          <h2 className="result-disease">🍃 {displayName}</h2>
          <p className="result-conf-row">{t.confidence}: <strong style={{color:'#1a9e56'}}>{confidence}%</strong></p>
          <div className="result-conf-bar">
            <div className="result-conf-fill" style={{width:`${Math.min(confidence,100)}%`}} />
          </div>
          {description && (
            <p className="result-desc"><strong>{t.description}:</strong> {description}</p>
          )}
          {prevention && !isHealthy && (
            <div className="result-prevention">
              <strong>{t.prevention}:</strong> {prevention}
            </div>
          )}
          {supplement && !isHealthy && (
            <div className="result-supp">
              <div className="supp-ico">🧴</div>
              <span className="supp-label" style={{flex:1, fontSize:14, fontWeight:600, color:'#0f2d1a'}}>{supplement}</span>
              <a href={buy_link || '#'} target="_blank" rel="noreferrer" className="amazon-btn">{t.buy_now} ›</a>
            </div>
          )}
        </div>
      </div>

      <div className="result-bottom">
        {/* Top 3 Predictions */}
        <div className="predictions-card">
          <p className="predictions-title">{t.top_predictions}</p>
          {(top3 || []).map((p, i) => (
            <div key={i} className="pred-item">
              <div className={`pred-rank ${i === 0 ? 'rank-1' : ''}`}>{i + 1}</div>
              <div className="pred-details">
                <div className="pred-name">{(p.class || '').replace(/___/g, ' — ').replace(/_/g, ' ')}</div>
                <div className="pred-bar"><div className="pred-bar-inner" style={{width:`${Math.min(p.confidence,100)}%`}} /></div>
              </div>
              <span className="pred-pct">{p.confidence}%</span>
            </div>
          ))}
        </div>

        {/* Last 5 Scans */}
        <div className="history-card">
          <p className="history-title">{t.last_scans}</p>
          {scanHistory.length === 0 ? (
            <p className="history-empty">No previous scans yet.</p>
          ) : (
            <>
              <div className="history-items">
                {scanHistory.map((h, i) => (
                  h.imageUrl
                    ? <img key={i} src={h.imageUrl} alt={`scan ${i}`} className="history-thumb" title={(h.top_prediction || '').replace(/___/g,' — ')} />
                    : <div key={i} className="history-thumb" style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>🍃</div>
                ))}
              </div>
              <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:10}}>
                {scanHistory.slice(0,3).map((h, i) => (
                  <div key={i} style={{fontSize:11, color:'var(--text-muted)', marginBottom:4}}>
                    {(h.top_prediction || '').replace(/___/g,' — ').slice(0,36)} • {h.confidence}%
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{textAlign:'center', marginTop:28}}>
        <button className="btn-primary" onClick={() => navigate('/detect')}>
          🔍 Scan Another Plant
        </button>
      </div>
    </div>
  );
}
