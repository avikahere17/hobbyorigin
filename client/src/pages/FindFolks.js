import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FIND_FOLKS_QUERY, SEND_BUDDY_MUTATION } from '../graphql';

const PROXIMITY_STYLES = {
  building: { bg:'#fef3c7', color:'#92400e', label:'🏢 Same building', chip:'proximity-building' },
  neighborhood: { bg:'#dbeafe', color:'#1e40af', label:'🏘️ Same neighborhood', chip:'proximity-neighborhood' },
  city: { bg:'#f0fdf4', color:'#166534', label:'🏙️ Same city', chip:'proximity-city' },
};

const AG_EMOJI = { KIDS:'🧒', TEENS:'🧑', ADULTS:'👤', SENIORS:'👴' };
const AG_LABEL = { KIDS:'Kid', TEENS:'Teen', ADULTS:'Adult', SENIORS:'Senior' };

function FolkCard({ folk, onBuddy }) {
  const { user, sharedInterests, proximity, buddyStatus } = folk;
  const prox = PROXIMITY_STYLES[proximity] || PROXIMITY_STYLES.city;
  const [sent, setSent] = useState(buddyStatus === 'pending');

  const handleBuddy = async () => {
    await onBuddy(user.id);
    setSent(true);
  };

  return (
    <div className="card" style={{display:'flex',flexDirection:'column',gap:14,transition:'all 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='var(--primary)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='';}}>

      <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
        <div className="avatar avatar-lg" style={{background:user.avatarColor,flexShrink:0}}>
          {user.name[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
            <Link to={`/profile/${user.id}`} style={{fontWeight:800,fontSize:'var(--font-lg)'}}>{user.name}</Link>
            <span className={`badge ag-${user.ageGroup}`}>{AG_EMOJI[user.ageGroup]} {AG_LABEL[user.ageGroup]}</span>
          </div>
          <div className="badge" style={{background:prox.bg,color:prox.color,marginBottom:6}}>{prox.label}</div>
          {user.bio && <p style={{fontSize:'var(--font-sm)',color:'var(--text-muted)',lineHeight:1.5,marginTop:4}}>{user.bio}</p>}
        </div>
      </div>

      {/* Shared interests */}
      {sharedInterests.length>0 && (
        <div>
          <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-muted)',fontWeight:600,marginBottom:6}}>
            🤝 {sharedInterests.length} shared interest{sharedInterests.length!==1?'s':''}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {sharedInterests.map(i=><span key={i} className="badge badge-primary">{i}</span>)}
          </div>
        </div>
      )}

      {/* Their interests */}
      {user.interests?.filter(i=>!sharedInterests.includes(i)).length>0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {user.interests.filter(i=>!sharedInterests.includes(i)).slice(0,4).map(i=>(
            <span key={i} className="badge badge-dim" style={{fontSize:'calc(var(--font-sm) - 2px)'}}>{i}</span>
          ))}
        </div>
      )}

      {/* Common groups */}
      {user.joinedGroups?.length>0 && (
        <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-dim)'}}>
          In {user.joinedGroups.length} group{user.joinedGroups.length!==1?'s':''}
        </div>
      )}

      {/* Actions */}
      <div style={{display:'flex',gap:8}}>
        <Link to={`/profile/${user.id}`} className="btn btn-ghost btn-sm" style={{flex:1,textAlign:'center'}}>View Profile</Link>
        <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={handleBuddy} disabled={sent}>
          {sent ? '✓ Request sent' : '🤝 Connect'}
        </button>
      </div>
    </div>
  );
}

