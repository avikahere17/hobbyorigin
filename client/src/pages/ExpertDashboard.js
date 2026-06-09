import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  MY_EXPERT_PROFILE_QUERY, EXPERT_BOOKINGS_QUERY,
  REGISTER_AS_EXPERT_MUTATION, UPDATE_EXPERT_PROFILE_MUTATION,
  CONFIRM_BOOKING_MUTATION, CANCEL_BOOKING_MUTATION, COMPLETE_BOOKING_MUTATION,
  MATCHED_GROUPS_QUERY, APPLY_EXPERT_TO_GROUP_MUTATION,
} from '../graphql';

const COMMON_SKILLS = ['Guitar','Piano','Painting','Chess','Yoga','Cooking','Photography','Programming','Writing','Dancing','Drawing','Gardening','Running','Singing','Crafts'];
const STATUS_COLOR = { PENDING: '#f59e0b', CONFIRMED: '#6366f1', COMPLETED: '#10b981', CANCELLED: '#6b7280' };

function BookingCard({ booking, expertUserId, onRefetch }) {
  const isExpert = booking.expert?.user?.id === expertUserId;
  const [confirm, { loading: conf }] = useMutation(CONFIRM_BOOKING_MUTATION, { onCompleted: onRefetch });
  const [cancel, { loading: canc }] = useMutation(CANCEL_BOOKING_MUTATION, { onCompleted: onRefetch });
  const [complete, { loading: comp }] = useMutation(COMPLETE_BOOKING_MUTATION, { onCompleted: onRefetch });
  const [meetingUrl, setMeetingUrl] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', marginBottom: 4 }}>
            {booking.skill}
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${STATUS_COLOR[booking.status]}20`, color: STATUS_COLOR[booking.status] }}>{booking.status}</span>
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 4 }}>
            with <Link to={`/profile/${booking.user.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{booking.user.name}</Link>
            {' · '}{new Date(booking.scheduledAt).toLocaleDateString()} {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {booking.durationMins} min · {booking.serviceType}
            {booking.amount > 0 && ` · ${booking.amount} ${booking.currency}`}
          </div>
          {booking.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>"{booking.notes}"</div>}
          {booking.meetingUrl && <div style={{ marginTop: 6 }}><a href={booking.meetingUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🔗 Join Meeting</a></div>}
        </div>
        {isExpert && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {booking.status === 'PENDING' && (
              <>
                {showConfirm ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input className="input" placeholder="Meeting URL (optional)" value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)} style={{ fontSize: 12, minWidth: 200 }} />
                    <button className="btn btn-primary btn-sm" disabled={conf} onClick={() => confirm({ variables: { bookingId: booking.id, meetingUrl: meetingUrl || null } })}>
                      {conf ? '…' : '✓ Confirm'}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowConfirm(true)}>✅ Confirm</button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={canc} onClick={() => cancel({ variables: { bookingId: booking.id } })}>{canc ? '…' : '✗ Decline'}</button>
              </>
            )}
            {booking.status === 'CONFIRMED' && (
              <button className="btn btn-primary btn-sm" disabled={comp} onClick={() => complete({ variables: { bookingId: booking.id } })}>{comp ? '…' : '🏁 Mark Complete'}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_BADGE = {
  APPROVED: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', label: '✅ Approved' },
  PENDING:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: '⏳ Pending' },
  REJECTED: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: '❌ Rejected' },
};

function GroupMatchCard({ group, applyMsg, setApplyMsg, applyDone, applyMut, applying }) {
  const [showMsg, setShowMsg] = useState(false);
  const status = applyDone[group.id] || group.requestStatus;
  const badge = status ? STATUS_BADGE[status] : null;

  return (
    <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
          <Link to={`/group/${group.id}`} style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{group.name}</Link>
          <span className="badge badge-dim" style={{ fontSize: 11 }}>{group.category}</span>
          <span className="badge badge-dim" style={{ fontSize: 11 }}>👥 {group.memberCount}</span>
          <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>
            🎯 {group.matchScore} skill match{group.matchScore !== 1 ? 'es' : ''}
          </span>
          {badge && <span style={{ fontSize: 11, background: badge.bg, color: badge.color, borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{badge.label}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {group.tags.slice(0, 5).map(t => <span key={t} className="badge badge-dim" style={{ fontSize: 11 }}>{t}</span>)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        {!status && !showMsg && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowMsg(true)}>Apply as Expert</button>
        )}
        {!status && showMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
            <textarea className="input" rows={2} style={{ fontSize: 13, padding: '8px 10px' }}
              placeholder="Optional: introduce yourself to the group admin…"
              value={applyMsg[group.id] || ''}
              onChange={e => setApplyMsg(prev => ({ ...prev, [group.id]: e.target.value }))} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowMsg(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" style={{ flex: 2 }} disabled={applying}
                onClick={() => applyMut({ variables: { groupId: group.id, message: applyMsg[group.id] || '' } })}>
                {applying ? 'Sending…' : '📨 Send Request'}
              </button>
            </div>
          </div>
        )}
        {status === 'APPROVED' && <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>Active expert ✓</span>}
        {status === 'PENDING' && <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>Awaiting approval…</span>}
        {status === 'REJECTED' && (
          <button className="btn btn-ghost btn-sm" onClick={() => { applyMut({ variables: { groupId: group.id, message: '' } }); }}>Re-apply</button>
        )}
      </div>
    </div>
  );
}

export default function ExpertDashboard() {
  const { currentUser, updateCurrentUser } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [tab, setTab] = useState('bookings');
  const [applyMsg, setApplyMsg] = useState({});
  const [applyDone, setApplyDone] = useState({});
  const [form, setForm] = useState({ headline: '', bio: '', skills: [], serviceType: 'PAID', hourlyRate: 50, currency: 'GBP', availability: 'Weekends', isElderSupport: false });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: expertData, loading: expertLoading, refetch: refetchExpert } = useQuery(MY_EXPERT_PROFILE_QUERY);
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(EXPERT_BOOKINGS_QUERY, { skip: !expertData?.myExpertProfile });
  const { data: matchData, loading: matchLoading, refetch: refetchMatch } = useQuery(MATCHED_GROUPS_QUERY, { skip: !expertData?.myExpertProfile, fetchPolicy: 'cache-and-network' });
  const [applyMut, { loading: applying }] = useMutation(APPLY_EXPERT_TO_GROUP_MUTATION, {
    onCompleted: (d) => {
      setApplyDone(prev => ({ ...prev, [d.applyExpertToGroup.groupId]: d.applyExpertToGroup.status }));
      refetchMatch();
    },
  });

  const [registerAsExpert, { loading: regLoading }] = useMutation(REGISTER_AS_EXPERT_MUTATION, {
    onCompleted: () => {
      // Update the stored user role so Navbar and other role-checks activate immediately
      updateCurrentUser({ role: 'EXPERT' });
      refetchExpert();
      setRegistering(false);
    }
  });
  const [updateExpert, { loading: updateLoading }] = useMutation(UPDATE_EXPERT_PROFILE_MUTATION, {
    onCompleted: () => refetchExpert()
  });

  if (!currentUser) return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08))', borderBottom: '2px solid var(--border)', padding: '48px 0 36px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎓</div>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 10 }}>Become an Expert Coach</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-base)', maxWidth: 520, margin: '0 auto 24px' }}>
            Share your skills with the community — offer free charity sessions or set your own paid rate. Sign up in 60 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/?join=true&role=expert" className="btn btn-primary btn-lg">Create Account → Register as Expert</a>
            <a href="/?login=true&role=expert" className="btn btn-ghost btn-lg">Sign In → Go to Dashboard</a>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            <span>🆓 Charity sessions</span>
            <span>💰 Set your own rate</span>
            <span>⭐ Build ratings &amp; reviews</span>
            <span>🌸 Elder support specialisation</span>
          </div>
        </div>
      </div>
    </div>
  );

  const expert = expertData?.myExpertProfile;
  const bookings = bookingsData?.expertBookings || [];
  const pending = bookings.filter(b => b.status === 'PENDING');
  const upcoming = bookings.filter(b => b.status === 'CONFIRMED');
  const past = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status));

  const handleRegister = async () => {
    try {
      await registerAsExpert({ variables: { ...form } });
    } catch (e) { alert(e.message); }
  };

  const toggleSkill = (s) => setF('skills', form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s]);

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 4 }}>🎓 Expert Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Share your skills, manage bookings, support the community</p>
        </div>

        {expertLoading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : !expert ? (
          /* Not registered yet */
          <div className="card">
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: 8 }}>Become an Expert</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 20 }}>Register to offer sessions — charity or paid. Help members develop their hobbies.</p>
            <div className="form-group">
              <label className="form-label">Headline *</label>
              <input className="input" value={form.headline} onChange={e => setF('headline', e.target.value)} placeholder="e.g. Guitar Tutor · 15 years experience" />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input" rows={3} value={form.bio} onChange={e => setF('bio', e.target.value)} placeholder="Tell people about your expertise and teaching style…" />
            </div>
            <div className="form-group">
              <label className="form-label">Skills *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {COMMON_SKILLS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSkill(s)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${form.skills.includes(s) ? 'var(--primary)' : 'var(--border)'}`, background: form.skills.includes(s) ? 'var(--primary-light)' : 'transparent', color: form.skills.includes(s) ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>
                    {form.skills.includes(s) ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Service type</label>
                <select className="input" value={form.serviceType} onChange={e => setF('serviceType', e.target.value)}>
                  <option value="CHARITY">Free / Charity</option>
                  <option value="PAID">Paid</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>
              {form.serviceType !== 'CHARITY' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Hourly rate</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input" type="number" min={0} value={form.hourlyRate} onChange={e => setF('hourlyRate', parseInt(e.target.value) || 0)} style={{ flex: 1 }} />
                    <select className="input" value={form.currency} onChange={e => setF('currency', e.target.value)} style={{ width: 90 }}>
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Availability</label>
              <input className="input" value={form.availability} onChange={e => setF('availability', e.target.value)} placeholder="e.g. Weekends, Mon–Fri evenings" />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                <input type="checkbox" checked={form.isElderSupport} onChange={e => setF('isElderSupport', e.target.checked)} style={{ width: 16, height: 16 }} />
                🌸 Specialise in elder support
              </label>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={regLoading || !form.headline || !form.skills.length} onClick={handleRegister}>
              {regLoading ? 'Registering…' : '🎓 Register as Expert'}
            </button>
          </div>
        ) : (
          /* Expert profile */
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: 4 }}>{expert.headline}</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {expert.isVerified && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>✅ Verified</span>}
                    <span className="badge badge-dim">⭐ {expert.ratingAvg?.toFixed(1) ?? '—'} ({expert.ratingCount} reviews)</span>
                    <span className="badge badge-dim">📅 {expert.totalSessions} sessions</span>
                    {expert.isElderSupport && <span className="badge" style={{ background: 'rgba(251,146,60,0.15)', color: '#f97316' }}>🌸 Elder Support</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  <div>{expert.serviceType === 'CHARITY' ? 'Free sessions' : `${expert.hourlyRate} ${expert.currency}/hr`}</div>
                  <div>{expert.availability}</div>
                </div>
              </div>
              {expert.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {expert.skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Pending', value: pending.length, color: '#f59e0b' },
                { label: 'Upcoming', value: upcoming.length, color: '#6366f1' },
                { label: 'Completed', value: past.filter(b => b.status === 'COMPLETED').length, color: '#10b981' },
                { label: 'Groups', value: (matchData?.matchedGroupsForExpert || []).filter(g => g.requestStatus === 'APPROVED').length, color: '#ec4899' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>📋 Bookings {bookings.length > 0 && `(${bookings.length})`}</button>
              <button className={`tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>
                🏘️ My Groups
                {matchData?.matchedGroupsForExpert?.some(g => !g.requestStatus) && (
                  <span style={{ marginLeft: 6, background: 'var(--primary)', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 7px' }}>
                    {matchData.matchedGroupsForExpert.filter(g => !g.requestStatus).length} matched
                  </span>
                )}
              </button>
            </div>

            {/* Bookings tab */}
            {tab === 'bookings' && (
              <div className="card">
                {bookingsLoading ? <div className="loading-center"><div className="spinner" /></div> : (
                  <>
                    {pending.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Awaiting Confirmation</div>{pending.map(b => <BookingCard key={b.id} booking={b} expertUserId={currentUser.id} onRefetch={refetchBookings} />)}</>}
                    {upcoming.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 1 }}>Upcoming Sessions</div>{upcoming.map(b => <BookingCard key={b.id} booking={b} expertUserId={currentUser.id} onRefetch={refetchBookings} />)}</>}
                    {past.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, letterSpacing: 1 }}>Past</div>{past.slice(0, 10).map(b => <BookingCard key={b.id} booking={b} expertUserId={currentUser.id} onRefetch={refetchBookings} />)}</>}
                    {bookings.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>No bookings yet. Share your profile to attract clients!</div>}
                  </>
                )}
              </div>
            )}

            {/* Groups tab */}
            {tab === 'groups' && (
              <div>
                <div className="card" style={{ marginBottom: 16, background: 'rgba(99,102,241,0.05)', border: '1.5px solid rgba(99,102,241,0.2)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>🎯 How group matching works</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Groups below are matched to your skills. Apply to join as the resident expert — the group admin will review and approve. Once approved, you appear in the group's expert panel and members can book you directly.
                  </div>
                </div>

                {matchLoading && <div className="loading-center"><div className="spinner" /></div>}

                {/* Approved groups */}
                {(matchData?.matchedGroupsForExpert || []).filter(g => g.requestStatus === 'APPROVED').length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>✅ Active Expert In</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(matchData?.matchedGroupsForExpert || []).filter(g => g.requestStatus === 'APPROVED').map(g => (
                        <GroupMatchCard key={g.id} group={g} expert={expert} applyMsg={applyMsg} setApplyMsg={setApplyMsg} applyDone={applyDone} applyMut={applyMut} applying={applying} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending */}
                {(matchData?.matchedGroupsForExpert || []).filter(g => g.requestStatus === 'PENDING').length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>⏳ Awaiting Admin Approval</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(matchData?.matchedGroupsForExpert || []).filter(g => g.requestStatus === 'PENDING').map(g => (
                        <GroupMatchCard key={g.id} group={g} expert={expert} applyMsg={applyMsg} setApplyMsg={setApplyMsg} applyDone={applyDone} applyMut={applyMut} applying={applying} />
                      ))}
                    </div>
                  </div>
                )}

                {/* New matches */}
                {(matchData?.matchedGroupsForExpert || []).filter(g => !g.requestStatus).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>🎯 Matched Groups — Apply Now</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(matchData?.matchedGroupsForExpert || []).filter(g => !g.requestStatus).map(g => (
                        <GroupMatchCard key={g.id} group={g} expert={expert} applyMsg={applyMsg} setApplyMsg={setApplyMsg} applyDone={applyDone} applyMut={applyMut} applying={applying} />
                      ))}
                    </div>
                  </div>
                )}

                {!matchLoading && (matchData?.matchedGroupsForExpert || []).length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No matching groups yet</div>
                    <div className="empty-state-desc">Add more skills to your profile to get matched with relevant groups.</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
