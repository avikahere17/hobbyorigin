import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useAuth } from '../context/AuthContext';
import { USER_QUERY, UPDATE_PROFILE_MUTATION, ME_QUERY, LINK_CHILD_MUTATION, ADD_COINS_MUTATION,
  MY_PRIVACY_SETTINGS_QUERY, UPDATE_PRIVACY_SETTINGS_MUTATION, REQUEST_DATA_EXPORT_MUTATION, DELETE_MY_ACCOUNT_MUTATION } from '../graphql';
import { CURRENCY_OPTIONS, formatCurrency } from '../utils/currency';
import { SUPPORTED_LOCALES, COUNTRY_PRESETS } from '../i18n';

const AG_EMOJI = {KIDS:'🧒',TEENS:'🧑',ADULTS:'👤',SENIORS:'👴'};
const ROLE_BADGE = {ADMIN:{label:'👑 Admin',bg:'rgba(239,68,68,0.15)',color:'var(--danger)'},EXPERT:{label:'🎓 Expert',bg:'rgba(99,102,241,0.15)',color:'var(--primary)'},SELLER:{label:'🛍️ Seller',bg:'rgba(245,158,11,0.15)',color:'var(--warning)'},USER:{label:null}};
const AG_LABEL = {KIDS:'Kids (5–12)',TEENS:'Teens (13–17)',ADULTS:'Adults (18–59)',SENIORS:'Seniors (60+)'};
const THEMES = [{v:'PLAYFUL',l:'🎨 Playful (colorful)'},{v:'STANDARD',l:'💼 Standard (dark)'},{v:'ACCESSIBLE',l:'🔎 Accessible (large text)'}];

const COMMON_INTERESTS = ['Reading','Music','Gaming','Art','Cooking','Gardening','Chess','Photography','Dancing','Sports','Crafts','Writing','Science','Programming','Movies','Yoga','Hiking','Drawing','Knitting','Volunteering'];