export default function FindFolks({ onAuthRequired }) {
  const { currentUser } = useAuth();
  const [filters, setFilters] = useState({
    ageGroup: '', scope: 'city',
  });
  const setF = (k,v) => setFilters(f=>({...f,[k]:v}));

  const [sendBuddy] = useMutation(SEND_BUDDY_MUTATION);

  const { data, loading } = useQuery(FIND_FOLKS_QUERY, {
    skip: !currentUser,
    variables: {
      interests: currentUser?.interests,
      city: currentUser?.location?.city||null,
      building: filters.scope==='building'?(currentUser?.location?.building||null):null,
      neighborhood: filters.scope==='neighborhood'?(currentUser?.location?.neighborhood||null):null,
      ageGroup: filters.ageGroup||null,
    },
    fetchPolicy: 'cache-and-network',
  });

  const folks = data?.findFolks || [];
  const isKids = currentUser?.ageGroup === 'KIDS';
  const isSenior = currentUser?.ageGroup === 'SENIORS';

  if (!currentUser) return (
    <div className="page">
      <div className="container" style={{paddingTop:60}}>
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <div className="empty-state-title">Find people near you</div>
          <div className="empty-state-desc">Sign in to discover people with shared interests in your building, neighborhood, or city.</div>
          <button className="btn btn-primary btn-lg" style={{marginTop:20}} onClick={()=>onAuthRequired('register')}>Join free</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))',borderBottom:'2px solid var(--border)',padding:'32px 0 24px'}}>
        <div className="container">
          <h1 style={{fontSize:'var(--font-hero)',fontWeight:800,marginBottom:8}}>
            {isKids?'🤝 Find Friends!':isSenior?'🤝 Find Neighbors & Friends':'Find Folks'}
          </h1>
          <p style={{color:'var(--text-muted)',fontSize:'var(--font-base)',maxWidth:480}}>
            {isKids?'Find kids near you who love the same things! Make new friends in your building or neighborhood.':
             isSenior?'Discover people nearby who share your hobbies and interests. Everyone is welcome!':
             'Discover people nearby who share your interests. Matched by location and hobbies.'}
          </p>

          {/* Your interests display */}
          {currentUser.interests?.length>0 && (
            <div style={{marginTop:14,display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
              <span style={{fontSize:'var(--font-sm)',color:'var(--text-muted)',fontWeight:600}}>Matching on:</span>
              {currentUser.interests.map(i=><span key={i} className="badge badge-primary">{i}</span>)}
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{padding:'24px 16px'}}>
        {/* Filters */}
        <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBottom:24,padding:'16px 20px',background:'var(--surface)',border:'2px solid var(--border)',borderRadius:'var(--radius)'}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:'var(--font-sm)',fontWeight:600,color:'var(--text-muted)',marginBottom:8}}>
              📍 {isSenior?'Search area':'Search radius'}
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {v:'building',l:isSenior?'🏢 My building':'🏢 Building'},
                {v:'neighborhood',l:isSenior?'🏘️ My area':'🏘️ Neighborhood'},
                {v:'city',l:isSenior?'🏙️ My city':'🏙️ City'},
              ].map(s=>(
                <button key={s.v} onClick={()=>setF('scope',s.v)}
                  style={{padding:'7px 14px',borderRadius:20,border:`2px solid ${filters.scope===s.v?'var(--primary)':'var(--border)'}`,background:filters.scope===s.v?'var(--primary-light)':'transparent',color:filters.scope===s.v?'var(--primary)':'var(--text-muted)',cursor:'pointer',fontWeight:600,fontSize:'var(--font-sm)',fontFamily:'inherit'}}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize:'var(--font-sm)',fontWeight:600,color:'var(--text-muted)',marginBottom:8}}>
              👥 {isSenior?'Age group':'Age group'}
            </div>
            <select className="input" style={{width:'auto',minWidth:150}} value={filters.ageGroup} onChange={e=>setF('ageGroup',e.target.value)}>
              <option value="">All ages</option>
              <option value="KIDS">🧒 Kids</option>
              <option value="TEENS">🧑 Teens</option>
              <option value="ADULTS">👤 Adults</option>
              <option value="SENIORS">👴 Seniors</option>
            </select>
          </div>
        </div>

        {/* No location warning */}
        {!currentUser.location?.city && (
          <div style={{padding:'14px 20px',background:'var(--warning)',background:'rgba(245,158,11,0.1)',border:'2px solid rgba(245,158,11,0.3)',borderRadius:'var(--radius)',marginBottom:20,color:'var(--warning)',fontSize:'var(--font-sm)',fontWeight:500}}>
            ⚠️ Add your location in your <Link to={`/profile/${currentUser.id}`} style={{color:'var(--primary)',fontWeight:700}}>profile</Link> to find people nearby!
          </div>
        )}

        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {!loading && folks.length===0 && (
          <div className="empty-state">
            <div className="empty-state-icon">{isKids?'🌱':'🔍'}</div>
            <div className="empty-state-title">{isKids?'No friends found yet!':'No matches found'}</div>
            <div className="empty-state-desc">
              {currentUser.interests?.length===0 ?
                'Add interests to your profile to find matching people!' :
                'Try widening your search area, or invite friends to join!'}
            </div>
            <Link to={`/profile/${currentUser.id}`} className="btn btn-primary" style={{marginTop:16,display:'inline-flex'}}>
              {isSenior?'Update My Profile':'Update Profile & Interests'}
            </Link>
          </div>
        )}

        {!loading && folks.length>0 && (
          <>
            <div style={{marginBottom:16,fontSize:'var(--font-sm)',color:'var(--text-muted)',fontWeight:600}}>
              Found {folks.length} {isKids?'friend':isSenior?'neighbor':'folk'}{folks.length!==1?'s':''} matching your interests
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
              {folks.map(folk=>(
                <FolkCard key={folk.user.id} folk={folk} onBuddy={async(id)=>{
                  try { await sendBuddy({ variables:{ toUserId:id }}); } catch(e){ alert(e.message); }
                }} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
