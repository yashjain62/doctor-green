import React, { useContext, useRef, useState, useCallback, useEffect } from 'react';
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

  // Attach stream to video element whenever cameraOn becomes true
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

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
    setPreview(null);
    setImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      console.error('Camera error:', err);
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
    const video = videoRef.current;
    if (!video) { setError('Video not ready. Please try again.'); return; }

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    // Get data URL immediately for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);

    // Convert to Blob for upload
    canvas.toBlob(blob => {
      if (blob) {
        setImage(blob);
      } else {
        // Fallback: convert dataUrl to blob manually
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const fallbackBlob = new Blob([ab], { type: 'image/jpeg' });
        setImage(fallbackBlob);
      }
    }, 'image/jpeg', 0.9);

    stopCamera();
  }, []);

  const detect = async () => {
    if (!image) { setError('Please select or capture an image first.'); return; }
    setLoading(true); setError(''); setSlowServer(false);

    const slowTimer = setTimeout(() => setSlowServer(true), 8000);

    try {
      const formData = new FormData();
      formData.append('image', image, 'leaf.jpg');
      const { data } = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      clearTimeout(slowTimer);

      setResult({ ...data, imageUrl: preview });
      addToHistory({ ...data, imageUrl: preview, timestamp: Date.now() });

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
            {/* Upload / Preview panel */}
            <div>
              <div
                className={`upload-box ${preview && !cameraOn ? 'has-image' : ''}`}
                onClick={() => { if (!preview) fileRef.current.click(); }}
                style={{ cursor: preview && !cameraOn ? 'default' : 'pointer' }}
              >
                {preview && !cameraOn ? (
                  <>
                    <img src={preview} alt="preview" className="upload-preview" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.55)', border: 'none',
                        color: '#fff', borderRadius: '50%', width: 28, height: 28,
                        cursor: 'pointer', fontSize: 14, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Remove image"
                    >✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>📷</span>
                    <p className="upload-title">{t.upload_title}</p>
                    <p className="upload-hint">{t.upload_hint}</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
            </div>

            {/* Camera panel */}
            <div className="camera-box">
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                📸 {t.capture}
              </p>
              {cameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', display: 'block' }}
                  />
                  <div className="camera-controls">
                    <button
                      className="btn-primary"
                      style={{ padding: '10px 24px', fontSize: 14 }}
                      onClick={capturePhoto}
                    >
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
            <button className="btn-detect" onClick={detect} disabled={!image || cameraOn}>
              🔍 {t.detect_btn}
            </button>
          </div>

          {image && !cameraOn && (
            <p style={{ textAlign: 'center', marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>
              ✅ Image ready — click Detect Disease
            </p>
          )}
        </>
      )}
    </div>
  );
}
