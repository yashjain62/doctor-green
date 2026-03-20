import React, { useContext } from 'react';
import { LangContext } from '../App';

const TEAM = [
  {
    name: 'Yash Jain',
    email: 'yashraj3238@gmail.com',
    phone: '+91 9982323831',
    linkedin: 'https://www.linkedin.com/in/yash-jain-000936291',
    initials: 'YJ'
  },
  {
    name: 'Udit Raj',
    email: 'uditraj454@gmail.com',
    phone: '+91 7014315345',
    linkedin: 'hhttps://www.linkedin.com/in/udit-raj-a997b0249',
    initials: 'UR'
  },
  {
    name: 'Yash Tak',
    email: 'yashtak711@gmail.com',
    phone: '+91 9024584891',
    linkedin: 'hhttps://www.linkedin.com/in/vash-tak7',
    initials: 'YT'
  }
];

export default function Contact() {
  const { t } = useContext(LangContext);

  return (
    <div className="contact-page">
      <h1 className="page-title">{t.contact_title}</h1>
      <p style={{color:'var(--text-muted)', marginBottom:36, fontSize:16}}>
        Meet the team behind Doctor Green
      </p>
      <div className="contact-grid">
        {TEAM.map((m, i) => (
          <div key={i} className="contact-card">
            <div className="contact-avatar">{m.initials}</div>
            <div style={{flex:1}}>
              <p className="contact-name">{m.name}</p>
              <p style={{color:'var(--text-muted)', fontSize:13, marginBottom:8}}>{m.role}</p>
              <div className="contact-info">
                <span>📧 <a href={`mailto:${m.email}`}>{m.email}</a></span>
                <span>📞 {m.phone}</span>
                <span>🔗 <a href={m.linkedin} target="_blank" rel="noreferrer">LinkedIn Profile</a></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{marginTop:32, textAlign:'center'}}>
        <p style={{fontSize:16, color:'#fff', fontFamily:'var(--font-serif)', marginBottom:8}}>About Doctor Green</p>
        <p style={{color:'var(--text-muted)', fontSize:14, lineHeight:1.7}}>
          Doctor Green is an AI-powered plant disease detection system built with ResNet50 deep learning.
          Trained on 87,000+ images across 38 disease classes from the New Plant Diseases Dataset.
          Our mission: help farmers and gardeners protect their crops with technology.
        </p>
      </div>
    </div>
  );
}
