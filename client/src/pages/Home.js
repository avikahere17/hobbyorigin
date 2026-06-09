import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components/GroupCard';
import CreateGroupModal from '../components/CreateGroupModal';
import { GROUPS_QUERY } from '../graphql';

const CATEGORIES = ['All','Programming','Art & Design','Music','Gaming','Science','Writing','Business','Sports','Language','Cooking','Gardening','Reading','Dance','Crafts','Photography','Other'];

function HeroText({ user }) {
  if (!user) return (
    <>
      <h1 style={{fontSize:'var(--font-hero)',fontWeight:800,lineHeight:1.15,marginBottom:12}}>
        Find your people.<br />
        <span style={{background:'linear-gradient(135deg,var(--primary),var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Build great things together.
        </span>
      </h1>
      <p style={{color:'var(--text-muted)',fontSize:'var(--font-lg)',marginBottom:24,maxWidth:500}}>
        For kids, teens, adults, and seniors — find hobby groups in your building, neighborhood, or city.
      </p>
    </>
  );
  if (user.ageGroup === 'KIDS') return (
    <>
      <h1 style={{fontSize:'var(--font-hero)',fontWeight:800,lineHeight:1.15,marginBottom:12}}>
        Hi {user.name.split(' ')[0]}! 👋<br />
        <span style={{background:'linear-gradient(135deg,var(--primary),var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Let's find friends & fun! 🎉
        </span>
      </h1>
      <p style={{color:'var(--text-muted)',fontSize:'var(--font-lg)',marginBottom:24}}>
        Find kids near you who love the same things. Join a group, make friends, have fun!
      </p>
    </>
  );
  if (user.ageGroup === 'SENIORS') return (
    <>
      <h1 style={{fontSize:'var(--font-hero)',fontWeight:800,lineHeight:1.15,marginBottom:12}}>
        Welcome, {user.name.split(' ')[0]}!<br />
        <span style={{background:'linear-gradient(135deg,var(--primary),var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Connect with neighbors &amp; friends
        </span>
      </h1>
      <p style={{color:'var(--text-muted)',fontSize:'var(--font-lg)',marginBottom:24,maxWidth:500}}>
        Find people nearby who share your interests. Join groups, set meeting times, and get reminders.
      </p>
    </>
  );
  return (
    <>
      <h1 style={{fontSize:'var(--font-hero)',fontWeight:800,lineHeight:1.15,marginBottom:12}}>
        Hey {user.name.split(' ')[0]}! 👋<br />
        <span style={{background:'linear-gradient(135deg,var(--primary),var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Find your people.
        </span>
      </h1>
      <p style={{color:'var(--text-muted)',fontSize:'var(--font-lg)',marginBottom:24}}>
        Groups of people building, creating, and learning together — nearby and online.
      </p>
    </>
  );
}

export default function Home({ onAuthRequired }) {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [localOnly, setLocalOnly] = useState(false);

  const { data, loading, error } = useQuery(GROUPS_QUERY, {
    variables: {
      category: category==='All'?undefined:category,
      search: search||undefined,
      city: localOnly&&currentUser?.location?.city ? currentUser.location.city : undefined,
      building: localOnly&&currentUser?.location?.building ? currentUser.location.building : undefined,
    },
    pollInterval: 15000,
  });

  let groups = data?.groups || [];
  if (filter==='open') groups = groups.filter(g=>g.isOpen);
  if (filter==='joined') groups = groups.filter(g=>g.isMember);
  if (currentUser?.ageGroup && filter==='mine') groups = groups.filter(g=>g.ageGroups?.includes(currentUser.ageGroup));

  // Smart categorization: joined > location match > interest match > rest
  if (currentUser && filter === 'all' && !search && category === 'All') {
    const userCity = currentUser?.location?.city?.toLowerCase() || '';
    const userBuilding = currentUser?.location?.building?.toLowerCase() || '';
    const userInterests = (currentUser?.interests || []).map(i => i.toLowerCase());
    groups = [...groups].sort((a, b) => {
      const score = g => {
        if (g.isMember) return 4;
        const gCity = (g.location?.city || '').toLowerCase();
        const gBuilding = (g.location?.building || '').toLowerCase();
        const nearBy = (userBuilding && gBuilding && gBuilding === userBuilding) || (userCity && gCity && gCity === userCity);
        if (nearBy) return 3;
        const tags = [...(g.tags || []), g.category || ''].map(t => t.toLowerCase());
        const hasInterest = userInterests.some(i => tags.some(t => t.includes(i) || i.includes(t)));
        if (hasInterest) return 2;
        return 1;
      };
      return score(b) - score(a);
    });
  }

  const isKids = currentUser?.ageGroup === 'KIDS';
  const isSenior = currentUser?.ageGroup === 'SENIORS';

  return (
    <div className="page">
      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))',borderBottom:'2px solid var(--border)',padding:'40px 0 28px'}}>
        <div className="container">
          <HeroText user={currentUser} />

          {/* Search + CTA row */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{flex:1,maxWidth:400}}>
              <input className="input" placeholder={isKids?'🔍 Search for something fun…':isSenior?'🔍 Search groups…':'🔍 Search groups…'} value={search} onChange={e=>setSearch(e.target.value)} style={{height:48,fontSize:'var(--font-base)'}} />
            </div>
            {currentUser ? (
              <button className="btn btn-primary btn-lg" onClick={()=>setShowCreate(true)}>
                {isKids?'🎉 Start a Group!':isSenior?'🤝 Start a Group':'✨ Create Group'}
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={()=>onAuthRequired('register')}>
                Join free — for everyone!
              </button>
            )}
          </div>

          {/* Local toggle — only show if user has location */}
          {currentUser?.location?.city && (
            <div style={{marginTop:14,display:'flex',alignItems:'center',gap:10}}>
              <button onClick={()=>setLocalOnly(!localOnly)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',borderRadius:20,border:`2px solid ${localOnly?'var(--primary)':'var(--border)'}`,background:localOnly?'var(--primary-light)':'transparent',cursor:'pointer',fontWeight:600,fontSize:'var(--font-sm)',color:localOnly?'var(--primary)':'var(--text-muted)',fontFamily:'inherit'}}>
                📍 {localOnly?`Showing: ${currentUser.location.building||currentUser.location.city}`:'Near me'}
              </button>
              {localOnly && <span style={{fontSize:'var(--font-sm)',color:'var(--text-dim)'}}>Showing groups in your area</span>}
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{padding:'24px 16px'}}>
        {/* Category scroll */}
        <div style={{overflowX:'auto',marginBottom:16,paddingBottom:4}}>
          <div style={{display:'flex',gap:8,minWidth:'max-content'}}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCategory(c)} className="btn btn-sm"
                style={{background:category===c?'var(--primary)':'var(--surface)',color:category===c?'#fff':'var(--text-muted)',border:`2px solid ${category===c?'var(--primary)':'var(--border)'}`,flexShrink:0}}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Filter row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {[
              {v:'all',l:isSenior?'All Groups':'All'},
              {v:'open',l:'● Open'},
              {v:'joined',l:'✓ Joined'},
              ...(currentUser?[{v:'mine',l:`For ${currentUser.ageGroup==='KIDS'?'Kids':currentUser.ageGroup==='SENIORS'?'Seniors':'Me'}`}]:[]),
            ].map(f=>(
              <button key={f.v} onClick={()=>setFilter(f.v)}
                style={{padding:'7px 14px',borderRadius:20,fontSize:'var(--font-sm)',border:'none',cursor:'pointer',fontFamily:'inherit',fontWeight:600,background:filter===f.v?'var(--primary-light)':'transparent',color:filter===f.v?'var(--primary)':'var(--text-muted)'}}>
                {f.l}
              </button>
            ))}
          </div>
          <span style={{fontSize:'var(--font-sm)',color:'var(--text-dim)'}}>{groups.length} group{groups.length!==1?'s':''}</span>
        </div>

        {/* Groups grid */}
        {loading && !data && <div className="loading-center"><div className="spinner" /></div>}
        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'2px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius)',padding:20,color:'var(--danger)'}}>
            ⚠️ Could not load groups. Please check your connection and try again.
          </div>
        )}
        {!loading && groups.length===0 && (
          <div className="empty-state">
            <div className="empty-state-icon">{isKids?'🌱':'🌟'}</div>
            <div className="empty-state-title">{isKids?'No groups found yet!':'No groups found'}</div>
            <div className="empty-state-desc">{search?`No results for "${search}"`:'Be the first to start one!'}</div>
            {currentUser && <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setShowCreate(true)}>{isKids?'Start a group! 🎉':'Create a Group'}</button>}
          </div>
        )}
        {!loading && groups.length>0 && (() => {
          // Smart section dividers when using smart sort
          const userCity = currentUser?.location?.city?.toLowerCase() || '';
          const userBuilding = currentUser?.location?.building?.toLowerCase() || '';
          const userInterests = (currentUser?.interests || []).map(i => i.toLowerCase());
          const smartSort = currentUser && filter === 'all' && !search && category === 'All';

          const getSection = g => {
            if (!smartSort) return null;
            if (g.isMember) return 'joined';
            const gCity = (g.location?.city || '').toLowerCase();
            const gBuilding = (g.location?.building || '').toLowerCase();
            const nearBy = (userBuilding && gBuilding && gBuilding === userBuilding) || (userCity && gCity && gCity === userCity);
            if (nearBy) return 'nearby';
            const tags = [...(g.tags || []), g.category || ''].map(t => t.toLowerCase());
            const hasInterest = userInterests.some(i => tags.some(t => t.includes(i) || i.includes(t)));
            if (hasInterest) return 'interests';
            return 'other';
          };

          const SECTION_LABELS = {
            joined: { icon: '✅', label: 'Your Groups', color: 'var(--primary)' },
            nearby: { icon: '📍', label: 'Near You', color: '#10b981' },
            interests: { icon: '💡', label: 'Based on Your Interests', color: '#f97316' },
            other: { icon: '🌐', label: 'Explore More', color: 'var(--text-muted)' },
          };

          let lastSection = null;
          const items = [];
          groups.forEach((g, i) => {
            const sec = getSection(g);
            if (sec && sec !== lastSection) {
              lastSection = sec;
              const { icon, label, color } = SECTION_LABELS[sec];
              items.push(
                <div key={`sec-${sec}`} style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:10,marginTop:i>0?16:0}}>
                  <span style={{fontSize:18}}>{icon}</span>
                  <span style={{fontWeight:700,color,fontSize:'var(--font-base)'}}>{label}</span>
                  <div style={{flex:1,height:2,background:'var(--border)',borderRadius:2}}/>
                </div>
              );
            }
            items.push(<GroupCard key={g.id} group={g} onAuthRequired={()=>onAuthRequired('register')} />);
          });

          return (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:16}}>
              {items}
            </div>
          );
        })()}
      </div>

      {showCreate && <CreateGroupModal onClose={()=>setShowCreate(false)} />}
    </div>
  );
}
