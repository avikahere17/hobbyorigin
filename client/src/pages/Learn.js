import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { LEARNING_CONTENT_QUERY } from '../graphql';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Music', 'Art & Design', 'Programming', 'Sports', 'Cooking', 'Photography', 'Writing', 'Science', 'General'];
const TYPE_ICONS = { ARTICLE: '📄', VIDEO: '🎬', AUDIO: '🎵' };
const TYPE_LABELS = { ARTICLE: 'Article', VIDEO: 'Video', AUDIO: 'Audio' };

function ContentCard({ item, onClick }) {
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'all 0.15s' }}
      onClick={() => onClick(item)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
      {item.thumbnailUrl && (
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 12, height: 160, background: 'var(--surface2)' }}>
          <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {!item.thumbnailUrl && item.contentType === 'VIDEO' && (
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 12, height: 120, background: 'linear-gradient(135deg,#6366f120,#8b5cf620)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
          🎬
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11 }}>
          {TYPE_ICONS[item.contentType]} {TYPE_LABELS[item.contentType]}
        </span>
        <span className="badge badge-dim" style={{ fontSize: 11 }}>{item.category}</span>
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 'var(--font-base)', marginBottom: 6, lineHeight: 1.4 }}>{item.title}</h3>
      {item.body && (
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.body.replace(/<[^>]+>/g, '')}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="avatar avatar-xs" style={{ background: item.author?.avatarColor || '#6366f1', width: 22, height: 22, fontSize: 11 }}>{item.author?.name?.[0] || 'A'}</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.author?.name || 'Admin'}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>👁 {item.viewCount}</span>
      </div>
    </div>
  );
}

function ContentModal({ item, onClose }) {
  if (!item) return null;
  const isYT = item.mediaUrl?.match(/youtube\.com|youtu\.be/);
  const ytId = isYT ? item.mediaUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] : null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{TYPE_ICONS[item.contentType]} {TYPE_LABELS[item.contentType]}</span>
              <span className="badge badge-dim">{item.category}</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-xl)', lineHeight: 1.3 }}>{item.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
        </div>

        {/* Media player */}
        {item.contentType === 'VIDEO' && item.mediaUrl && (
          <div style={{ marginBottom: 20, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {ytId ? (
              <iframe width="100%" height="380" src={`https://www.youtube.com/embed/${ytId}`} frameBorder="0" allowFullScreen title={item.title} />
            ) : (
              <video controls style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} src={item.mediaUrl} />
            )}
          </div>
        )}
        {item.contentType === 'AUDIO' && item.mediaUrl && (
          <div style={{ marginBottom: 20, padding: '16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🎵</div>
            <audio controls style={{ width: '100%' }} src={item.mediaUrl} />
          </div>
        )}

        {/* Body */}
        {item.body && (
          <div style={{ fontSize: 'var(--font-base)', lineHeight: 1.75, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{item.body}</div>
        )}

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20 }}>
            {item.tags.map(t => <span key={t} className="badge badge-dim">#{t}</span>)}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="avatar avatar-sm" style={{ background: item.author?.avatarColor }}>{item.author?.name?.[0]}</div>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{item.author?.name}</span>
          </div>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)' }}>👁 {item.viewCount} views</span>
        </div>
      </div>
    </div>
  );
}

export default function Learn() {
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading } = useQuery(LEARNING_CONTENT_QUERY, {
    variables: { category: category || null, contentType: type || null, search: search || null },
  });

  const items = data?.learningContent || [];

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: 1000 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 6 }}>📚 Learning Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Videos, articles, and audio lessons curated by HobbyOrigin</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          <input className="input" placeholder="🔍 Search content…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 220 }} />
          <select className="input" value={type} onChange={e => setType(e.target.value)} style={{ minWidth: 130 }}>
            <option value="">All types</option>
            <option value="VIDEO">🎬 Video</option>
            <option value="ARTICLE">📄 Article</option>
            <option value="AUDIO">🎵 Audio</option>
          </select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c === 'All' ? '' : c)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${(category || 'All') === c ? 'var(--primary)' : 'var(--border)'}`, background: (category || 'All') === c ? 'var(--primary-light)' : 'transparent', color: (category || 'All') === c ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">No content yet</div>
            <div className="empty-state-desc">Admins can add learning materials from the Admin Dashboard.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {items.map(item => <ContentCard key={item.id} item={item} onClick={setSelected} />)}
          </div>
        )}
      </div>

      {selected && <ContentModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
