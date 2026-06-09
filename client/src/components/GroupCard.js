import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { JOIN_GROUP_MUTATION, GROUPS_QUERY } from '../graphql';

const CATEGORY_COLORS = {
  'Programming':'#6366f1','Art & Design':'#ec4899','Music':'#f97316','Gaming':'#14b8a6',
  'Science':'#06b6d4','Writing':'#84cc16','Business':'#eab308','Sports':'#10b981',
  'Language':'#8b5cf6','Cooking':'#f97316','Gardening':'#22c55e','Reading':'#a78bfa',
  'Dance':'#f43f5e','Crafts':'#fb923c','Photography':'#0ea5e9','Other':'#94a3b8',
};

const AG_LABELS = { KIDS:'🧒 Kids', TEENS:'🧑 Teens', ADULTS:'👤 Adults', SENIORS:'👴 Seniors' };
const FREQ_LABEL = { weekly:'Weekly', daily:'Daily', biweekly:'Bi-weekly', monthly:'Monthly' };
const DAY_SHORT = { Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',Thursday:'Thu',Friday:'Fri',Saturday:'Sat',Sunday:'Sun' };

export default function GroupCard({ group, onAuthRequired }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [joinGroup, { loading }] = useMutation(JOIN_GROUP_MUTATION, {
    refetchQueries: [{ query: GROUPS_QUERY }],
  });

  const catColor = CATEGORY_COLORS[group.category] || '#6366f1';
  const pct = Math.min((group.memberCount / group.maxMembers) * 100, 100);
  const hasSchedule = group.schedule?.day;

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!currentUser) { onAuthRequired(); return; }
    try { await joinGroup({ variables: { groupId: group.id } }); navigate(`/group/${group.id}`); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="card" onClick={() => navigate(`/group/${group.id}`)}
      style={{cursor:'pointer',transition:'all 0.2s',display:'flex',flexDirection:'column',gap:12}}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.borderColor=catColor+'80';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='';}}>

      {/* Category bar */}
      <div style={{height:4,borderRadius:2,background:catColor,margin:'-20px -20px 0',borderTopLeftRadius:'var(--radius)',borderTopRightRadius:'var(--radius)'}} />

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginTop:4}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:8}}>
            <span className="badge" style={{background:catColor+'22',color:catColor}}>{group.category}</span>
            <span className={`badge ${group.isOpen?'badge-success':'badge-full'}`}>
              {group.isOpen?'● Open':'● Full'}
            </span>
            {group.isMember && <span className="badge badge-primary">✓ Joined</span>}
          </div>
          <h3 style={{fontSize:'var(--font-base)',fontWeight:700,lineHeight:1.3,marginBottom:4}}>{group.name}</h3>
          <p style={{fontSize:'var(--font-sm)',color:'var(--text-muted)',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {group.description}
          </p>
        </div>
      </div>

      {/* Age groups */}
      {group.ageGroups?.length > 0 && group.ageGroups.length < 4 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {group.ageGroups.map(ag=>(
            <span key={ag} className={`badge ag-${ag}`} style={{fontSize:'calc(var(--font-sm) - 2px)'}}>{AG_LABELS[ag]}</span>
          ))}
        </div>
      )}

      {/* Schedule */}
      {hasSchedule && (
        <div className="schedule-pill" style={{alignSelf:'flex-start',fontSize:'calc(var(--font-sm) - 1px)'}}>
          📅 {DAY_SHORT[group.schedule.day]}s {group.schedule.time}
          {group.schedule.duration && ` · ${group.schedule.duration}min`}
        </div>
      )}

      {/* Location */}
      {(group.location?.building || group.location?.city) && (
        <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>
          📍 {group.location.building || group.location.neighborhood || group.location.city}
        </div>
      )}

      {/* Tags */}
      {group.tags?.length > 0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {group.tags.slice(0,4).map(t=><span key={t} className="badge badge-dim" style={{fontSize:'calc(var(--font-sm) - 2px)'}}>#{t}</span>)}
        </div>
      )}

      {/* Members + progress */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center'}}>
            {group.members?.slice(0,6).map((m,i)=>(
              <div key={m.id} className="avatar avatar-sm" title={m.name}
                style={{background:m.avatarColor,marginLeft:i>0?-8:0,border:'2px solid var(--surface)',zIndex:6-i,fontSize:11}}>
                {m.name[0].toUpperCase()}
              </div>
            ))}
            {group.memberCount>6 && (
              <div className="avatar avatar-sm" style={{background:'var(--surface3)',marginLeft:-8,fontSize:10,border:'2px solid var(--surface)'}}>
                +{group.memberCount-6}
              </div>
            )}
          </div>
          <span style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-muted)'}}>{group.memberCount}/{group.maxMembers}</span>
        </div>
        <div style={{height:5,background:'var(--surface3)',borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${pct}%`,background:pct>=100?'var(--danger)':catColor,borderRadius:3,transition:'width 0.4s'}} />
        </div>
      </div>

      {/* Footer */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-dim)'}}>
          <div className="avatar" style={{background:group.creator?.avatarColor,width:18,height:18,fontSize:9}}>{group.creator?.name[0].toUpperCase()}</div>
          by {group.creator?.name}
        </div>
        {group.isMember ? (
          <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();navigate(`/group/${group.id}`);}}>
            {currentUser?.ageGroup==='KIDS'?'Go play! →':'Open →'}
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={handleJoin} disabled={loading||!group.isOpen}>
            {loading?'…':group.isOpen?currentUser?.ageGroup==='KIDS'?'Join! 🎉':'Join':'Full'}
          </button>
        )}
      </div>
    </div>
  );
}
