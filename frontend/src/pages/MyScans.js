// src/pages/MyScans.js
import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LangContext } from '../App';

export default function MyScans() {
  const { currentUser, getUserScans } = useAuth();
  const { t } = useContext(LangContext);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (currentUser) {
        const data = await getUserScans();
        setScans(data);
      }
      setLoading(false);
    }
    load();
  }, [currentUser, getUserScans]);

  if (!currentUser) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-serif)', fontSize: 28, marginBottom: 12 }}>
          Sign in to view your scans
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
          Create an account to save and access your scan history from any device.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>
            Sign In
          </Link>
          <Link to="/signup" style={{
            textDecoration: 'none', padding: '12px 28px',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            borderRadius: 50, color: '#fff', fontWeight: 600, fontSize: 14
          }}>
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
      <h1 className="page-title">My Scans</h1>
      <p className="page-subtitle" style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
        Welcome back, {currentUser.displayName || currentUser.email} 👋
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your scans...</p>
        </div>
      ) : scans.length === 0 ? (
        <div style={{
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '60px 32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
          <h3 style={{ color: '#fff', fontSize: 20, marginBottom: 10 }}>No scans yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Upload your first leaf image to get started!
          </p>
          <Link to="/detect" className="btn-primary" style={{ textDecoration: 'none' }}>
            🔍 Detect Disease
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scans.map((scan, i) => {
            const isHealthy = scan.status === 'healthy';
            const displayName = (scan.top_prediction || '').replace(/___/g, ' — ').replace(/_/g, ' ');
            const date = scan.timestamp?.toDate
              ? scan.timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Recent';

            return (
              <div key={scan.id || i} style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: isHealthy ? '#dcfce7' : '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0
                }}>
                  {isHealthy ? '✅' : '🍃'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 700, fontSize: 14, color: '#0f2d1a',
                    marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {displayName || 'Unknown'}
                  </p>
                  <p style={{ fontSize: 12, color: '#666' }}>
                    Confidence: <strong style={{ color: '#1a9e56' }}>{scan.confidence}%</strong>
                    <span style={{ margin: '0 6px', color: '#ccc' }}>•</span>
                    {date}
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: isHealthy ? '#dcfce7' : '#fee2e2',
                  color: isHealthy ? '#166534' : '#991b1b',
                  flexShrink: 0
                }}>
                  {isHealthy ? 'HEALTHY' : 'DISEASED'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link to="/detect" className="btn-primary" style={{ textDecoration: 'none' }}>
          🔍 New Scan
        </Link>
      </div>
    </div>
  );
}