export default function Profile() {
  const { t } = useTranslation();
  const { id: paramId } = useParams();
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const navigate = useNavigate();

  // If no id in URL, redirect to own profile
  React.useEffect(() => {
    if (!paramId && currentUser?.id) {
      navigate(`/profile/${currentUser.id}`, { replace: true });
    }
  }, [paramId, currentUser, navigate]);

  // Use paramId if present, otherwise fall back to currentUser's id
  const id = paramId || currentUser?.id;
  const isOwn = !!(currentUser?.id && currentUser.id === id);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const setF = (k,v) => setEditForm(f=>({...f,[k]:v}));

  const { data, loading, error: queryError } = useQuery(USER_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  const [linkChildEmail, setLinkChildEmail] = useState('');
  const [coinTarget, setCoinTarget] = useState('');
  const [coinAmount, setCoinAmount] = useState(10);
  const [updateProfile, {loading:saving}] = useMutation(UPDATE_PROFILE_MUTATION, { refetchQueries:[{query:ME_QUERY}] });
  const [linkChild, {loading:linking}] = useMutation(LINK_CHILD_MUTATION, { refetchQueries:[{query:USER_QUERY,variables:{id}}] });
  const [addCoins, {loading:addingCoins}] = useMutation(ADD_COINS_MUTATION, { refetchQueries:[{query:USER_QUERY,variables:{id}}] });

  // Privacy / compliance
  const [privacyTab, setPrivacyTab] = useState(false);
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [exportDone, setExportDone] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const { data: privacyData, refetch: refetchPrivacy } = useQuery(MY_PRIVACY_SETTINGS_QUERY, { skip: !isOwn });
  const [updatePrivacy, { loading: privacySaving }] = useMutation(UPDATE_PRIVACY_SETTINGS_MUTATION, { onCompleted: () => refetchPrivacy() });
  const [requestExport] = useMutation(REQUEST_DATA_EXPORT_MUTATION);
  const [deleteAccount, { loading: deleting }] = useMutation(DELETE_MY_ACCOUNT_MUTATION);

  if (loading && !data) return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;

  // For own profile: fall back to currentUser from auth context while query is in-flight or if query fails
  const user = data?.user || (isOwn ? currentUser : null);

  if (!user) return (
    <div className="page container" style={{paddingTop:100}}>
      <div className="empty-state">
        <div className="empty-state-icon">😕</div>
        <div className="empty-state-title">Profile not found</div>
        <div className="empty-state-desc" style={{marginTop:8}}>
          {queryError ? 'Could not load profile. Check your connection.' : 'This user may not exist or has been removed.'}
        </div>
        {isOwn && (
          <div style={{marginTop:16,display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>↻ Retry</button>
            <button className="btn btn-ghost" onClick={() => { logout(); navigate('/'); }}>Sign out &amp; re-login</button>
          </div>
        )}
        {!isOwn && <Link to="/" className="btn btn-primary" style={{marginTop:16}}>Back to groups</Link>}
      </div>
    </div>
  );
  const isSenior = user.ageGroup === 'SENIORS';
  const isKids = user.ageGroup === 'KIDS';

  const startEdit = () => {
    setEditForm({
      bio: user.bio||'', interests: user.interests||[], age: user.age||'',
      building: user.location?.building||'', neighborhood: user.location?.neighborhood||'',
      city: user.location?.city||'', country: user.location?.country||'',
      theme: user.theme||'STANDARD',
      currency: user.currency||'GBP',
      locale: user.locale||'en-GB',
      lat: user.location?.lat||null, lng: user.location?.lng||null,
    });
    setEditing(true);
  };

  const detectGPS = () => {
    if (!navigator.geolocation) { alert('GPS not available in this browser'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setF('lat', pos.coords.latitude); setF('lng', pos.coords.longitude); setGpsLoading(false); },
      () => { alert('Could not get location. Check browser permissions.'); setGpsLoading(false); }
    );
  };

  const toggleInterest = (i) => setF('interests', editForm.interests?.includes(i) ? editForm.interests.filter(x=>x!==i) : [...(editForm.interests||[]),i]);

  const handleSave = async () => {
    setError('');
    try {
      const { data:d } = await updateProfile({ variables: { bio:editForm.bio, interests:editForm.interests, age:editForm.age?parseInt(editForm.age):null, building:editForm.building||null, neighborhood:editForm.neighborhood||null, city:editForm.city||null, country:editForm.country||null, theme:editForm.theme||null, currency:editForm.currency||null, locale:editForm.locale||null, lat:editForm.lat||null, lng:editForm.lng||null }});
      updateCurrentUser({ bio:d.updateProfile.bio, interests:d.updateProfile.interests, theme:d.updateProfile.theme, ageGroup:d.updateProfile.ageGroup, location:d.updateProfile.location, currency:d.updateProfile.currency, locale:d.updateProfile.locale });
      if (editForm.locale) i18n.changeLanguage(editForm.locale);
      setEditing(false);
    } catch(e) { setError(e.message); }
  };

  return (
    <div className="page">
      <div className="container" style={{padding:'32px 16px',maxWidth:720}}>
        {/* Profile card */}
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:20,flexWrap:'wrap'}}>
            <div className="avatar avatar-xl" style={{background:user.avatarColor}}>{user.name[0].toUpperCase()}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:8}}>
                <div>
                  <h1 style={{fontSize:'var(--font-xl)',fontWeight:800}}>{user.name}</h1>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                    <span className={`badge ag-${user.ageGroup}`}>{AG_EMOJI[user.ageGroup]} {AG_LABEL[user.ageGroup]}</span>
                    {user.location?.city && (
                      <span className="badge badge-dim">📍 {user.location.building||user.location.neighborhood||user.location.city}</span>
                    )}
                    {user.role && ROLE_BADGE[user.role]?.label && <span className="badge" style={{background:ROLE_BADGE[user.role].bg,color:ROLE_BADGE[user.role].color}}>{ROLE_BADGE[user.role].label}</span>}
                    {user.tipsEarned > 0 && <span className="badge" style={{background:'rgba(245,158,11,0.15)',color:'var(--warning)'}}>⭐ {formatCurrency(user.tipsEarned, user.currency||'GBP')} {t('tips_earned')}</span>}
                    {isOwn && <span className="badge" style={{background:'rgba(99,102,241,0.15)',color:'var(--primary)'}}>💰 {user.walletCoins} {t('wallet_coins')}</span>}
                    {user.currency && user.currency !== 'GBP' && <span className="badge badge-dim">{user.currency === 'USD' ? '🇺🇸' : user.currency === 'INR' ? '🇮🇳' : '🇬🇧'} {user.currency}</span>}
                  </div>
                </div>
                {isOwn && !editing && (
                  <button className="btn btn-ghost btn-sm" onClick={startEdit}>✏️ {isSenior?'Edit My Profile':'Edit Profile'}</button>
                )}
              </div>

              {editing ? (
                <div>
                  {/* Bio */}
                  <div className="form-group">
                    <label className="form-label">{isKids?'Tell people about yourself! 😊':isSenior?'About me':'Bio'}</label>
                    <textarea className="input" value={editForm.bio} onChange={e=>setF('bio',e.target.value)} rows={2} placeholder={isKids?'I love drawing and playing chess!':isSenior?'Tell people what you enjoy…':'Tell people about yourself…'} />
                  </div>

                  {/* Age */}
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input className="input" type="number" min={5} max={120} value={editForm.age} onChange={e=>setF('age',e.target.value)} style={{maxWidth:120}} />
                  </div>

                  {/* Interests */}
                  <div className="form-group">
                    <label className="form-label">{isKids?'What do you love? 🌟':isSenior?'My interests':'Interests'}</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:4}}>
                      {COMMON_INTERESTS.map(i=>(
                        <button key={i} type="button" onClick={()=>toggleInterest(i)}
                          style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${(editForm.interests||[]).includes(i)?'var(--primary)':'var(--border)'}`,background:(editForm.interests||[]).includes(i)?'var(--primary-light)':'transparent',color:(editForm.interests||[]).includes(i)?'var(--primary)':'var(--text-muted)',cursor:'pointer',fontWeight:600,fontSize:'var(--font-sm)',fontFamily:'inherit'}}>
                          {(editForm.interests||[]).includes(i)?'✓ ':''}{i}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="form-group">
                    <label className="form-label">📍 {isSenior?'Where do you live?':'Location'}</label>
                    <div style={{display:'grid',gap:8}}>
                      <button type="button" onClick={detectGPS} disabled={gpsLoading}
                        style={{padding:'9px 16px',borderRadius:'var(--radius-sm)',border:'2px solid var(--border)',background:'var(--surface2)',color:'var(--primary)',fontWeight:600,cursor:'pointer',fontSize:'var(--font-sm)',fontFamily:'inherit',display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                        {gpsLoading ? '⏳ Detecting…' : '📡 Detect my GPS location'}
                        {editForm.lat && !gpsLoading && <span style={{color:'var(--success)',fontSize:12}}>✓ {editForm.lat?.toFixed(4)}, {editForm.lng?.toFixed(4)}</span>}
                      </button>
                      <input className="input" placeholder="🏢 Building name (e.g. Elm Court, St. Mary's)" value={editForm.building} onChange={e=>setF('building',e.target.value)} />
                      <input className="input" placeholder="🏘️ Neighborhood or area" value={editForm.neighborhood} onChange={e=>setF('neighborhood',e.target.value)} />
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                        <input className="input" placeholder="🏙️ City" value={editForm.city} onChange={e=>setF('city',e.target.value)} />
                        <input className="input" placeholder="🌍 Country" value={editForm.country} onChange={e=>setF('country',e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="form-group">
                    <label className="form-label">🎨 Display theme</label>
                    <div style={{display:'grid',gap:8,marginTop:4}}>
                      {THEMES.map(t=>(
                        <button key={t.v} type="button" onClick={()=>setF('theme',t.v)}
                          style={{padding:'10px 16px',borderRadius:'var(--radius-sm)',border:`2px solid ${editForm.theme===t.v?'var(--primary)':'var(--border)'}`,background:editForm.theme===t.v?'var(--primary-light)':'transparent',color:editForm.theme===t.v?'var(--primary)':'var(--text-muted)',cursor:'pointer',fontWeight:600,textAlign:'left',fontSize:'var(--font-sm)',fontFamily:'inherit'}}>
                          {editForm.theme===t.v?'● ':''}{t.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency & Region */}
                  <div className="form-group">
                    <label className="form-label">💱 {t('profile_currency_settings')}</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
                      <div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4,fontWeight:600}}>Currency</div>
                        <select className="input" value={editForm.currency} onChange={e=>setF('currency',e.target.value)}>
                          {CURRENCY_OPTIONS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4,fontWeight:600}}>Language</div>
                        <select className="input" value={editForm.locale} onChange={e=>setF('locale',e.target.value)}>
                          {SUPPORTED_LOCALES.map(l=><option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && <div style={{color:'var(--danger)',fontSize:'var(--font-sm)',marginBottom:10}}>{error}</div>}
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setEditing(false)}>{t('profile_cancel')}</button>
                    <button className="btn btn-primary" style={{flex:2}} onClick={handleSave} disabled={saving}>{saving?'Saving…':t('profile_save')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{color:user.bio?'var(--text)':'var(--text-dim)',fontSize:'var(--font-base)',lineHeight:1.6,marginBottom:12}}>
                    {user.bio||(isOwn?'Add a bio so people know who you are!':'No bio yet.')}
                  </p>
                  {user.interests?.length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {user.interests.map(i=><span key={i} className="badge badge-primary">{i}</span>)}
                    </div>
                  )}
                  {isOwn && !user.interests?.length && (
                    <button className="btn btn-ghost btn-sm" onClick={startEdit}>+ Add interests</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Groups */}
        <div>
          <h2 style={{fontSize:'var(--font-lg)',fontWeight:700,marginBottom:14}}>
            {isOwn?(isKids?'My Groups 🎮':isSenior?'My Groups':'My Groups'):`${user.name}'s Groups`}
            <span style={{fontWeight:400,fontSize:'var(--font-sm)',color:'var(--text-muted)',marginLeft:8}}>({user.joinedGroups?.length||0})</span>
          </h2>
          {!user.joinedGroups?.length ? (
            <div className="empty-state" style={{padding:'30px 20px'}}>
              <div className="empty-state-icon">{isKids?'🎮':'🌱'}</div>
              <div className="empty-state-desc">{isOwn?(isKids?'Join some groups to see them here!':'No groups joined yet.'):('No groups yet.')}</div>
              {isOwn && <Link to="/" className="btn btn-primary" style={{marginTop:12,display:'inline-flex'}}>{isKids?'Find groups! 🎉':isSenior?'Browse Groups':'Explore groups'}</Link>}
            </div>
          ) : (
            <div style={{display:'grid',gap:10}}>
              {user.joinedGroups.map(g=>(
                <Link key={g.id} to={`/group/${g.id}`}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',background:'var(--surface)',border:'2px solid var(--border)',borderRadius:'var(--radius-sm)',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.background='var(--surface2)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface)';}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'var(--font-base)'}}>{g.name}</div>
                    <div style={{fontSize:'var(--font-sm)',color:'var(--text-muted)',marginTop:2}}>{g.category}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>{g.memberCount}/{g.maxMembers}</div>
                    <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:g.isOpen?'var(--success)':'var(--danger)',marginTop:2}}>{g.isOpen?'Open':'Full'}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Parental dashboard — only show on own profile for ADULTS/SENIORS with children linked */}
        {isOwn && (user.ageGroup === 'ADULTS' || user.ageGroup === 'SENIORS') && (
          <div className="card" style={{marginTop:20}}>
            <h2 style={{fontSize:'var(--font-lg)',fontWeight:700,marginBottom:14}}>👨‍👩‍👧 Family Dashboard</h2>

            {/* Linked children */}
            {user.children?.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Linked Children</div>
                <div style={{display:'grid',gap:10}}>
                  {user.children.map(child=>(
                    <div key={child.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--surface2)',borderRadius:'var(--radius-sm)',flexWrap:'wrap',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div className="avatar avatar-md" style={{background:child.avatarColor}}>{child.name[0].toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:700}}>{child.name}</div>
                          <div style={{fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>{child.ageGroup} · 💰 {child.walletCoins} coins</div>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input type="number" min={1} max={100} className="input" style={{width:70}} value={coinTarget===child.id?coinAmount:10}
                          onChange={e=>{setCoinTarget(child.id);setCoinAmount(parseInt(e.target.value)||1);}} />
                        <button className="btn btn-primary btn-sm" disabled={addingCoins}
                          onClick={()=>{setCoinTarget(child.id);addCoins({variables:{userId:child.id,amount:coinAmount}});}}>
                          ⭐ Gift coins
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link a child */}
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Link a child account</div>
              <div style={{display:'flex',gap:8}}>
                <input className="input" style={{flex:1}} placeholder="Child's email address" value={linkChildEmail} onChange={e=>setLinkChildEmail(e.target.value)} />
                <button className="btn btn-primary" disabled={linking||!linkChildEmail} onClick={async()=>{
                  try{await linkChild({variables:{childEmail:linkChildEmail}});setLinkChildEmail('');}
                  catch(e){alert(e.message);}
                }}>{linking?'Linking…':'Link'}</button>
              </div>
              <div style={{fontSize:'var(--font-sm)',color:'var(--text-dim)',marginTop:6}}>The child must already have a HobbyOrigin account (KIDS or TEENS).</div>
            </div>
          </div>
        )}

        {/* ── Privacy & Compliance panel (own profile only) ── */}
        {isOwn && (
          <div className="card" style={{ marginTop: 20 }}>
            <button onClick={() => setPrivacyTab(v => !v)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', padding: 0 }}>
              <h3 style={{ fontWeight: 800, fontSize: 'var(--font-base)', margin: 0 }}>🔒 Privacy &amp; Data Rights</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{privacyTab ? '▲' : '▼'}</span>
            </button>

            {privacyTab && (() => {
              const ps = privacyData?.myPrivacySettings;
              const handlePrivacyToggle = (key, val) => updatePrivacy({ variables: { [key]: val } });
              const handleExport = async () => {
                setExportLoading(true);
                try {
                  const { data: ed } = await requestExport();
                  const json = ed?.requestDataExport || '{}';
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = `hobbyorigin-data-${Date.now()}.json`; a.click();
                  URL.revokeObjectURL(url);
                  setExportDone(true);
                } catch(e) { alert(e.message); }
                setExportLoading(false);
              };
              const handleDelete = async () => {
                setDeleteError('');
                if (!deleteConfirmPw) { setDeleteError('Please enter your password to confirm.'); return; }
                if (!window.confirm('This will permanently delete your account. This cannot be undone. Are you absolutely sure?')) return;
                try {
                  await deleteAccount({ variables: { password: deleteConfirmPw } });
                  logout(); navigate('/');
                } catch(e) { setDeleteError(e.message); }
              };

              return (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
                    HobbyOrigin complies with <strong>GDPR</strong> and <strong>CPRA</strong>. Manage your data and consent preferences below.{' '}
                    <Link to="/privacy" style={{ color: 'var(--primary)' }}>Full Privacy Policy →</Link>
                  </p>

                  {/* Consent toggles */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>Consent &amp; Preferences</div>
                    {[
                      { key: 'marketingConsent', label: '📣 Marketing communications', desc: 'Hobby recommendations, expert picks, new features by email' },
                      { key: 'analyticsConsent', label: '📊 Analytics cookies', desc: 'Help us improve HobbyOrigin with anonymous usage data' },
                      { key: 'doNotSell', label: '🚫 Do Not Sell or Share My Data (CPRA)', desc: 'Opt out of any sale or sharing of your personal information with third parties for advertising. We do not sell your data, but you can formally record this preference.' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', marginBottom: 2 }}>{label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: privacySaving ? 'wait' : 'pointer' }}>
                          <input type="checkbox"
                            checked={key === 'doNotSell' ? !!(ps?.doNotSell) : !!(ps?.[key])}
                            onChange={e => handlePrivacyToggle(key, e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }} />
                          <span style={{
                            position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: 24,
                            background: (key === 'doNotSell' ? ps?.doNotSell : ps?.[key]) ? 'var(--primary)' : 'var(--border)',
                            transition: 'background 0.2s'
                          }}>
                            <span style={{
                              position: 'absolute', top: 2, left: (key === 'doNotSell' ? ps?.doNotSell : ps?.[key]) ? 22 : 2,
                              width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s'
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Consent history */}
                  {ps && (
                    <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text)', fontSize: 'var(--font-sm)' }}>📋 Consent Record</div>
                      {ps.termsAcceptedAt && <div>✅ Terms of Service accepted: {new Date(ps.termsAcceptedAt).toLocaleString()}</div>}
                      {ps.privacyAcceptedAt && <div>✅ Privacy Policy accepted: {new Date(ps.privacyAcceptedAt).toLocaleString()}</div>}
                      {ps.lastUpdated && <div>🕐 Preferences last updated: {new Date(ps.lastUpdated).toLocaleString()}</div>}
                    </div>
                  )}

                  {/* Data export */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>Data Portability (GDPR Art. 20 · CPRA)</div>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 12 }}>Download a copy of all personal data we hold about you in JSON format.</p>
                    <button className="btn btn-ghost" onClick={handleExport} disabled={exportLoading}>
                      {exportLoading ? '⏳ Preparing your data…' : exportDone ? '✅ Downloaded!' : '📥 Export My Data'}
                    </button>
                  </div>

                  {/* Account deletion */}
                  <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--danger)', marginBottom: 8 }}>⚠️ Delete My Account (GDPR Art. 17 — Right to Erasure)</div>
                    <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
                      This permanently deletes your account, profile, and personal data. Messages are anonymised (not deleted) to preserve group conversation context. This action <strong>cannot be undone</strong>.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input className="input" type="password" placeholder="Confirm with your password" value={deleteConfirmPw}
                        onChange={e => setDeleteConfirmPw(e.target.value)} style={{ maxWidth: 260 }} />
                      <button className="btn" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}
                        onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Deleting…' : '🗑 Delete My Account'}
                      </button>
                    </div>
                    {deleteError && <div style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', marginTop: 8 }}>{deleteError}</div>}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
