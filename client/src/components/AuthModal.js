import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { REGISTER_MUTATION, LOGIN_MUTATION } from '../graphql';

function ageToGroup(age) {
  if (!age) return 'ADULTS';
  if (age <= 12) return 'KIDS';
  if (age <= 17) return 'TEENS';
  if (age <= 59) return 'ADULTS';
  return 'SENIORS';
}

const themePreview = {
  KIDS: '🎨 Colorful fun mode will be applied!',
  TEENS: '✨ Modern teen theme will be applied!',
  ADULTS: '💼 Standard professional theme',
  SENIORS: '🔎 Large text accessible mode will be applied!',
};

export default function AuthModal({ mode: initialMode, onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', password:'', age:'', city:'', country:'', building:'', neighborhood:'' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const [register, {loading:rL}] = useMutation(REGISTER_MUTATION);
  const [loginMut, {loading:lL}] = useMutation(LOGIN_MUTATION);
  const loading = rL || lL;
  const ageGroup = ageToGroup(parseInt(form.age));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && step === 1) { setStep(2); return; }
    setError('');
    try {
      if (mode === 'register') {
        const {data} = await register({ variables: { name:form.name, email:form.email, password:form.password, age:form.age?parseInt(form.age):null, city:form.city||null, country:form.country||null, building:form.building||null, neighborhood:form.neighborhood||null }});
        login(data.register.token, data.register.user);
      } else {
        const {data} = await loginMut({ variables: { email:form.email, password:form.password }});
        login(data.login.token, data.login.user);
      }
      onClose();
    } catch(err) { setError(err.message); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:44,marginBottom:8}}>🔗</div>
          <h2 style={{fontSize:'var(--font-xl)',fontWeight:800}}>
            {mode==='register' ? (step===1 ? 'Join HobbyOrigin' : 'Your Location') : 'Welcome back!'}
          </h2>
          <p style={{color:'var(--text-muted)',fontSize:'var(--font-sm)',marginTop:4}}>
            {mode==='register' ? (step===1 ? 'For everyone — kids, adults, seniors!' : 'Connect with nearby folks') : 'Sign in to continue'}
          </p>
          {mode==='register' && (
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:10}}>
              {[1,2].map(s=>(
                <div key={s} style={{width:28,height:4,borderRadius:2,background:step>=s?'var(--primary)':'var(--border)',transition:'background 0.2s'}} />
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {mode==='register' && step===1 && <>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="input" placeholder="e.g. Emma or Grandpa Joe 😊" value={form.name} onChange={e=>set('name',e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Your age (personalizes your experience)</label>
              <input className="input" type="number" min={5} max={120} placeholder="How old are you?" value={form.age} onChange={e=>set('age',e.target.value)} />
              {form.age && (
                <div style={{marginTop:6,padding:'8px 12px',background:'var(--primary-light)',borderRadius:'var(--radius-sm)',fontSize:'var(--font-sm)',color:'var(--primary)',fontWeight:600}}>
                  {themePreview[ageGroup]}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password (at least 6 characters)</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required />
            </div>
          </>}

          {mode==='register' && step===2 && <>
            <div style={{padding:'12px 16px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',marginBottom:16,fontSize:'var(--font-sm)',color:'var(--text-muted)',lineHeight:1.6}}>
              📍 Your location helps us find people in your <strong style={{color:'var(--text)'}}>building, neighborhood, or city</strong>. All optional — add what you're comfortable sharing.
            </div>
            <div className="form-group">
              <label className="form-label">🏢 Building or complex name</label>
              <input className="input" placeholder="e.g. Sunset Apartments, Lincoln School, Oak Care Home" value={form.building} onChange={e=>set('building',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">🏘️ Neighborhood or area</label>
              <input className="input" placeholder="e.g. Downtown, Oak Park, Riverside" value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="form-label">🏙️ City</label>
                <input className="input" placeholder="Your city" value={form.city} onChange={e=>set('city',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">🌍 Country</label>
                <input className="input" placeholder="Country" value={form.country} onChange={e=>set('country',e.target.value)} />
              </div>
            </div>
          </>}

          {mode==='login' && <>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required />
            </div>
          </>}

          {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--danger)',fontSize:'var(--font-sm)',marginBottom:14}}>{error}</div>}

          <div style={{display:'flex',gap:10}}>
            {mode==='register' && step===2 && (
              <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(1)}>← Back</button>
            )}
            <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={loading}>
              {loading ? '⏳ Please wait…' : mode==='register' ? (step===1 ? 'Next: Add Location →' : '🎉 Create My Account!') : '🔓 Sign In'}
            </button>
          </div>
        </form>

        <div className="divider" />
        <p style={{textAlign:'center',fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>
          {mode==='register' ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={()=>{setMode(mode==='register'?'login':'register');setStep(1);setError('');}}
            style={{background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontWeight:700,fontSize:'var(--font-sm)',fontFamily:'inherit'}}>
            {mode==='register' ? 'Sign in' : 'Join free — for everyone!'}
          </button>
        </p>
      </div>
    </div>
  );
}
