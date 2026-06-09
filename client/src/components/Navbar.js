import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { MY_NOTIFICATIONS_QUERY, NOTIFICATION_SUBSCRIPTION, MARK_READ_MUTATION } from '../graphql';

const AGE_EMOJIS = { KIDS:'🧒', TEENS:'🧑', ADULTS:'👤', SENIORS:'👴' };

export default function Navbar({ onAuthClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData, refetch } = useQuery(MY_NOTIFICATIONS_QUERY, {
    skip: !currentUser, pollInterval: 30000,
  });
  const [markRead] = useMutation(MARK_READ_MUTATION, { refetchQueries: [{ query: MY_NOTIFICATIONS_QUERY }] });

  useSubscription(NOTIFICATION_SUBSCRIPTION, {
    skip: !currentUser,
    onData: () => refetch(),
  });

  const notifications = notifData?.myNotifications || [];
  const unread = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  const navLinkStyle = (path) => ({
    padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:'var(--font-sm)', fontWeight:600,
    color: loc.pathname === path ? 'var(--primary)' : 'var(--text-muted)',
    background: loc.pathname === path ? 'var(--primary-light)' : 'transparent',
    transition:'all 0.15s',
  });

  const NAV_LINKS = [
    { path:'/', label: currentUser?.ageGroup==='KIDS' ? '🏠 Home' : currentUser?.ageGroup==='SENIORS' ? '🏠 Home' : 'Explore' },
    { path:'/find-folks', label: currentUser?.ageGroup==='KIDS' ? '🤝 Find Friends' : currentUser?.ageGroup==='SENIORS' ? '🤝 Find Neighbors' : 'Find Folks' },
    { path:'/learn', label: currentUser?.ageGroup==='KIDS' ? '📚 Learn!' : currentUser?.ageGroup==='SENIORS' ? '📚 Library' : '📚 Learn' },
    { path:'/expert', label: currentUser?.role==='EXPERT'||currentUser?.role==='ADMIN' ? '🎓 Expert' : '🎓 Become Expert' },
    { path:'/seller', label: currentUser?.role==='SELLER'||currentUser?.role==='ADMIN' ? '🛍️ Seller' : '🛍️ Sell' },
    ...(currentUser?.role==='ADMIN' ? [{ path:'/admin', label:'👑 Admin' }] : []),
  ];

  return (
    <nav style={{position:'fixed',top:0,left:0,right:0,height:66,zIndex:100,background:'var(--surface)',borderBottom:'2px solid var(--border)',backdropFilter:'blur(12px)'}}>
      <div className="container" style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        {/* Logo */}
        <Link to="/" style={{display:'flex',alignItems:'center',gap:10,fontWeight:800,fontSize:'var(--font-lg)',flexShrink:0}}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="url(#lg1)" />
            <circle cx="16" cy="10" r="4" fill="white" opacity="0.95"/>
            <circle cx="8" cy="22" r="3.5" fill="white" opacity="0.85"/>
            <circle cx="24" cy="22" r="3.5" fill="white" opacity="0.85"/>
            <line x1="16" y1="14" x2="8" y2="18.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
            <line x1="16" y1="14" x2="24" y2="18.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.7"/>
            <line x1="8" y1="22" x2="24" y2="22" stroke="white" strokeWidth="1.8" strokeOpacity="0.5"/>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{background:'linear-gradient(135deg, var(--primary), var(--accent))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            HobbyOrigin
          </span>
        </Link>

        {/* Nav links */}
        {currentUser && (
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            {NAV_LINKS.map(n => (
              <Link key={n.path} to={n.path} style={navLinkStyle(n.path)}>{n.label}</Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {currentUser ? (
            <>
              {/* Notification bell */}
              <div className="notif-bell" style={{position:'relative'}}>
                <button onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); if (!notifOpen && unread) markRead(); }}
                  style={{background:'none',border:'none',cursor:'pointer',padding:8,borderRadius:'var(--radius-sm)',color:'var(--text-muted)',fontSize:20,display:'flex',alignItems:'center'}}>
                  🔔
                </button>
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}

                {notifOpen && (
                  <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:340,maxHeight:420,overflowY:'auto',background:'var(--surface)',border:'2px solid var(--border)',borderRadius:'var(--radius)',boxShadow:'var(--shadow)',zIndex:200}}>
                    <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontWeight:700,fontSize:'var(--font-sm)'}}>Notifications</span>
                      <Link to="/notifications" style={{fontSize:'var(--font-sm)',color:'var(--primary)'}} onClick={()=>setNotifOpen(false)}>See all</Link>
                    </div>
                    {notifications.length===0 ? (
                      <div style={{padding:24,textAlign:'center',color:'var(--text-muted)',fontSize:'var(--font-sm)'}}>No notifications yet</div>
                    ) : notifications.slice(0,6).map(n=>(
                      <div key={n.id} onClick={()=>{setNotifOpen(false);if(n.groupId)navigate(`/group/${n.groupId}`);}}
                        style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',cursor:n.groupId?'pointer':'default',background:n.isRead?'transparent':'var(--primary-light)',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                        onMouseLeave={e=>e.currentTarget.style.background=n.isRead?'transparent':'var(--primary-light)'}>
                        <div style={{fontWeight:600,fontSize:'var(--font-sm)',marginBottom:2}}>{n.title}</div>
                        <div style={{fontSize:'calc(var(--font-sm) - 1px)',color:'var(--text-muted)'}}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div style={{position:'relative'}}>
                <button onClick={()=>{setMenuOpen(!menuOpen);setNotifOpen(false);}}
                  style={{background:'none',border:'2px solid var(--border)',cursor:'pointer',display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:'var(--radius-sm)',color:'var(--text)'}}>
                  <div className="avatar avatar-sm" style={{background:currentUser.avatarColor}}>{currentUser.name[0].toUpperCase()}</div>
                  <span style={{fontSize:'var(--font-sm)',fontWeight:600}}>{currentUser.name.split(' ')[0]}</span>
                  <span style={{fontSize:10,color:'var(--text-muted)'}}>▾</span>
                </button>

                {menuOpen && (
                  <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'var(--surface)',border:'2px solid var(--border)',borderRadius:'var(--radius)',padding:8,minWidth:180,zIndex:200,boxShadow:'var(--shadow)'}}>
                    <div style={{padding:'8px 12px',fontSize:'var(--font-sm)',color:'var(--text-muted)',borderBottom:'1px solid var(--border)',marginBottom:4}}>
                      {AGE_EMOJIS[currentUser.ageGroup]} {currentUser.ageGroup}
                      {currentUser.location?.city && <span style={{display:'block',fontSize:'calc(var(--font-sm) - 1px)'}}>📍 {currentUser.location.city}</span>}
                      {currentUser.walletCoins > 0 && <span style={{display:'block',fontSize:'calc(var(--font-sm) - 1px)',color:'var(--warning)'}}>💰 {currentUser.walletCoins} coins</span>}
                      {currentUser.tipsEarned > 0 && <span style={{display:'block',fontSize:'calc(var(--font-sm) - 1px)',color:'var(--warning)'}}>⭐ {currentUser.tipsEarned} earned</span>}
                    </div>
                    {[
                      {to:`/profile/${currentUser.id}`,label:'👤 My Profile'},
                      {to:'/notifications',label:'🔔 Notifications'},
                      {to:'/wallet',label:'💰 My Wallet'},
                      {to:'/learn',label:'📚 Learning Library'},
                      {to:'/expert',label: currentUser.role==='EXPERT'||currentUser.role==='ADMIN' ? '🎓 Expert Dashboard' : '🎓 Register as Expert'},
                      {to:'/seller',label: currentUser.role==='SELLER'||currentUser.role==='ADMIN' ? '🛍️ Seller Dashboard' : '🛍️ Become a Seller'},
                      ...(currentUser.role==='ADMIN' ? [{to:'/admin',label:'👑 Admin Dashboard'}] : []),
                    ].map(item=>(
                      <Link key={item.to} to={item.to} style={{display:'block',padding:'8px 12px',borderRadius:'var(--radius-sm)',fontSize:'var(--font-sm)',color:'var(--text-muted)'}}
                        onClick={()=>setMenuOpen(false)}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{borderTop:'1px solid var(--border)',marginTop:4,paddingTop:4}}>
                      <button onClick={handleLogout}
                        style={{width:'100%',textAlign:'left',padding:'8px 12px',borderRadius:'var(--radius-sm)',fontSize:'var(--font-sm)',background:'none',border:'none',cursor:'pointer',color:'var(--danger)',fontFamily:'inherit'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={()=>onAuthClick('login')}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={()=>onAuthClick('register')}>Join free</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
