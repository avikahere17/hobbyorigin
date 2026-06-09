import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { REGISTER_MUTATION, LOGIN_MUTATION, ME_QUERY } from '../graphql';
import { COUNTRY_PRESETS, SUPPORTED_LOCALES } from '../i18n';
import i18n from '../i18n';
import { CURRENCY_OPTIONS } from '../utils/currency';

function ageToGroup(age) {
  if (!age) return 'ADULTS';
  if (age <= 12) return 'KIDS';
  if (age <= 17) return 'TEENS';
  if (age <= 59) return 'ADULTS';
  return 'SENIORS';
}

const themePreview = {
  KIDS:    '🎨 Colourful fun mode will be applied!',
  TEENS:   '✨ Modern theme will be applied!',
  ADULTS:  '💼 Standard professional theme',
  SENIORS: '🔎 Large text accessible mode will be applied!',
};

const COUNTRY_OPTIONS = [
  { code: 'GB', label: '🇬🇧 United Kingdom', preset: COUNTRY_PRESETS.GB },
  { code: 'US', label: '🇺🇸 United States',  preset: COUNTRY_PRESETS.US },
  { code: 'IN', label: '🇮🇳 India',          preset: COUNTRY_PRESETS.IN },
];

const JOIN_AS_OPTIONS = [
  {
    value: 'USER',
    icon: '🎯',
    label: 'Hobby Member',
    desc: 'Find groups, connect with people who share your interests, join live sessions',
  },
  {
    value: 'EXPERT',
    icon: '🎓',
    label: 'Expert / Coach',
    desc: 'Offer skill sessions, coaching or free charity help. Build your reputation, get rewarded',
  },
  {
    value: 'SELLER',
    icon: '🛍️',
    label: 'Market Seller',
    desc: 'Sell hobby products, kits and digital resources to community groups with discount coupons',
  },
];

