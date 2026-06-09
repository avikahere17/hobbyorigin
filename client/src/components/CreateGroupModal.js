import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CREATE_GROUP_MUTATION, GROUPS_QUERY } from '../graphql';

const CATEGORIES = ['Programming','Art & Design','Music','Gaming','Science','Writing','Business','Sports','Language','Cooking','Gardening','Reading','Dance','Crafts','Photography','Other'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const FREQUENCIES = [{value:'daily',label:'Every day'},{value:'weekly',label:'Weekly'},{value:'biweekly',label:'Every 2 weeks'},{value:'monthly',label:'Monthly'}];
const AGE_GROUPS = [{v:'KIDS',l:'🧒 Kids (5–12)'},{v:'TEENS',l:'🧑 Teens (13–17)'},{v:'ADULTS',l:'👤 Adults (18–59)'},{v:'SENIORS',l:'👴 Seniors (60+)'}];

export default function CreateGroupModal({ onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:'', description:'', category:'Programming', tags:'', maxMembers:8,
    ageGroups:['KIDS','TEENS','ADULTS','SENIORS'],
    building: currentUser?.location?.building||'',
    neighborhood: currentUser?.location?.neighborhood||'',
    city: currentUser?.location?.city||'',
    scheduleDay:'', scheduleTime:'', scheduleFrequency:'weekly', scheduleDuration:60,
    hasSchedule: false,
  });
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleAg = (ag) => set('ageGroups', form.ageGroups.includes(ag) ? form.ageGroups.filter(a=>a!==ag) : [...form.ageGroups, ag]);

  const [createGroup, { loading }] = useMutation(CREATE_GROUP_MUTATION, { refetchQueries: [{ query: GROUPS_QUERY }] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step===1) { setStep(2); return; }
    setError('');
    const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
    try {
      const { data } = await createGroup({ variables: {
        name:form.name, description:form.description, category:form.category, tags, maxMembers:parseInt(form.maxMembers),
        ageGroups:form.ageGroups,
        city:form.city||null, building:form.building||null, neighborhood:form.neighborhood||null,
        scheduleDay: form.hasSchedule?form.scheduleDay:null,
        scheduleTime: form.hasSchedule?form.scheduleTime:null,
        scheduleFrequency: form.hasSchedule?form.scheduleFrequency:null,
        scheduleDuration: form.hasSchedule?parseInt(form.scheduleDuration):null,
      }});
      onClose();
      navigate(`/group/${data.createGroup.id}`);
    } catch(err) { setError(err.message); }
  };

  const isKids = currentUser?.ageGroup === 'KIDS';
  const isSenior = currentUser?.ageGroup === 'SENIORS';

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <h2 style={{fontSize:'var(--font-xl)',fontWeight:800,marginBottom:4}}>
          {isKids ? '🎉 Start a Group!' : '✨ Create a Group'}
        </h2>
        <p style={{color:'var(--text-muted)',fontSize:'var(--font-sm)',marginBottom:20}}>
          {step===1 ? 'Tell people what you\'re working on' : 'Schedule & who can join'}
        </p>
        <div style={{display:'flex',gap:6,marginBottom:20}}>
          {[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:2,background:step>=s?'var(--primary)':'var(--border)',transition:'background 0.2s'}} />)}
        </div>

        <form onSubmit={handleSubmit}>
          {step===1 && <>
            <div className="form-group">
              <label className="form-label">{isKids?'What\'s your group called? 🌟':'Group name *'}</label>
              <input className="input" placeholder={isKids?'e.g. After-School Art Club!':'e.g. Weekend Chess Players'} value={form.name} onChange={e=>set('name',e.target.value)} required maxLength={60} />
            </div>
            <div className="form-group">
              <label className="form-label">{isSenior?'What will your group do?':'Description *'}</label>
              <textarea className="input" placeholder={isKids?'What fun stuff will you do together?':isSenior?'Describe your group in simple terms…':'What are you working on? Who are you looking for?'} value={form.description} onChange={e=>set('description',e.target.value)} required rows={3} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="input" value={form.category} onChange={e=>set('category',e.target.value)} style={{background:'var(--surface2)',cursor:'pointer'}}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{isSenior?'Max people (2–200)':'Max members'}</label>
                <input className="input" type="number" min={2} max={200} value={form.maxMembers} onChange={e=>set('maxMembers',e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma separated, optional)</label>
              <input className="input" placeholder="e.g. beginner, fun, weekly" value={form.tags} onChange={e=>set('tags',e.target.value)} />
            </div>
          </>}

          {step===2 && <>
            {/* Who can join */}
            <div className="form-group">
              <label className="form-label">Who can join? (select all that apply)</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
                {AGE_GROUPS.map(({v,l})=>(
                  <button key={v} type="button"
                    onClick={()=>toggleAg(v)}
                    style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',border:`2px solid ${form.ageGroups.includes(v)?'var(--primary)':'var(--border)'}`,background:form.ageGroups.includes(v)?'var(--primary-light)':'transparent',color:form.ageGroups.includes(v)?'var(--primary)':'var(--text-muted)',cursor:'pointer',fontWeight:600,fontSize:'var(--font-sm)',textAlign:'left',fontFamily:'inherit'}}>
                    {form.ageGroups.includes(v)?'✓ ':''}{l}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">📍 Location (helps local people find you)</label>
              <input className="input" placeholder="Building or premises (e.g. Community Center)" value={form.building} onChange={e=>set('building',e.target.value)} style={{marginBottom:8}} />
              <input className="input" placeholder="City (optional)" value={form.city} onChange={e=>set('city',e.target.value)} />
            </div>

            {/* Schedule */}
            <div className="form-group">
              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontWeight:600,fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>
                <input type="checkbox" checked={form.hasSchedule} onChange={e=>set('hasSchedule',e.target.checked)} style={{width:18,height:18,accentColor:'var(--primary)'}} />
                {isSenior?'📅 Set meeting time (we\'ll send reminders!)':'📅 Add a recurring schedule'}
              </label>
            </div>

            {form.hasSchedule && (
              <div style={{background:'var(--surface2)',borderRadius:'var(--radius-sm)',padding:14,display:'grid',gap:10}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Day</label>
                    <select className="input" value={form.scheduleDay} onChange={e=>set('scheduleDay',e.target.value)} style={{background:'var(--surface)',cursor:'pointer'}}>
                      <option value="">Pick a day</option>
                      {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Time</label>
                    <input className="input" type="time" value={form.scheduleTime} onChange={e=>set('scheduleTime',e.target.value)} style={{background:'var(--surface)'}} />
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Frequency</label>
                    <select className="input" value={form.scheduleFrequency} onChange={e=>set('scheduleFrequency',e.target.value)} style={{background:'var(--surface)',cursor:'pointer'}}>
                      {FREQUENCIES.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Duration (minutes)</label>
                    <input className="input" type="number" min={15} max={480} value={form.scheduleDuration} onChange={e=>set('scheduleDuration',e.target.value)} style={{background:'var(--surface)'}} />
                  </div>
                </div>
                <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--primary)',background:'var(--primary-light)',borderRadius:'var(--radius-sm)',padding:'8px 12px'}}>
                  ⏰ Members will get reminder notifications 1 hour before each session!
                </div>
              </div>
            )}
          </>}

          {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 14px',color:'var(--danger)',fontSize:'var(--font-sm)',marginBottom:12}}>{error}</div>}

          <div style={{display:'flex',gap:10,marginTop:8}}>
            {step===2 && <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(1)}>← Back</button>}
            <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={loading}>
              {loading?'Creating…':step===1?'Next →':isKids?'🎉 Start Group!':'🚀 Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
