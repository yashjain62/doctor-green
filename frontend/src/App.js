import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Detect from './pages/Detect';
import Result from './pages/Result';
import Supplements from './pages/Supplements';
import Contact from './pages/Contact';
import './App.css';

export const LangContext = React.createContext();

const translations = {
  en: {
    home: 'Home', detect: 'Detect', supplements: 'Supplements', contact: 'Contact Us',
    hero_title: 'Doctor Green', hero_sub: 'AI Plant Disease Detection',
    hero_desc: 'Detect diseases in plant leaves using advanced AI. Keep your plants healthy and thriving with Doctor Green.',
    get_started: 'Get Started', upload_title: 'Upload Leaf Image',
    upload_hint: 'Click to upload or drag & drop', capture: 'Capture from Camera',
    detect_btn: 'Detect Disease', status_healthy: 'HEALTHY', status_diseased: 'DISEASED',
    confidence: 'Confidence', description: 'Description', prevention: 'Prevention',
    buy_now: 'Buy on Amazon', top_predictions: 'Top Predictions', last_scans: 'Last 5 Scans',
    supplements_title: 'Supplements', healthy_title: 'Your Plant is Healthy!',
    healthy_tips: 'Keep up the great care!', footer_msg: 'Taking care of plants means taking care of our future.',
    contact_title: 'Contact Us', no_result: 'No result yet. Please detect a disease first.',
    detecting: 'Analyzing your plant...'
  },
  hi: {
    home: 'होम', detect: 'जांचें', supplements: 'पूरक', contact: 'हमसे संपर्क करें',
    hero_title: 'डॉक्टर ग्रीन', hero_sub: 'AI पादप रोग पहचान',
    hero_desc: 'उन्नत AI का उपयोग करके पौधों की पत्तियों में रोगों का पता लगाएं। Doctor Green के साथ अपने पौधों को स्वस्थ रखें।',
    get_started: 'शुरू करें', upload_title: 'पत्ती की छवि अपलोड करें',
    upload_hint: 'अपलोड करने के लिए क्लिक करें', capture: 'कैमरे से कैप्चर करें',
    detect_btn: 'रोग का पता लगाएं', status_healthy: 'स्वस्थ', status_diseased: 'रोगग्रस्त',
    confidence: 'विश्वास', description: 'विवरण', prevention: 'रोकथाम',
    buy_now: 'Amazon पर खरीदें', top_predictions: 'शीर्ष भविष्यवाणियां', last_scans: 'अंतिम 5 स्कैन',
    supplements_title: 'पूरक', healthy_title: 'आपका पौधा स्वस्थ है!',
    healthy_tips: 'देखभाल जारी रखें!', footer_msg: 'पौधों की देखभाल करना भविष्य की देखभाल करना है।',
    contact_title: 'हमसे संपर्क करें', no_result: 'कोई परिणाम नहीं। कृपया पहले रोग का पता लगाएं।',
    detecting: 'आपके पौधे का विश्लेषण हो रहा है...'
  }
};

function App() {
  const [lang, setLang] = useState('en');
  const [result, setResult] = useState(null);
  const [scanHistory, setScanHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scanHistory') || '[]'); }
    catch { return []; }
  });

  const t = translations[lang];

  const addToHistory = (item) => {
    const updated = [item, ...scanHistory].slice(0, 5);
    setScanHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, translations }}>
      <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/detect" element={<Detect setResult={setResult} addToHistory={addToHistory} />} />
              <Route path="/result" element={<Result result={result} scanHistory={scanHistory} />} />
              <Route path="/supplements" element={<Supplements />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LangContext.Provider>
  );
}

export default App;
