import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import {
  CREATE_WEBINAR_MUTATION, JOIN_WEBINAR_MUTATION, LEAVE_WEBINAR_MUTATION,
  START_WEBINAR_MUTATION, END_WEBINAR_MUTATION, REWARD_HOST_MUTATION,
  GROUP_QUERY,
} from '../graphql';

const STATUS_COLOR = { SCHEDULED: '#6366f1', LIVE: '#10b981', ENDED: '#6b7280', CANCELLED: '#ef4444' };
const STATUS_LABEL = { SCHEDULED: '🗓 Scheduled', LIVE: '🔴 Live Now', ENDED: '✅ Ended', CANCELLED: '✕ Cancelled' };

function RewardModal({ webinarId, hostName, onClose, refetchQuery }) {
  const { format } = useCurrency();
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState('');
  const [reward, { loading }] = useMutation(REWARD_HOST_MUTATION, {
    refetchQueries: refetchQuery ? [refetchQuery] : [],
    onCompleted: onClose,
    onError: e => alert(e.message),
  });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ maxWidth: 360, width: '100%' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 4 }}>⭐ Reward Host</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 16 }}>Send coins to {hostName} for hosting a great session</p>
        <div className="form-group">
          <label className="form-label">Coins to send</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 5, 10, 25, 50, 100].map(v => (
              <button key={v} type="button" onClick={() => setAmount(v)}
                style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: `2px solid ${amount === v ? 'var(--primary)' : 'var(--border)'}`, background: amount === v ? 'var(--primary-light)' : 'transparent', color: amount === v ? 'var(--primary)' : 'var(--text)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⭐ {v}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <input className="input" placeholder="Fantastic session!" value={message} onChange={e => setMessage(e.target.value)} maxLength={80} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={loading}
            onClick={() => reward({ variables: { webinarId, amount, message: message || null } })}>
            {loading ? '…' : `⭐ Send ${amount} coins`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateWebinarModal({ groupId, onClose, refetchQuery }) {
  const [form, setForm] = useState({ title: '', description: '', meetingUrl: '', startsAt: '', durationMins: 60, maxAttendees: 100 });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [create, { loading }] = useMutation(CREATE_WEBINAR_MUTATION, {
    refetchQueries: refetchQuery ? [refetchQuery] : [],
    onCompleted: onClose,
    onError: e => alert(e.message),
  });
  const handleSubmit = () => {
    if (!form.title.trim() || !form.startsAt) { alert('Title and start time are required'); return; }
    create({ variables: { groupId, ...form, durationMins: parseInt(form.durationMins), maxAttendees: parseInt(form.maxAttendees) } });
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 4 }}>🎙️ Host a Webinar</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 16 }}>Create a live session for group members to join and learn</p>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="input" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. Beginner Guitar Chords Workshop" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="What will you cover in this session?" />
        </div>
        <div className="form-group">
          <label className="form-label">Meeting URL (optional — add now or when you start)</label>
          <input className="input" value={form.meetingUrl} onChange={e => setF('meetingUrl', e.target.value)} placeholder="https://meet.google.com/... or Zoom link" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Start time *</label>
            <input className="input" type="datetime-local" value={form.startsAt} onChange={e => setF('startsAt', e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Duration (min)</label>
            <input className="input" type="number" min={15} max={480} value={form.durationMins} onChange={e => setF('durationMins', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Max attendees</label>
          <input className="input" type="number" min={2} max={1000} value={form.maxAttendees} onChange={e => setF('maxAttendees', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={loading}>{loading ? 'Creating…' : '🎙️ Create Webinar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function WebinarsTab({ webinars = [], groupId, isMember, refetchQuery }) {
  const { currentUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [rewardWebinar, setRewardWebinar] = useState(null);

  const [joinWebinar] = useMutation(JOIN_WEBINAR_MUTATION, { refetchQueries: refetchQuery ? [refetchQuery] : [] });
  const [leaveWebinar] = useMutation(LEAVE_WEBINAR_MUTATION, { refetchQueries: refetchQuery ? [refetchQuery] : [] });
  const [startWebinar] = useMutation(START_WEBINAR_MUTATION, { refetchQueries: refetchQuery ? [refetchQuery] : [] });
  const [endWebinar] = useMutation(END_WEBINAR_MUTATION, { refetchQueries: refetchQuery ? [refetchQuery] : [] });

  const now = new Date();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>🎙️ Webinars & Live Sessions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginTop: 2 }}>Any member can host. Others can join and reward great sessions.</p>
        </div>
        {isMember && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Host Webinar</button>
        )}
      </div>

      {webinars.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🎙️</div>
          <div className="empty-state-title">No webinars yet</div>
          <div className="empty-state-desc">{isMember ? 'Be the first to host a live session for this group!' : 'Join the group to host or attend webinars.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {webinars.map(w => {
            const isHost = currentUser?.id === w.host?.id;
            const isLive = w.status === 'LIVE';
            const isScheduled = w.status === 'SCHEDULED';
            const isEnded = w.status === 'ENDED';
            const startDate = new Date(w.startsAt);

            return (
              <div key={w.id} className="card" style={{ border: isLive ? '2px solid var(--success)' : undefined }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h4 style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{w.title}</h4>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${STATUS_COLOR[w.status]}20`, color: STATUS_COLOR[w.status] }}>{STATUS_LABEL[w.status]}</span>
                    </div>
                    {w.description && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 4 }}>{w.description}</p>}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>🗓 {startDate.toLocaleDateString()} {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>⏱ {w.durationMins} min</span>
                      <span>👥 {w.attendeeCount} / {w.maxAttendees} attendees</span>
                      {w.rewardTotal > 0 && <span>⭐ {w.rewardTotal} coins rewarded</span>}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-xs" style={{ background: w.host?.avatarColor, width: 20, height: 20, fontSize: 10 }}>{w.host?.name?.[0]}</div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hosted by <strong>{w.host?.name}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start', flexShrink: 0 }}>
                    {/* Join meeting link */}
                    {(isLive || isScheduled) && w.meetingUrl && (
                      <a href={w.meetingUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                        {isLive ? '🔴 Join Live' : '🔗 Meeting Link'}
                      </a>
                    )}

                    {/* Host controls */}
                    {isHost && isScheduled && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => {
                          const url = prompt('Meeting URL (or press OK to use existing):') || w.meetingUrl || '';
                          startWebinar({ variables: { webinarId: w.id, meetingUrl: url || null } });
                        }}>
                        ▶ Start Webinar
                      </button>
                    )}
                    {isHost && isLive && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                        onClick={() => { if (window.confirm('End this webinar?')) endWebinar({ variables: { webinarId: w.id } }); }}>
                        ⏹ End Webinar
                      </button>
                    )}

                    {/* Attendee controls */}
                    {!isHost && isMember && isScheduled && (
                      w.isAttending ? (
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => leaveWebinar({ variables: { webinarId: w.id } })}>
                          ✕ Leave
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => joinWebinar({ variables: { webinarId: w.id } })}>
                          + Join
                        </button>
                      )
                    )}

                    {/* Reward host */}
                    {!isHost && isMember && (isLive || isEnded) && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)' }}
                        onClick={() => setRewardWebinar(w)}>
                        ⭐ Reward Host
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateWebinarModal groupId={groupId} onClose={() => setShowCreate(false)} refetchQuery={refetchQuery} />}
      {rewardWebinar && <RewardModal webinarId={rewardWebinar.id} hostName={rewardWebinar.host?.name} onClose={() => setRewardWebinar(null)} refetchQuery={refetchQuery} />}
    </div>
  );
}
