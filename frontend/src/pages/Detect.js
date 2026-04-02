import React, { useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LangContext } from '../App';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Convert file/blob to base64 string (persists across page reloads)
function toBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // data:image/jpeg;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

// Basic green-content check — rejects clearly non-plant images
// Uses canvas to sample pixel colors from the image
async function hasPlantContent(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const SIZE = 80; // sample at 80x80
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        let greenPixels = 0, totalPixels = SIZE * SIZE;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          // Green-dominant pixel: g is highest AND noticeably greater than r and b
          if (g > r + 15 && g > b + 15 && g > 60) greenPixels++;
        }

        const greenRatio = greenPixels / totalPixels;
        // Require at least 8% green pixels — catches selfies, objects, blank images
        resolve(greenRatio >= 0.08);
      } catch {
        resolve(true); // if canvas fails, allow through
      }
    };
    img.onerror = () => resolve(true);
    img.src = base64;
  });
}

export default function Detect({ setResult, addToHistory }) {
  const { t } = useContext(LangContext);
  const { saveScanToFirestore, currentUser } = useAuth();
  const navigate = useNavigate();

  const [image, setImage] = useState(null);       // File or Blob
  const [preview, setPreview] = useState(null);   // base64 data URL (persists)
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slowServer, setSlowServer] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef(null);

  // Attach stream to video whenever camera turns on
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setError(''); setValidating(true);

    try {
      // Convert to base64 so it survives page reloads in localStorage
      const base64 = await toBase64(f);

      // Validate: must look like a plant image
      const isPlant = await hasPlantContent(base64);
      if (!isPlant) {
        setError('⚠️ This doesn\'t look like a plant or leaf image. Please upload a clear photo of a plant leaf.');
        setValidating(false);
        e.target.value = ''; // reset file input
        return;
      }

      setImage(f);
      setPreview(base64); // store as base64, not blob URL
      setCameraOn(false);
      stopCamera();
    } catch {
      setError('Could not read the image file. Please try another.');
    }
    setValidating(false);
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

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video) { setError('Video not ready. Please try again.'); return; }

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);

    const base64 = canvas.toDataURL('image/jpeg', 0.9);

    // Validate captured image too
    setValidating(true);
    const isPlant = await hasPlantContent(base64);
    if (!isPlant) {
      setError('⚠️ This doesn\'t look like a plant or leaf. Please point the camera at a plant leaf.');
      setValidating(false);
      return;
    }
    setValidating(false);

    setPreview(base64); // base64 — persists fine

    // Convert base64 to blob for upload
    canvas.toBlob(blob => {
      if (blob) {
        setImage(blob);
      } else {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        setImage(new Blob([ab], { type: 'image/jpeg' }));
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

      // Store base64 preview (not blob URL) so history thumbnails survive reload
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

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
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
                onClick={() => { if (!preview && !validating) fileRef.current.click(); }}
                style={{ cursor: preview && !cameraOn ? 'default' : 'pointer', position: 'relative' }}
              >
                {validating ? (
                  <>
                    <div className="spinner" style={{ width: 36, height: 36, marginBottom: 12 }} />
                    <p style={{ color: '#fff', fontSize: 14 }}>Checking image...</p>
                  </>
                ) : preview && !cameraOn ? (
                  <>
                    <img src={preview} alt="preview" className="upload-preview" />
                    <button
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        background: 'rgba(0,0,0,0.6)', border: 'none',
                        color: '#fff', borderRadius: '50%', width: 30, height: 30,
                        cursor: 'pointer', fontSize: 14, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 10
                      }}
                      title="Remove image"
                    >✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 52, display: 'block', marginBottom: 12 }}>📷</span>
                    <p className="upload-title">{t.upload_title}</p>
                    <p className="upload-hint">{t.upload_hint}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                      🌿 Plant/leaf images only
                    </p>
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
                      disabled={validating}
                    >
                      {validating ? '⏳ Checking...' : '📸 Capture'}
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
              {error}
            </div>
          )}

          {image && !cameraOn && !error && (
            <p style={{ textAlign: 'center', marginTop: 10, color: '#4caf7d', fontSize: 13, fontWeight: 600 }}>
              ✅ Plant image ready — click Detect Disease
            </p>
          )}

          <div className="detect-action">
            <button className="btn-detect" onClick={detect} disabled={!image || cameraOn || validating}>
              🔍 {t.detect_btn}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
