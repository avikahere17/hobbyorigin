import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ADMIN_STATS_QUERY, ADMIN_USERS_QUERY,
  SET_USER_ROLE_MUTATION, SEED_GROUPS_MUTATION,
  LEARNING_CONTENT_QUERY, CREATE_LEARNING_CONTENT_MUTATION, DELETE_LEARNING_CONTENT_MUTATION,
} from '../graphql';

const CONTENT_CATEGORIES = ['General', 'Music', 'Art & Design', 'Programming', 'Sports', 'Cooking', 'Photography', 'Writing', 'Science', 'Wellness', 'Elder Care'];

const ROLES = ['USER', 'EXPERT', 'SELLER', 'ADMIN'];
const ROLE_COLOR = { USER: '#6b7280', EXPERT: '#6366f1', SELLER: '#f59e0b', ADMIN: '#ef4444' };

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--primary)' }}>{value?.toLocaleString() ?? '–'}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [lcTab, setLcTab] = useState('list');
  const [lcForm, setLcForm] = useState({ contentType: 'VIDEO', title: '', body: '', mediaUrl: '', thumbnailUrl: '', category: 'General', tags: '' });
  const setLcF = (k, v) => setLcForm(f => ({ ...f, [k]: v }));

  const { data: statsData, loading: statsLoading } = useQuery(ADMIN_STATS_QUERY);
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(ADMIN_USERS_QUERY, {
    variables: { search: search || null, role: roleFilter || null },
  });
  const { data: lcData, loading: lcLoading, refetch: refetchLC } = useQuery(LEARNING_CONTENT_QUERY, { variables: {} });

  const [setUserRole] = useMutation(SET_USER_ROLE_MUTATION, { refetchQueries: [{ query: ADMIN_USERS_QUERY, variables: { search: search || null, role: roleFilter || null } }] });
  const [seedGroups] = useMutation(SEED_GROUPS_MUTATION);
  const [createLC, { loading: lcCreating }] = useMutation(CREATE_LEARNING_CONTENT_MUTATION, {
    onCompleted: () => { refetchLC(); setLcTab('list'); setLcForm({ contentType: 'VIDEO', title: '', body: '', mediaUrl: '', thumbnailUrl: '', category: 'General', tags: '' }); },
    onError: e => alert(e.message),
  });
  const [deleteLC] = useMutation(DELETE_LEARNING_CONTENT_MUTATION, { onCompleted: refetchLC });

  if (!currentUser) { navigate('/'); return null; }
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="page">
        <div className="container" style={{ paddingTop: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2>Admin access required</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Your account doesn't have admin privileges.</p>
        </div>
      </div>
    );
  }

  const stats = statsData?.adminStats;
  const users = usersData?.adminUsers || [];

  const handleRoleChange = async (userId, role) => {
    try { await setUserRole({ variables: { userId, role } }); }
    catch (e) { alert(e.message); }
  };

  const handleSeedGroups = async () => {
    setSeeding(true); setSeedMsg('');
    try {
      await seedGroups();
      setSeedMsg('✅ Groups seeded successfully!');
      setTimeout(() => setSeedMsg(''), 4000);
    } catch (e) { setSeedMsg('⚠️ ' + e.message); }
    setSeeding(false);
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 4 }}>👑 Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Manage users, roles, and platform settings</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSeedGroups} disabled={seeding}>
              {seeding ? '⏳ Seeding…' : '🌱 Seed Groups'}
            </button>
            {seedMsg && <span style={{ fontSize: 'var(--font-sm)', color: 'var(--success)', alignSelf: 'center' }}>{seedMsg}</span>}
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="👥" label="Users" value={stats.totalUsers} color="var(--primary)" />
            <StatCard icon="🏠" label="Groups" value={stats.totalGroups} color="var(--accent)" />
            <StatCard icon="💬" label="Messages" value={stats.totalMessages} color="var(--success)" />
            <StatCard icon="🎓" label="Experts" value={stats.totalExperts} color="#8b5cf6" />
            <StatCard icon="📅" label="Bookings" value={stats.totalBookings} color="#06b6d4" />
            <StatCard icon="🏷️" label="Coupons" value={stats.totalCoupons} color="var(--warning)" />
          </div>
        )}

        {/* Recent sections */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 'var(--font-base)' }}>🆕 Recent Users</h3>
              {stats.recentUsers.slice(0, 5).map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="avatar avatar-sm" style={{ background: u.avatarColor }}>{u.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${ROLE_COLOR[u.role]}20`, color: ROLE_COLOR[u.role] }}>{u.role}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 'var(--font-base)' }}>🏠 Recent Groups</h3>
              {stats.recentGroups.slice(0, 5).map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.category}</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.memberCount}/{g.maxMembers}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Content */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>📚 Learning Library</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`btn btn-sm ${lcTab==='list'?'btn-primary':'btn-ghost'}`} onClick={()=>setLcTab('list')}>📋 Content</button>
              <button className={`btn btn-sm ${lcTab==='add'?'btn-primary':'btn-ghost'}`} onClick={()=>setLcTab('add')}>+ Add Content</button>
            </div>
          </div>

          {lcTab === 'add' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Type *</label>
                  <select className="input" value={lcForm.contentType} onChange={e => setLcF('contentType', e.target.value)}>
                    <option value="VIDEO">🎬 Video</option>
                    <option value="ARTICLE">📄 Article</option>
                    <option value="AUDIO">🎵 Audio</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="input" value={lcForm.category} onChange={e => setLcF('category', e.target.value)}>
                    {CONTENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="input" value={lcForm.title} onChange={e => setLcF('title', e.target.value)} placeholder="e.g. Beginner Guitar: First 5 Chords" />
              </div>
              {(lcForm.contentType === 'VIDEO' || lcForm.contentType === 'AUDIO') && (
                <div className="form-group">
                  <label className="form-label">{lcForm.contentType === 'VIDEO' ? '🎬' : '🎵'} Media URL</label>
                  <input className="input" value={lcForm.mediaUrl} onChange={e => setLcF('mediaUrl', e.target.value)} placeholder={lcForm.contentType === 'VIDEO' ? 'https://youtube.com/watch?v=... or direct MP4 URL' : 'https://... audio file URL'} />
                </div>
              )}
              {lcForm.contentType === 'VIDEO' && (
                <div className="form-group">
                  <label className="form-label">Thumbnail URL (optional)</label>
                  <input className="input" value={lcForm.thumbnailUrl} onChange={e => setLcF('thumbnailUrl', e.target.value)} placeholder="https://... image URL" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">{lcForm.contentType === 'ARTICLE' ? 'Article body *' : 'Description / notes'}</label>
                <textarea className="input" rows={lcForm.contentType === 'ARTICLE' ? 8 : 3} value={lcForm.body} onChange={e => setLcF('body', e.target.value)} placeholder={lcForm.contentType === 'ARTICLE' ? 'Write your full article here…' : 'Brief description of this resource…'} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="input" value={lcForm.tags} onChange={e => setLcF('tags', e.target.value)} placeholder="beginner, guitar, chords" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setLcTab('list')}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} disabled={lcCreating || !lcForm.title}
                  onClick={() => createLC({ variables: { ...lcForm, tags: lcForm.tags ? lcForm.tags.split(',').map(t=>t.trim()).filter(Boolean) : [] } })}>
                  {lcCreating ? 'Publishing…' : '📤 Publish'}
                </button>
              </div>
            </div>
          )}

          {lcTab === 'list' && (
            lcLoading ? <div className="loading-center"><div className="spinner" /></div> :
            !lcData?.learningContent?.length ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                <p>No content yet. Click <strong>+ Add Content</strong> to publish the first resource.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {lcData.learningContent.map(lc => (
                  <div key={lc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 24 }}>{lc.contentType === 'VIDEO' ? '🎬' : lc.contentType === 'AUDIO' ? '🎵' : '📄'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lc.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lc.category} · 👁 {lc.viewCount} views</div>
                    </div>
                    <span className="badge badge-dim" style={{ fontSize: 10 }}>{lc.contentType}</span>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', flexShrink: 0 }}
                      onClick={() => { if(window.confirm('Delete this content?')) deleteLC({ variables: { id: lc.id } }); }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* User management */}
        <div className="card">
          <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: 16 }}>👥 User Management</h2>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="input" placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ minWidth: 130 }}>
              <option value="">All roles</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => refetchUsers()}>🔄 Refresh</button>
          </div>

          {usersLoading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['User', 'Email', 'Age Group', 'Location', 'Role', 'Action'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ background: u.avatarColor }}>{u.name[0]}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.ageGroup}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.location?.city || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: `${ROLE_COLOR[u.role]}20`, color: ROLE_COLOR[u.role] }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <select value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
