import React, { useContext, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Detect({ setResult, addToHistory }) {
  const { t } = useContext(LangContext);
  const { saveScanToFirestore, currentUser } = useAuth();
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
    setCameraOn(false);
    stopCamera();
  };

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch {
      setError('Camera not available. Please upload an image instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(tr => tr.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      setImage(blob);
      setPreview(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg', 0.9);
  }, []);

  const detect = async () => {
    if (!image) { setError('Please select or capture an image first.'); return; }
    setLoading(true); setError(''); setSlowServer(false);

    // Show wake-up message after 8 seconds (Render free tier may be sleeping)
    const slowTimer = setTimeout(() => setSlowServer(true), 8000);

    try {
      const formData = new FormData();
      formData.append('image', image);
      const { data } = await axios.post(`${API_URL}/predict`, formData, { timeout: 120000 });
      clearTimeout(slowTimer);

      setResult({ ...data, imageUrl: preview });
      addToHistory({ ...data, imageUrl: preview, timestamp: Date.now() });

      // Save to Firestore if user is logged in
      if (currentUser && saveScanToFirestore) {
        await saveScanToFirestore({ ...data });
      }

      navigate('/result');
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.response?.data?.error || 'Failed to connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
      setSlowServer(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">{t.detect}</h1>
      <p className="page-subtitle">{t.hero_sub} — Upload or capture a leaf image</p>

      {!currentUser && (
        <div style={{
          background: 'rgba(255,153,0,0.12)', border: '1px solid rgba(255,153,0,0.3)',
          borderRadius: 12, padding: '10px 16px', marginBottom: 20,
          color: '#fde68a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
        }}>
          💡 <span>
            <strong>Sign in</strong> to save your scan history across devices.{' '}
            <a href="/login" style={{ color: '#4caf7d', fontWeight: 700 }}>Sign In</a>
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{t.detecting}</p>
          {slowServer ? (
            <div style={{
              marginTop: 16, background: 'rgba(234,179,8,0.15)',
              border: '1px solid rgba(234,179,8,0.3)', borderRadius: 12,
              padding: '12px 20px', maxWidth: 360, textAlign: 'center'
            }}>
              <p style={{ color: '#fde68a', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                ⏳ Waking up server...
              </p>
              <p style={{ color: 'rgba(253,230,138,0.8)', fontSize: 13, lineHeight: 1.6 }}>
                The server was sleeping. It wakes automatically — please wait up to 30 seconds.
              </p>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Analyzing your plant leaf...
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="detect-grid">
            {/* Upload */}
            <div>
              <div
                className={`upload-box ${preview ? 'has-image' : ''}`}
                onClick={() => fileRef.current.click()}
              >
                {preview && !cameraOn ? (
                  <img src={preview} alt="preview" className="upload-preview" />
                ) : (
                  <>
                    <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>📷</span>
                    <p className="upload-title">{t.upload_title}</p>
                    <p className="upload-hint">{t.upload_hint}</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>

            {/* Camera */}
            <div className="camera-box">
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                📸 {t.capture}
              </p>
              {cameraOn ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <div className="camera-controls">
                    <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={capturePhoto}>
                      📸 Capture
                    </button>
                    <button className="btn-secondary" onClick={stopCamera}>✕ Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>📷</div>
                  <button className="btn-secondary" onClick={startCamera}>{t.capture}</button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 12, padding: '12px 18px', marginTop: 16, color: '#fca5a5', fontSize: 14
            }}>
              ⚠️ {error}
            </div>
          )}

          <div className="detect-action">
            <button className="btn-detect" onClick={detect} disabled={!image}>
              🔍 {t.detect_btn}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