export default function AuthModal({ mode: initialMode, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  // Steps: 1 = account details, 2 = location, 3 = role intent (register only)
  const [step, setStep] = useState(1);
  const [joinAs, setJoinAs] = useState('USER');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [form, setForm] = useState({
    name:'', email:'', password:'', age:'',
    city:'', country:'', building:'', neighborhood:'',
    currency:'GBP', locale:'en-GB',
    selectedCountryCode: 'GB',
  });
  const [error, setError] = useState('');
  const { login, updateCurrentUser } = useAuth();
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const [register, {loading:rL}] = useMutation(REGISTER_MUTATION);
  const [loginMut, {loading:lL}] = useMutation(LOGIN_MUTATION);
  const loading = rL || lL;
  const ageGroup = ageToGroup(parseInt(form.age));

  const handleCountryChange = (code) => {
    const preset = COUNTRY_PRESETS[code];
    if (!preset) return;
    setForm(f => ({ ...f, selectedCountryCode: code, country: preset.country, currency: preset.currency, locale: preset.locale }));
    i18n.changeLanguage(preset.locale);
  };

  const TOTAL_STEPS = 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    setError('');
    try {
      if (mode === 'register') {
        const { data } = await register({
          variables: {
            name: form.name, email: form.email, password: form.password,
            age: form.age ? parseInt(form.age) : null,
            city: form.city || null, country: form.country || null,
            building: form.building || null, neighborhood: form.neighborhood || null,
            currency: form.currency || 'GBP',
            locale: form.locale || 'en-GB',
          }
        });
        login(data.register.token, data.register.user);
        i18n.changeLanguage(data.register.user.locale || 'en-GB');
        onClose();
        // After close, navigate to appropriate onboarding page
        if (joinAs === 'EXPERT') navigate('/expert');
        else if (joinAs === 'SELLER') navigate('/seller');
      } else {
        const { data } = await loginMut({ variables: { email: form.email, password: form.password }});
        login(data.login.token, data.login.user);
        i18n.changeLanguage(data.login.user.locale || 'en-GB');
        // Redirect role-based users to their dashboard
        const role = data.login.user.role;
        onClose();
        if (role === 'EXPERT') navigate('/expert');
        else if (role === 'SELLER') navigate('/seller');
        else if (role === 'ADMIN') navigate('/admin');
      }
    } catch(err) { setError(err.message); }
  };

  const countryPreset = COUNTRY_PRESETS[form.selectedCountryCode] || COUNTRY_PRESETS.GB;

  const stepLabel = mode === 'register' ? {
    1: 'Create Account',
    2: 'Your Location',
    3: 'How will you use HobbyOrigin?',
  }[step] : 'Welcome back!';

  const stepSub = mode === 'register' ? {
    1: 'Join for free — it takes 30 seconds 🚀',
    2: 'Connect with people near you (all optional)',
    3: 'Choose your role — you can change this later from your profile',
  }[step] : 'Sign in to continue';

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:24}}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" style={{marginBottom:8}} xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="url(#mlg)"/>
            <circle cx="32" cy="20" r="7" fill="white" opacity="0.95"/>
            <circle cx="16" cy="44" r="6.5" fill="white" opacity="0.85"/>
            <circle cx="48" cy="44" r="6.5" fill="white" opacity="0.85"/>
            <line x1="32" y1="27" x2="16" y2="37.5" stroke="white" strokeWidth="2.5" strokeOpacity="0.7"/>
            <line x1="32" y1="27" x2="48" y2="37.5" stroke="white" strokeWidth="2.5" strokeOpacity="0.7"/>
            <line x1="16" y1="44" x2="48" y2="44" stroke="white" strokeWidth="2.5" strokeOpacity="0.5"/>
            <defs><linearGradient id="mlg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
          </svg>
          <h2 style={{fontSize:'var(--font-xl)',fontWeight:800,marginBottom:4}}>{stepLabel}</h2>
          <p style={{color:'var(--text-muted)',fontSize:'var(--font-sm)'}}>{stepSub}</p>
          {mode==='register' && (
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:12}}>
              {[1,2,3].map(s=>(
                <div key={s} style={{width:28,height:4,borderRadius:2,background:step>=s?'var(--primary)':'var(--border)',transition:'background 0.2s'}} />
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── STEP 1: Account details ── */}
          {mode==='register' && step===1 && <>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="input" placeholder="e.g. Emma, Rahul or Grandpa Joe 😊" value={form.name} onChange={e=>set('name',e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Your age (personalises your experience)</label>
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

          {/* ── STEP 2: Location ── */}
          {mode==='register' && step===2 && <>
            <div className="form-group">
              <label className="form-label">🌍 Your country</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:4}}>
                {COUNTRY_OPTIONS.map(c => (
                  <button key={c.code} type="button" onClick={() => handleCountryChange(c.code)}
                    style={{padding:'12px 8px',borderRadius:'var(--radius-sm)',border:`2px solid ${form.selectedCountryCode===c.code?'var(--primary)':'var(--border)'}`,background:form.selectedCountryCode===c.code?'var(--primary-light)':'transparent',color:form.selectedCountryCode===c.code?'var(--primary)':'var(--text-muted)',cursor:'pointer',fontWeight:700,fontSize:'var(--font-sm)',fontFamily:'inherit',textAlign:'center'}}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div style={{marginTop:8,fontSize:'var(--font-sm)',color:'var(--text-muted)',padding:'8px 12px',background:'var(--surface2)',borderRadius:'var(--radius-sm)'}}>
                💱 Currency auto-set to <strong style={{color:'var(--text)'}}>{CURRENCY_OPTIONS.find(c=>c.value===form.currency)?.label || form.currency}</strong>
              </div>
            </div>
            <div style={{padding:'10px 14px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',marginBottom:14,fontSize:'var(--font-sm)',color:'var(--text-muted)',lineHeight:1.6}}>
              📍 Helps us find people near your <strong style={{color:'var(--text)'}}>building, neighbourhood, or city</strong>. All optional.
            </div>
            <div className="form-group">
              <label className="form-label">🏢 {countryPreset.postcode==='PIN Code'?'Society / Colony':'Building or Estate name'}</label>
              <input className="input" placeholder={countryPreset.buildingPlaceholder} value={form.building} onChange={e=>set('building',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">🏘️ Neighbourhood / Area</label>
              <input className="input" placeholder="e.g. Downtown, Bandra West, Oak Park" value={form.neighborhood} onChange={e=>set('neighborhood',e.target.value)} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="form-label">🏙️ City</label>
                <input className="input" placeholder={countryPreset.cityPlaceholder?.split(',')[0].replace('e.g. ','')||'City'} value={form.city} onChange={e=>set('city',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">🗣️ Language</label>
                <select className="input" value={form.locale} onChange={e=>{set('locale',e.target.value);i18n.changeLanguage(e.target.value);}}>
                  {SUPPORTED_LOCALES.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>
              </div>
            </div>
          </>}

          {/* ── STEP 3: Role / Intent ── */}
          {mode==='register' && step===3 && (
            <div style={{display:'grid',gap:12}}>
              {JOIN_AS_OPTIONS.map(opt=>(
                <button key={opt.value} type="button" onClick={()=>setJoinAs(opt.value)}
                  style={{
                    padding:'16px 18px',borderRadius:'var(--radius)',textAlign:'left',cursor:'pointer',fontFamily:'inherit',
                    border:`2px solid ${joinAs===opt.value?'var(--primary)':'var(--border)'}`,
                    background:joinAs===opt.value?'var(--primary-light)':'var(--surface2)',
                    transition:'all 0.15s',
                  }}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:28,flexShrink:0}}>{opt.icon}</span>
                    <div>
                      <div style={{fontWeight:800,fontSize:'var(--font-base)',color:joinAs===opt.value?'var(--primary)':'var(--text)',marginBottom:3}}>
                        {opt.label}
                        {joinAs===opt.value && <span style={{marginLeft:8,fontSize:12,background:'var(--primary)',color:'#fff',padding:'1px 8px',borderRadius:99}}>Selected</span>}
                      </div>
                      <div style={{fontSize:'var(--font-sm)',color:'var(--text-muted)',lineHeight:1.4}}>{opt.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
              {joinAs !== 'USER' && (
                <div style={{padding:'10px 14px',background:'rgba(99,102,241,0.08)',borderRadius:'var(--radius-sm)',border:'1px solid var(--primary)',fontSize:'var(--font-sm)',color:'var(--primary)',lineHeight:1.5}}>
                  {joinAs==='EXPERT'
                    ? '🎓 After creating your account you\'ll complete your expert profile — add your skills, availability and rates.'
                    : '🛍️ After creating your account you\'ll set up your seller profile and create discount coupons for group members.'}
                </div>
              )}

              {/* ── GDPR / CPRA consent checkboxes ── */}
              <div style={{borderTop:'1px solid var(--border)',paddingTop:16,display:'grid',gap:10}}>
                <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',fontSize:'var(--font-sm)'}}>
                  <input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{width:16,height:16,marginTop:2,flexShrink:0,accentColor:'var(--primary)'}} />
                  <span style={{color:'var(--text-muted)',lineHeight:1.5}}>
                    I agree to the <a href="/privacy" target="_blank" rel="noreferrer" style={{color:'var(--primary)'}}>Terms of Service</a> and confirm I am 13 years old or older (or registering my child with parental consent). <span style={{color:'var(--danger)'}}>*</span>
                  </span>
                </label>
                <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',fontSize:'var(--font-sm)'}}>
                  <input type="checkbox" required checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} style={{width:16,height:16,marginTop:2,flexShrink:0,accentColor:'var(--primary)'}} />
                  <span style={{color:'var(--text-muted)',lineHeight:1.5}}>
                    I have read and accept the <a href="/privacy" target="_blank" rel="noreferrer" style={{color:'var(--primary)'}}>Privacy Policy</a>. I understand my data is processed to provide the HobbyOrigin service (GDPR Art. 6(1)(b)). <span style={{color:'var(--danger)'}}>*</span>
                  </span>
                </label>
                <p style={{fontSize:11,color:'var(--text-muted)',margin:0,lineHeight:1.5}}>
                  🇪🇺 GDPR · 🇺🇸 CPRA compliant. You can export or delete your data at any time from your Profile. We never sell your personal data.
                </p>
              </div>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode==='login' && <>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required />
            </div>
            <div style={{marginBottom:12,fontSize:'var(--font-sm)',color:'var(--text-muted)',padding:'10px 14px',background:'var(--surface2)',borderRadius:'var(--radius-sm)'}}>
              <strong>Experts</strong> and <strong>Sellers</strong> sign in with the same form — you'll be taken to your dashboard automatically.
            </div>
          </>}

          {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--danger)',fontSize:'var(--font-sm)',marginBottom:14}}>{error}</div>}

          <div style={{display:'flex',gap:10}}>
            {mode==='register' && step>1 && (
              <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(s=>s-1)}>← Back</button>
            )}
            <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={loading || (mode==='register' && step===3 && (!termsAccepted || !privacyAccepted))}>
              {loading ? '⏳ Please wait…'
                : mode==='register'
                  ? step < TOTAL_STEPS ? 'Next →'
                  : joinAs==='EXPERT' ? '🎓 Create Expert Account'
                  : joinAs==='SELLER' ? '🛍️ Create Seller Account'
                  : '🎉 Create My Account!'
                : '🔓 Sign In'}
            </button>
          </div>
        </form>

        <div className="divider" />
        <p style={{textAlign:'center',fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>
          {mode==='register' ? 'Already have an account?' : 'New here?'}
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
