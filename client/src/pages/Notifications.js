import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MY_NOTIFICATIONS_QUERY, MARK_READ_MUTATION } from '../graphql';

const TYPE_META = {
  SESSION_REMINDER: { icon:'⏰', color:'var(--primary)', bg:'var(--primary-light)' },
  NEW_MEMBER:       { icon:'👋', color:'var(--success)', bg:'rgba(16,185,129,0.12)' },
  BUDDY_REQUEST:    { icon:'🤝', color:'var(--accent)',  bg:'rgba(139,92,246,0.12)' },
  NEW_BUDDY:        { icon:'🎉', color:'var(--warning)', bg:'rgba(245,158,11,0.12)' },
  TIP_RECEIVED:     { icon:'⭐', color:'var(--warning)', bg:'rgba(245,158,11,0.15)' },
  default:          { icon:'🔔', color:'var(--text-muted)', bg:'var(--surface2)' },
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useQuery(MY_NOTIFICATIONS_QUERY, { skip:!currentUser, fetchPolicy:'cache-and-network' });
  const [markRead] = useMutation(MARK_READ_MUTATION, { refetchQueries:[{query:MY_NOTIFICATIONS_QUERY}] });

  const notifs = data?.myNotifications || [];
  const isSenior = currentUser?.ageGroup === 'SENIORS';
  const isKids = currentUser?.ageGroup === 'KIDS';

  if (!currentUser) return (
    <div className="page container" style={{paddingTop:80}}>
      <div className="empty-state"><div className="empty-state-icon">🔔</div><div className="empty-state-title">Sign in to see notifications</div></div>
    </div>
  );

  const unread = notifs.filter(n=>!n.isRead).length;

  return (
    <div className="page">
      <div className="container" style={{padding:'32px 16px',maxWidth:680}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:'var(--font-xl)',fontWeight:800,marginBottom:4}}>
              {isKids?'🔔 Your Messages!':isSenior?'🔔 Your Notifications':'🔔 Notifications'}
            </h1>
            {unread>0 && <div style={{fontSize:'var(--font-sm)',color:'var(--text-muted)'}}>{unread} unread</div>}
          </div>
          {unread>0 && (
            <button className="btn btn-ghost btn-sm" onClick={()=>markRead()}>
              {isSenior?'Mark all as read ✓':'Mark all read'}
            </button>
          )}
        </div>

        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {!loading && notifs.length===0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-title">{isKids?'No messages yet!':'All caught up!'}</div>
            <div className="empty-state-desc">
              {isKids?'Join some groups to get notifications!':'Join groups and connect with people to get notifications.'}
            </div>
            <Link to="/" className="btn btn-primary" style={{marginTop:16,display:'inline-flex'}}>
              {isKids?'Find groups! 🎉':isSenior?'Browse Groups':'Explore Groups'}
            </Link>
          </div>
        )}

        <div style={{display:'grid',gap:10}}>
          {notifs.map(n=>{
            const meta = TYPE_META[n.type] || TYPE_META.default;
            return (
              <div key={n.id}
                onClick={()=>{if(n.groupId)navigate(`/group/${n.groupId}`);}}
                style={{display:'flex',gap:14,alignItems:'flex-start',padding:'16px 20px',background:'var(--surface)',border:`2px solid ${n.isRead?'var(--border)':'var(--primary)'}`,borderRadius:'var(--radius)',cursor:n.groupId?'pointer':'default',transition:'all 0.15s',opacity:n.isRead?0.75:1}}
                onMouseEnter={e=>{if(n.groupId)e.currentTarget.style.background='var(--surface2)';}}
                onMouseLeave={e=>e.currentTarget.style.background='var(--surface)'}>

                <div style={{width:44,height:44,borderRadius:'50%',background:meta.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                  {meta.icon}
                </div>

                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:'var(--font-base)',marginBottom:3}}>{n.title}</div>
                  <div style={{color:'var(--text-muted)',fontSize:'var(--font-sm)',lineHeight:1.5,marginBottom:6}}>{n.message}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontSize:'calc(var(--font-sm) - 2px)',color:'var(--text-dim)'}}>{timeAgo(n.createdAt)}</span>
                    {n.scheduledFor && (
                      <span className="schedule-pill" style={{fontSize:'calc(var(--font-sm) - 2px)'}}>
                        📅 {new Date(n.scheduledFor).toLocaleString([],{weekday:'short',hour:'2-digit',minute:'2-digit'})}
                      </span>
                    )}
                    {!n.isRead && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)',display:'inline-block'}} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
