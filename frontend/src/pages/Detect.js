import React, { useContext, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LangContext } from '../App';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Detect({ setResult, addToHistory }) {
  const { t } = useContext(LangContext);
  const navigate = useNavigate();

  const [image, setImage] = useState(null);      // File or Blob
  const [preview, setPreview] = useState(null);  // data URL
  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
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
      streamRef.current.getTracks().forEach(t => t.stop());
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
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('image', image);
      const { data } = await axios.post(
        `${API_URL}/predict`,
        formData
      );
      setResult({ ...data, imageUrl: preview });
      addToHistory({ ...data, imageUrl: preview, timestamp: Date.now() });
      navigate('/result');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to server. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">{t.detect}</h1>
      <p className="page-subtitle">{t.hero_sub} — Upload or capture a leaf image</p>

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          <p style={{color:'#fff', fontSize:16, fontWeight:600}}>{t.detecting}</p>
          <p style={{color:'var(--text-muted)', fontSize:14, marginTop:8}}>This may take a few seconds...</p>
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
                    <span style={{fontSize:52, display:'block', marginBottom:12}}>📷</span>
                    <p className="upload-title">{t.upload_title}</p>
                    <p className="upload-hint">{t.upload_hint}</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile} />
            </div>

            {/* Camera */}
            <div className="camera-box">
              <p style={{color:'var(--text-muted)', fontSize:13, marginBottom:12, fontWeight:600}}>📸 {t.capture}</p>
              {cameraOn ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:'var(--radius-md)'}} />
                  <div className="camera-controls">
                    <button className="btn-primary" style={{padding:'10px 24px', fontSize:14}} onClick={capturePhoto}>📸 Capture</button>
                    <button className="btn-secondary" onClick={stopCamera}>✕ Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{textAlign:'center', padding:'40px 0'}}>
                  <div style={{fontSize:56, marginBottom:12}}>📷</div>
                  <button className="btn-secondary" onClick={startCamera}>{t.capture}</button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:12, padding:'12px 18px', marginTop:16, color:'#fca5a5', fontSize:14}}>
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
