import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import ChatRoom from '../components/ChatRoom';
import WebinarsTab from '../components/WebinarsTab';
import {
  GROUP_QUERY, JOIN_GROUP_MUTATION, LEAVE_GROUP_MUTATION, GROUP_MEMBER_SUBSCRIPTION,
  SEND_TIP_MUTATION, REGISTER_FOR_EVENT_MUTATION, UNREGISTER_FROM_EVENT_MUTATION,
  CREATE_EVENT_MUTATION, CREATE_PRODUCT_MUTATION, CREATE_CAMPAIGN_MUTATION,
  DELETE_GROUP_MUTATION, MAKE_GROUP_PRIVATE_MUTATION, ASSIGN_GROUP_ADMIN_MUTATION,
  BUY_WITH_COINS_MUTATION, BUY_WITH_CARD_MUTATION, CREATE_PAYMENT_INTENT_MUTATION,
  MY_WALLET_FULL_QUERY, PENDING_EXPERT_REQUESTS_QUERY, REVIEW_EXPERT_REQUEST_MUTATION,
  SEARCH_PLATFORM_USERS_QUERY, FIND_EXPERTS_FOR_GROUP_QUERY, GROUP_INVITATIONS_QUERY,
  INVITE_USER_MUTATION, INVITE_EXPERT_MUTATION,
} from '../graphql';
import { formatCurrency, formatTicketPrice } from '../utils/currency';

const GOAL_LABELS = { AWARENESS: '📢 Awareness', SIGNUPS: '✋ Sign-ups', DONATIONS: '💝 Donations' };
const PRODUCT_EMOJIS = ['📦','🎨','📚','🧵','🌱','🎸','🍳','🏺','✂️','🧩','🖼️','📝','🎁','🔧','🌟'];

function TipModal({ toUser, groupId, onClose, onSent }) {
  const [amount, setAmount] = useState(5);
  const [message, setMessage] = useState('');
  const [sendTip, { loading }] = useMutation(SEND_TIP_MUTATION);
  const handle = async () => {
    try {
      await sendTip({ variables: { toUserId: toUser.id, groupId, amount, message } });
      onSent();
      onClose();
    } catch (e) { alert(e.message); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div className="card" style={{ maxWidth: 360, width: '100%' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: 4 }}>⭐ Send a Tip</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: 16 }}>Reward {toUser.name} for their contribution</p>
        <div className="form-group">
          <label className="form-label">Coins to send</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 5, 10, 25, 50].map(v => (
              <button key={v} type="button" onClick={() => setAmount(v)}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${amount === v ? 'var(--primary)' : 'var(--border)'}`, background: amount === v ? 'var(--primary-light)' : 'transparent', color: amount === v ? 'var(--primary)' : 'var(--text)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⭐ {v}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Message (optional)</label>
          <input className="input" placeholder="Great session!" value={message} onChange={e => setMessage(e.target.value)} maxLength={80} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={loading}>{loading ? 'Sending…' : `Send ⭐ ${amount} coins`}</button>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ groupId, onClose, refetch }) {
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', startsAt: '', durationMins: 60, capacity: 50, ticketPrice: 0 });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [createEvent, { loading }] = useMutation(CREATE_EVENT_MUTATION, { onCompleted: () => { refetch(); onClose(); } });
  const handle = async () => {
    if (!form.title || !form.startsAt) { alert('Title and start time are required'); return; }
    try { await createEvent({ variables: { groupId, ...form, durationMins: parseInt(form.durationMins), capacity: parseInt(form.capacity), ticketPrice: parseInt(form.ticketPrice) } }); }
    catch (e) { alert(e.message); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16, overflowY: 'auto' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: 16 }}>🎪 Create Virtual Event</h3>
        <div className="form-group"><label className="form-label">Event title *</label><input className="input" placeholder="e.g. Summer Art Showcase" value={form.title} onChange={e => setF('title', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="input" rows={2} placeholder="What's this event about?" value={form.description} onChange={e => setF('description', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Video / meeting link</label><input className="input" placeholder="https://meet.google.com/..." value={form.videoUrl} onChange={e => setF('videoUrl', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Start date & time *</label><input className="input" type="datetime-local" value={form.startsAt} onChange={e => setF('startsAt', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="form-group"><label className="form-label">Duration (mins)</label><input className="input" type="number" min={15} max={480} value={form.durationMins} onChange={e => setF('durationMins', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Capacity</label><input className="input" type="number" min={1} max={500} value={form.capacity} onChange={e => setF('capacity', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Ticket price (0 = free)</label><input className="input" type="number" min={0} value={form.ticketPrice} onChange={e => setF('ticketPrice', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={loading}>{loading ? 'Creating…' : 'Create Event'}</button>
        </div>
      </div>
    </div>
  );
}

function CreateProductModal({ groupId, onClose, refetch }) {
  const [form, setForm] = useState({ name: '', description: '', price: 0, productType: 'PHYSICAL', imageEmoji: '📦', stock: -1 });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [createProduct, { loading }] = useMutation(CREATE_PRODUCT_MUTATION, { onCompleted: () => { refetch(); onClose(); } });
  const handle = async () => {
    if (!form.name) { alert('Product name is required'); return; }
    try { await createProduct({ variables: { groupId, ...form, price: parseInt(form.price), stock: parseInt(form.stock) } }); }
    catch (e) { alert(e.message); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: 16 }}>🛍️ Add to Shop</h3>
        <div className="form-group">
          <label className="form-label">Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRODUCT_EMOJIS.map(e => <button key={e} type="button" onClick={() => setF('imageEmoji', e)} style={{ fontSize: 22, padding: '4px 8px', borderRadius: 8, border: `2px solid ${form.imageEmoji === e ? 'var(--primary)' : 'var(--border)'}`, background: form.imageEmoji === e ? 'var(--primary-light)' : 'transparent', cursor: 'pointer' }}>{e}</button>)}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Product name *</label><input className="input" placeholder="e.g. Beginner Pottery Kit" value={form.name} onChange={e => setF('name', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="input" rows={2} placeholder="What's included?" value={form.description} onChange={e => setF('description', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="form-group"><label className="form-label">Price (in your currency, 0 = free)</label><input className="input" type="number" min={0} value={form.price} onChange={e => setF('price', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Stock (-1=∞)</label><input className="input" type="number" min={-1} value={form.stock} onChange={e => setF('stock', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="input" value={form.productType} onChange={e => setF('productType', e.target.value)}>
              <option value="PHYSICAL">Physical</option>
              <option value="DIGITAL">Digital</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={loading}>{loading ? 'Adding…' : 'Add Product'}</button>
        </div>
      </div>
    </div>
  );
}

function CreateCampaignModal({ groupId, onClose, refetch }) {
  const [form, setForm] = useState({ title: '', goal: 'AWARENESS', description: '', targetAgeGroups: [], targetCity: '', startDate: '', endDate: '' });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAG = ag => setF('targetAgeGroups', form.targetAgeGroups.includes(ag) ? form.targetAgeGroups.filter(x => x !== ag) : [...form.targetAgeGroups, ag]);
  const [createCampaign, { loading }] = useMutation(CREATE_CAMPAIGN_MUTATION, { onCompleted: () => { refetch(); onClose(); } });
  const handle = async () => {
    if (!form.title || !form.startDate || !form.endDate) { alert('Title and dates are required'); return; }
    try { await createCampaign({ variables: { groupId, ...form } }); }
    catch (e) { alert(e.message); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: 16 }}>📢 Create Campaign</h3>
        <div className="form-group"><label className="form-label">Campaign title *</label><input className="input" placeholder="e.g. Spring Art Festival" value={form.title} onChange={e => setF('title', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Goal</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['AWARENESS','SIGNUPS','DONATIONS'].map(g => <button key={g} type="button" onClick={() => setF('goal', g)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: `2px solid ${form.goal === g ? 'var(--primary)' : 'var(--border)'}`, background: form.goal === g ? 'var(--primary-light)' : 'transparent', color: form.goal === g ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)', fontFamily: 'inherit' }}>{GOAL_LABELS[g]}</button>)}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="input" rows={2} placeholder="What is this campaign about?" value={form.description} onChange={e => setF('description', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Target audience</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['KIDS','TEENS','ADULTS','SENIORS'].map(ag => <button key={ag} type="button" onClick={() => toggleAG(ag)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: `2px solid ${form.targetAgeGroups.includes(ag) ? 'var(--primary)' : 'var(--border)'}`, background: form.targetAgeGroups.includes(ag) ? 'var(--primary-light)' : 'transparent', color: form.targetAgeGroups.includes(ag) ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)', fontFamily: 'inherit' }}>{ag}</button>)}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Target city</label><input className="input" placeholder="London (leave blank for all)" value={form.targetCity} onChange={e => setF('targetCity', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="form-group"><label className="form-label">Start date *</label><input className="input" type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">End date *</label><input className="input" type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={handle} disabled={loading}>{loading ? 'Launching…' : 'Launch Campaign'}</button>
        </div>
      </div>
    </div>
  );
}

export default function GroupDetail({ onAuthRequired }) {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('chat');
  const [tipTarget, setTipTarget] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [meetWidget, setMeetWidget] = useState(null); // { url, title }
  const navigate = useNavigate();

  const { data, loading, error, updateQuery, refetch } = useQuery(GROUP_QUERY, { variables: { id }, fetchPolicy: 'cache-and-network' });

  const [joinGroup, { loading: joining }] = useMutation(JOIN_GROUP_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });
  const [leaveGroup, { loading: leaving }] = useMutation(LEAVE_GROUP_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });
  const [deleteGroupMut] = useMutation(DELETE_GROUP_MUTATION);
  const [makeGroupPrivateMut] = useMutation(MAKE_GROUP_PRIVATE_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });
  const [assignGroupAdminMut] = useMutation(ASSIGN_GROUP_ADMIN_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });
  const { data: expertReqData, refetch: refetchExpertReqs } = useQuery(PENDING_EXPERT_REQUESTS_QUERY, {
    variables: { groupId: id }, skip: !currentUser,
    fetchPolicy: 'cache-and-network',
  });
  const [reviewExpertReq] = useMutation(REVIEW_EXPERT_REQUEST_MUTATION, {
    onCompleted: () => refetchExpertReqs(),
  });
  const [registerForEvent] = useMutation(REGISTER_FOR_EVENT_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });
  const [unregisterFromEvent] = useMutation(UNREGISTER_FROM_EVENT_MUTATION, { refetchQueries: [{ query: GROUP_QUERY, variables: { id } }] });

  useSubscription(GROUP_MEMBER_SUBSCRIPTION, {
    variables: { groupId: id },
    onData: ({ data: subData }) => {
      const updated = subData.data?.groupMemberChanged;
      if (updated) updateQuery(prev => ({ group: { ...prev.group, memberCount: updated.memberCount, isOpen: updated.isOpen, members: updated.members } }));
    },
  });

  if (loading && !data) return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;
  if (error || !data?.group) return (
    <div className="page container" style={{ paddingTop: 100 }}>
      <div className="empty-state"><div className="empty-state-icon">😕</div><div className="empty-state-title">Group not found</div>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to groups</Link></div>
    </div>
  );

  const group = data.group;
  const pct = (group.memberCount / group.maxMembers) * 100;
  const isCreator = group.creator.id === currentUser?.id;
  const isGroupAdmin = group.isGroupAdmin || isCreator || currentUser?.role === 'ADMIN';

  const handleJoin = async () => {
    if (!currentUser) { onAuthRequired(); return; }
    try { await joinGroup({ variables: { groupId: id } }); } catch (e) { alert(e.message); }
  };
  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try { await leaveGroup({ variables: { groupId: id } }); } catch (e) { alert(e.message); }
  };
  const handleDeleteGroup = async () => {
    if (!window.confirm(`Permanently delete "${group.name}"? This cannot be undone.`)) return;
    try { await deleteGroupMut({ variables: { groupId: id } }); navigate('/'); } catch (e) { alert(e.message); }
  };
  const handleTogglePrivate = async () => {
    try { await makeGroupPrivateMut({ variables: { groupId: id, isPrivate: !group.isPrivate } }); } catch (e) { alert(e.message); }
  };
  const handleAssignAdmin = async (userId) => {
    try { await assignGroupAdminMut({ variables: { groupId: id, userId } }); alert('Admin assigned!'); } catch (e) { alert(e.message); }
  };
  const openMeetWidget = (url, title) => setMeetWidget({ url, title });

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 0', flexShrink: 0 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Groups</Link>
                <span style={{ color: 'var(--text-dim)' }}>/</span>
                <span className="badge badge-primary">{group.category}</span>
                <span className={`badge ${group.isOpen ? 'badge-success' : 'badge-full'}`}>{group.isOpen ? '● Open' : '● Full'}</span>
                {group.isPrivate && <span className="badge badge-dim">🔒 Private</span>}
                {group.schedule?.day && <span className="badge badge-dim">📅 {group.schedule.day}s at {group.schedule.time}</span>}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{group.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 10 }}>{group.description}</p>
              {group.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.tags.map(t => <span key={t} className="badge badge-dim" style={{ fontSize: 11 }}>#{t}</span>)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              {isGroupAdmin && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAdminPanel(true)} style={{ border: '1.5px solid var(--primary)', color: 'var(--primary)' }}>⚙️ Admin</button>
              )}
              {group.isMember ? (
                !isGroupAdmin && <button className="btn btn-ghost btn-sm" onClick={handleLeave} disabled={leaving}>{leaving ? '…' : 'Leave group'}</button>
              ) : (
                <button className="btn btn-primary" onClick={handleJoin} disabled={joining || !group.isOpen}>
                  {joining ? 'Joining…' : group.isOpen ? 'Join Group' : 'Group Full'}
                </button>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                {group.memberCount}/{group.maxMembers} members
                <div style={{ height: 3, width: 80, background: 'var(--surface3)', borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--danger)' : 'var(--primary)', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', padding: '0 16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div className="tabs" style={{ marginBottom: 0, marginTop: 16, overflowX: 'auto', flexShrink: 0 }}>
            <button className={`tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>💬 Chat</button>
            <button className={`tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>🎪 Events {group.events?.length > 0 && `(${group.events.length})`}</button>
            <button className={`tab ${tab === 'shop' ? 'active' : ''}`} onClick={() => setTab('shop')}>🛍️ Shop {group.products?.length > 0 && `(${group.products.length})`}</button>
            <button className={`tab ${tab === 'webinars' ? 'active' : ''}`} onClick={() => setTab('webinars')}>🎙️ Webinars {group.webinars?.filter(w=>w.status==='LIVE').length > 0 && '🔴'}</button>
            <button className={`tab ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>📢 Campaigns</button>
            <button className={`tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>👥 Members ({group.memberCount})</button>
            <button className={`tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>ℹ About</button>
            {isGroupAdmin && <button className={`tab ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}>⚙️ Admin</button>}
          </div>

          <div style={{ flex: 1, overflow: 'hidden', background: 'var(--surface)', borderRadius: '0 0 var(--radius) var(--radius)', border: '1px solid var(--border)', borderTop: 'none' }}>

            {tab === 'chat' && <ChatRoom group={group} />}

            {tab === 'events' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                {isGroupAdmin && (
                  <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowCreateEvent(true)}>+ Create Event</button>
                )}
                {!group.events?.length ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon">🎪</div>
                    <div className="empty-state-title">No events yet</div>
                    <div className="empty-state-desc">{isCreator ? 'Create a virtual event for your group members.' : 'The group creator can schedule virtual events here.'}</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {group.events.map(ev => <EventCard key={ev.id} event={ev} currentUser={currentUser} currency={currentUser?.currency||'GBP'} onRegister={() => registerForEvent({ variables: { eventId: ev.id } })} onUnregister={() => unregisterFromEvent({ variables: { eventId: ev.id } })} onJoinMeet={ev.videoUrl ? () => openMeetWidget(ev.videoUrl, ev.title) : null} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'shop' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                {isGroupAdmin && (
                  <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowCreateProduct(true)}>+ Add Product</button>
                )}
                {!group.products?.length ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon">🛍️</div>
                    <div className="empty-state-title">Shop is empty</div>
                    <div className="empty-state-desc">{isCreator ? 'Add products, kits, or digital resources for members to purchase.' : 'No products listed yet.'}</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                    {group.products.map(p => <ProductCard key={p.id} product={p} currency={currentUser?.currency||'GBP'} currentUser={currentUser} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'webinars' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                <WebinarsTab
                  webinars={group.webinars || []}
                  groupId={id}
                  isMember={group.isMember}
                  refetchQuery={{ query: GROUP_QUERY, variables: { id } }}
                />
              </div>
            )}

            {tab === 'campaigns' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                {isGroupAdmin && (
                  <button className="btn btn-primary btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowCreateCampaign(true)}>+ Launch Campaign</button>
                )}
                {!group.campaigns?.length ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <div className="empty-state-icon">📢</div>
                    <div className="empty-state-title">No campaigns yet</div>
                    <div className="empty-state-desc">{isCreator ? 'Create a campaign to grow your group&apos;s reach.' : 'No active campaigns.'}</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {group.campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
                  </div>
                )}
              </div>
            )}

            {tab === 'members' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {group.members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                      <Link to={`/profile/${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        <div className="avatar avatar-md" style={{ background: m.avatarColor, flexShrink: 0 }}>{m.name[0].toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {m.name}
                            {m.id === group.creator.id && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 4 }}>Creator</span>}
                            {m.id === currentUser?.id && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-muted)' }}>You</span>}
                          </div>
                          {m.interests?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {m.interests.slice(0, 4).map(i => <span key={i} className="badge badge-dim" style={{ fontSize: 10 }}>{i}</span>)}
                            </div>
                          )}
                        </div>
                      </Link>
                      {currentUser && m.id !== currentUser.id && group.isMember && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setTipTarget(m)} style={{ flexShrink: 0 }}>⭐ Tip</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'about' && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Created by</div>
                    <Link to={`/profile/${group.creator.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-md" style={{ background: group.creator.avatarColor }}>{group.creator.name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{group.creator.name}</div>
                        {group.creator.tipsEarned > 0 && <div style={{ fontSize: 12, color: 'var(--warning)' }}>⭐ {group.creator.tipsEarned} coins earned</div>}
                      </div>
                    </Link>
                  </div>
                  {group.schedule?.day && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Schedule</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-dim">📅 {group.schedule.day}s</span>
                        <span className="badge badge-dim">🕐 {group.schedule.time}</span>
                        {group.schedule.frequency && <span className="badge badge-dim">🔄 {group.schedule.frequency}</span>}
                        {group.schedule.duration && <span className="badge badge-dim">⏱ {group.schedule.duration} min</span>}
                      </div>
                      {group.schedule.nextSession && (
                        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--success)' }}>
                          Next: {new Date(group.schedule.nextSession).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Location</div>
                    <div style={{ fontSize: 13 }}>{[group.location?.building, group.location?.city, group.location?.country].filter(Boolean).join(', ') || 'Online / Any location'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Capacity</div>
                    <div>{group.memberCount} of {group.maxMembers} spots filled</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Age groups</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {group.ageGroups.map(ag => <span key={ag} className={`badge ag-${ag}`}>{ag}</span>)}
                    </div>
                  </div>
                  {currentUser && group.isMember && group.creator.id !== currentUser.id && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Appreciate the creator</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setTipTarget(group.creator)}>⭐ Send Tip to {group.creator.name}</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'admin' && isGroupAdmin && (
              <div style={{ padding: 20, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>⚙️ Group Admin Panel</div>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Visibility</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', flex: 1 }}>{group.isPrivate ? 'Group is private — only members can see it in listings.' : 'Group is public — anyone can find and join.'}</span>
                    <button className="btn btn-sm" style={{ background: group.isPrivate ? 'var(--success)' : 'var(--primary)', color: '#fff' }} onClick={handleTogglePrivate}>
                      {group.isPrivate ? '🔓 Make Public' : '🔒 Make Private'}
                    </button>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>👑 Assign Admin</div>
                  {group.members?.filter(m => m.id !== currentUser?.id).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{m.name[0]}</div>
                        <span style={{ fontWeight: 600 }}>{m.name}</span>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleAssignAdmin(m.id)}>Make Admin</button>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ border: '1.5px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>⚠️ Danger Zone</div>
                  <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleDeleteGroup}>🗑️ Delete Group</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {tipTarget && <TipModal toUser={tipTarget} groupId={id} onClose={() => setTipTarget(null)} onSent={() => refetch()} />}
      {showCreateEvent && <CreateEventModal groupId={id} onClose={() => setShowCreateEvent(false)} refetch={refetch} />}
      {showCreateProduct && <CreateProductModal groupId={id} onClose={() => setShowCreateProduct(false)} refetch={refetch} />}
      {showCreateCampaign && <CreateCampaignModal groupId={id} onClose={() => setShowCreateCampaign(false)} refetch={refetch} />}

      {/* Google Meet Widget */}
      {meetWidget && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '65vh', background: 'var(--bg)', borderTop: '2px solid var(--primary)', zIndex: 300, display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 32px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎥</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{meetWidget.title}</span>
              <span className="badge badge-success" style={{ fontSize: 11 }}>● LIVE</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={meetWidget.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open in new tab ↗</a>
              <button className="btn btn-ghost btn-sm" onClick={() => setMeetWidget(null)}>✕ Close</button>
            </div>
          </div>
          <iframe
            src={meetWidget.url}
            title={meetWidget.title}
            style={{ flex: 1, border: 'none', width: '100%' }}
            allow="camera;microphone;fullscreen;display-capture"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          group={group} groupId={id} currentUser={currentUser}
          isCreator={isCreator}
          expertReqData={expertReqData} refetchExpertReqs={refetchExpertReqs}
          reviewExpertReq={reviewExpertReq}
          handleTogglePrivate={handleTogglePrivate}
          handleAssignAdmin={handleAssignAdmin}
          handleDeleteGroup={handleDeleteGroup}
          handleLeave={handleLeave}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
function AdminPanel({ group, groupId, currentUser, isCreator, expertReqData, refetchExpertReqs, reviewExpertReq, handleTogglePrivate, handleAssignAdmin, handleDeleteGroup, handleLeave, onClose }) {
  const [adminTab, setAdminTab] = useState('settings');
  const [userSearch, setUserSearch] = useState('');
  const [expertSearch, setExpertSearch] = useState('');
  const [invitedUsers, setInvitedUsers] = useState({});
  const [invitedExperts, setInvitedExperts] = useState({});
  const [scheduleForm, setScheduleForm] = useState({ title: '', description: '', videoUrl: '', startsAt: '', durationMins: 60, capacity: 50, ticketPrice: 0 });
  const [scheduleDone, setScheduleDone] = useState(false);

  const { data: userSearchData } = useQuery(SEARCH_PLATFORM_USERS_QUERY, {
    variables: { search: userSearch, groupId }, skip: userSearch.length < 2,
    fetchPolicy: 'network-only',
  });
  const { data: expertSearchData, loading: expertsLoading } = useQuery(FIND_EXPERTS_FOR_GROUP_QUERY, {
    variables: { groupId, search: expertSearch }, skip: adminTab !== 'coaches',
    fetchPolicy: 'cache-and-network',
  });
  const [inviteUser, { loading: inviting }] = useMutation(INVITE_USER_MUTATION, {
    onCompleted: (_, { variables }) => setInvitedUsers(p => ({ ...p, [variables.userId]: true })),
  });
  const [inviteExpert, { loading: invitingExpert }] = useMutation(INVITE_EXPERT_MUTATION, {
    onCompleted: (_, { variables }) => setInvitedExperts(p => ({ ...p, [variables.expertId]: true })),
  });
  const [createEventMut, { loading: scheduling }] = useMutation(
    require('../graphql').CREATE_EVENT_MUTATION,
    { onCompleted: () => setScheduleDone(true), refetchQueries: ['GroupEvents'] }
  );

  const expertReqs = expertReqData?.pendingExpertRequestsForGroup || [];
  const pendingBadge = expertReqs.length;

  const TABS = [
    { key: 'settings', label: '⚙️ Settings' },
    { key: 'invite',   label: '📨 Invite Users' },
    { key: 'coaches',  label: `🎓 Match Coaches${pendingBadge ? ` (${pendingBadge})` : ''}` },
    { key: 'schedule', label: '📅 Schedule Session' },
    { key: 'danger',   label: '⚠️ Danger' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: 16 }}>
      <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0 }}>⚙️ Admin Panel — {group.name}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '2px solid var(--border)', paddingBottom: 8, marginBottom: 16, flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setAdminTab(t.key)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
                background: adminTab === t.key ? 'var(--primary)' : 'var(--surface2)',
                color: adminTab === t.key ? '#fff' : 'var(--text-muted)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ── SETTINGS ── */}
          {adminTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Privacy */}
              <div className="card" style={{ background: 'var(--surface2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{group.isPrivate ? '🔒 Private & Invisible' : '🌐 Public Group'}</div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                      {group.isPrivate ? 'Hidden from all listings. Only members and invited users can access.' : 'Anyone can find, view, and request to join this group.'}
                    </div>
                  </div>
                  <button className="btn btn-sm" style={{ background: group.isPrivate ? '#10b981' : 'var(--primary)', color: '#fff', minWidth: 120, flexShrink: 0 }} onClick={handleTogglePrivate}>
                    {group.isPrivate ? '🔓 Make Public' : '🔒 Make Private'}
                  </button>
                </div>
                {group.isPrivate && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)', color: 'var(--primary)' }}>
                    ℹ️ This group is invisible to non-members. Use the <strong>Invite Users</strong> tab to add new members.
                  </div>
                )}
              </div>

              {/* Assign admin */}
              <div className="card" style={{ background: 'var(--surface2)' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>👑 Transfer Admin Rights</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.members?.filter(m => m.id !== currentUser?.id).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: m.avatarColor }}>{m.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.role}</div>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => { handleAssignAdmin(m.id); onClose(); }}>Make Admin</button>
                    </div>
                  ))}
                  {!group.members?.filter(m => m.id !== currentUser?.id).length && (
                    <div style={{ color: 'var(--text-dim)', fontSize: 'var(--font-sm)' }}>No other members yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── INVITE USERS ── */}
          {adminTab === 'invite' && (
            <div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 12 }}>
                Search any user on HobbyOrigin by name or email and invite them directly.
                {group.isPrivate && <span style={{ color: 'var(--primary)', fontWeight: 600 }}> Since your group is private, invited users are the only ones who can join.</span>}
              </div>
              <input className="input" placeholder="Search by name or email…" value={userSearch}
                onChange={e => setUserSearch(e.target.value)} style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(userSearchData?.searchPlatformUsers || []).map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="avatar avatar-sm" style={{ background: u.avatarColor }}>{u.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{u.city || u.email}</div>
                    </div>
                    {u.isMember ? (
                      <span className="badge badge-success" style={{ fontSize: 11 }}>✓ Member</span>
                    ) : invitedUsers[u.id] ? (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', fontSize: 11 }}>✓ Invited</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" disabled={inviting}
                        onClick={() => inviteUser({ variables: { groupId, userId: u.id } }).then(() => setInvitedUsers(p => ({ ...p, [u.id]: true })))}>
                        📨 Invite
                      </button>
                    )}
                  </div>
                ))}
                {userSearch.length >= 2 && !userSearchData?.searchPlatformUsers?.length && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No users found for "{userSearch}"</div>
                )}
                {userSearch.length < 2 && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 'var(--font-sm)' }}>Type at least 2 characters to search</div>
                )}
              </div>
            </div>
          )}

          {/* ── MATCH COACHES ── */}
          {adminTab === 'coaches' && (
            <div>
              {/* Pending expert requests from experts who applied */}
              {expertReqs.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                    ⏳ Pending Applications ({expertReqs.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expertReqs.map(r => (
                      <div key={r.id} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                          <div className="avatar avatar-sm" style={{ background: r.avatarColor || '#6366f1' }}>{(r.userName || 'E')[0]}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>{r.userName}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.expertHeadline}</div>
                          </div>
                          <span className="badge badge-dim" style={{ fontSize: 11 }}>{r.expertServiceType === 'CHARITY' ? '🆓 Free' : `${r.expertHourlyRate} ${r.expertCurrency}/hr`}</span>
                        </div>
                        {r.expertSkills?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                            {r.expertSkills.map(s => <span key={s} className="badge badge-primary" style={{ fontSize: 11 }}>{s}</span>)}
                          </div>
                        )}
                        {r.message && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>"{r.message}"</div>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-sm" style={{ background: '#10b981', color: '#fff', flex: 1 }}
                            onClick={() => reviewExpertReq({ variables: { expertId: r.expertId, groupId, status: 'APPROVED' } }).then(refetchExpertReqs)}>
                            ✅ Approve
                          </button>
                          <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', flex: 1 }}
                            onClick={() => reviewExpertReq({ variables: { expertId: r.expertId, groupId, status: 'REJECTED' } }).then(refetchExpertReqs)}>
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                </div>
              )}

              {/* Find & invite coaches */}
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 'var(--font-sm)' }}>🔍 Find coaches matched to this group's skills</div>
              <input className="input" placeholder="Filter by name or skill…" value={expertSearch}
                onChange={e => setExpertSearch(e.target.value)} style={{ marginBottom: 12 }} />
              {expertsLoading && <div className="loading-center"><div className="spinner" /></div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(expertSearchData?.findExpertsForGroup || []).map(e => (
                  <div key={e.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div className="avatar avatar-sm" style={{ background: e.avatarColor, flexShrink: 0 }}>{e.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>{e.name}</span>
                        {e.isVerified && <span style={{ fontSize: 11, color: '#10b981' }}>✅ Verified</span>}
                        {e.matchScore > 0 && <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>🎯 {e.matchScore} match</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{e.headline}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {e.skills.slice(0, 4).map(s => <span key={s} className="badge badge-dim" style={{ fontSize: 11 }}>{s}</span>)}
                        <span className="badge badge-dim" style={{ fontSize: 11 }}>{e.serviceType === 'CHARITY' ? '🆓 Free' : `${e.hourlyRate} ${e.currency}/hr`}</span>
                        {e.ratingAvg && <span className="badge badge-dim" style={{ fontSize: 11 }}>⭐ {e.ratingAvg.toFixed(1)}</span>}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {invitedExperts[e.id] || e.alreadyRequested ? (
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', fontSize: 11 }}>✓ Invited</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" disabled={invitingExpert}
                          onClick={() => inviteExpert({ variables: { groupId, expertId: e.id } }).then(() => setInvitedExperts(p => ({ ...p, [e.id]: true })))}>
                          📨 Invite
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!expertsLoading && !expertSearchData?.findExpertsForGroup?.length && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No matched coaches found. Try a different search.</div>
                )}
              </div>
            </div>
          )}

          {/* ── SCHEDULE SESSION ── */}
          {adminTab === 'schedule' && (
            <div>
              {scheduleDone ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Session scheduled!</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 16 }}>Members will see it in the Events tab and can register.</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setScheduleDone(false)}>Schedule another</button>
                    <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Session title *</label>
                    <input className="input" placeholder="e.g. Weekly Coding Session" value={scheduleForm.title}
                      onChange={e => setScheduleForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="input" rows={2} placeholder="What will members do in this session?"
                      value={scheduleForm.description} onChange={e => setScheduleForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Date & Time *</label>
                    <input className="input" type="datetime-local" value={scheduleForm.startsAt}
                      onChange={e => setScheduleForm(f => ({ ...f, startsAt: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Duration (mins)</label>
                      <input className="input" type="number" min={15} step={15} value={scheduleForm.durationMins}
                        onChange={e => setScheduleForm(f => ({ ...f, durationMins: parseInt(e.target.value) || 60 }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Capacity</label>
                      <input className="input" type="number" min={1} value={scheduleForm.capacity}
                        onChange={e => setScheduleForm(f => ({ ...f, capacity: parseInt(e.target.value) || 50 }))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Google Meet / Video link</label>
                    <input className="input" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={scheduleForm.videoUrl}
                      onChange={e => setScheduleForm(f => ({ ...f, videoUrl: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Ticket price (0 = free)</label>
                    <input className="input" type="number" min={0} value={scheduleForm.ticketPrice}
                      onChange={e => setScheduleForm(f => ({ ...f, ticketPrice: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}
                    disabled={!scheduleForm.title || !scheduleForm.startsAt || scheduling}
                    onClick={() => createEventMut({ variables: { groupId, ...scheduleForm } })}>
                    {scheduling ? 'Scheduling…' : '📅 Schedule Session'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── DANGER ZONE ── */}
          {adminTab === 'danger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                ⚠️ Actions here are irreversible. Please be certain before proceeding.
              </div>
              {!isCreator && (
                <div className="card" style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>🚪 Leave Group</div>
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 10 }}>You will lose admin access and your chat history will remain.</div>
                  <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => { onClose(); handleLeave(); }}>Leave Group</button>
                </div>
              )}
              <div className="card" style={{ background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.3)' }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--danger)' }}>🗑️ Delete Group</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 10 }}>Permanently deletes the group, all messages, events and members. Cannot be undone.</div>
                <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={() => { onClose(); handleDeleteGroup(); }}>Delete Group Permanently</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function EventCard({ event, currentUser, currency, onRegister, onUnregister, onJoinMeet }) {
  const isPast = new Date(event.startsAt) < new Date();
  const spotsLeft = event.capacity - event.registrationCount;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 'var(--font-base)', fontWeight: 800 }}>🎪 {event.title}</span>
            <span className="badge" style={{ background: isPast ? 'var(--surface3)' : 'rgba(16,185,129,0.15)', color: isPast ? 'var(--text-muted)' : 'var(--success)' }}>{isPast ? 'Past' : 'Upcoming'}</span>
            {event.ticketPrice > 0 && <span className="badge badge-dim">🎟 {formatCurrency(event.ticketPrice, currency||'GBP')}</span>}
          </div>
          {event.description && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 6 }}>{event.description}</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            <span>📅 {new Date(event.startsAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>⏱ {event.durationMins} min</span>
            <span>👥 {event.registrationCount}/{event.capacity}</span>
          </div>
        </div>
        {currentUser && !isPast && (
          <div style={{ flexShrink: 0 }}>
            {event.isRegistered ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                {event.videoUrl && onJoinMeet && (
                  <button className="btn btn-primary btn-sm" onClick={onJoinMeet}>🎥 Join in App</button>
                )}
                {event.videoUrl && !onJoinMeet && (
                  <a href={event.videoUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">▶ Join Now</a>
                )}
                <button className="btn btn-ghost btn-sm" onClick={onUnregister}>Unregister</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={onRegister} disabled={spotsLeft <= 0}>{spotsLeft <= 0 ? 'Full' : 'Register'}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, currency, currentUser }) {
  const price = formatTicketPrice(product.price, currency || 'GBP', 'Free');
  const [showBuy, setShowBuy] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const [payMethod, setPayMethod] = useState('coins');

  const { data: walletData } = useQuery(MY_WALLET_FULL_QUERY, { skip: !currentUser, fetchPolicy: 'cache-and-network' });
  const [buyWithCoins, { loading: buyingCoins }] = useMutation(BUY_WITH_COINS_MUTATION, {
    onCompleted: (d) => setDone(d.buyProductWithCoins),
    onError: (e) => setErr(e.message),
  });
  const [createIntent] = useMutation(CREATE_PAYMENT_INTENT_MUTATION);
  const [buyWithCard, { loading: buyingCard }] = useMutation(BUY_WITH_CARD_MUTATION, {
    onCompleted: (d) => setDone(d.buyProductWithCard),
    onError: (e) => setErr(e.message),
  });

  const wallet = walletData?.myWallet;
  const coinValue = wallet?.coinValueLocal || 0.01;
  const coinCurrency = wallet?.coinCurrency || currency || 'GBP';
  const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', INR: '₹', AUD: 'A$', CAD: 'C$', SGD: 'S$' };
  const sym = CURRENCY_SYMBOLS[coinCurrency] || coinCurrency;

  // product.price is in smallest unit (pence/cents); convert to coins
  const priceCoins = Math.ceil(product.price / coinValue);
  const totalCoins = priceCoins * qty;
  const totalFiat = `${sym}${((product.price * qty) / 100).toFixed(2)}`;
  const canAfford = (wallet?.coins || 0) >= totalCoins;

  const handleBuy = async () => {
    setErr('');
    if (payMethod === 'coins') {
      await buyWithCoins({ variables: { productId: product.id, quantity: qty, deliveryAddress: deliveryAddress || undefined } });
    } else {
      try {
        const { data: intentData } = await createIntent({ variables: { amount: product.price * qty, currency: coinCurrency, description: `Buy ${product.name}` } });
        const piId = intentData.createPaymentIntent.paymentIntentId;
        await buyWithCard({ variables: { productId: product.id, quantity: qty, paymentIntentId: piId, deliveryAddress: deliveryAddress || undefined } });
      } catch (e) { setErr(e.message); }
    }
  };

  return (
    <>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{product.imageEmoji}</div>
        <div style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>{product.name}</div>
        {product.description && <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{product.description}</div>}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-primary" style={{ fontWeight: 800 }}>{price}</span>
          <span className="badge badge-dim">⭐ {priceCoins} coins</span>
          <span className="badge badge-dim">{product.productType === 'DIGITAL' ? '💾 Digital' : '📦 Physical'}</span>
          {product.stock >= 0 && <span className="badge badge-dim">{product.stock} left</span>}
        </div>
        {currentUser ? (
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={() => setShowBuy(true)}>🛒 Buy Now</button>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }}>🔒 Sign in to buy</button>
        )}
      </div>

      {showBuy && (
        <div className="modal-overlay" onClick={() => !done && setShowBuy(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>{product.imageEmoji} {product.name}</div>
              <button className="btn-close" onClick={() => setShowBuy(false)}>✕</button>
            </div>

            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Order confirmed!</div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                  {done.paymentMethod === 'coins' ? `⭐ ${done.totalCoins} coins deducted` : `💳 ${sym}${(done.totalAmount / 100).toFixed(2)} charged`}
                  {done.paymentMethod === 'card' && <span> + 10% coins back!</span>}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setDone(null); setShowBuy(false); }}>Done</button>
              </div>
            ) : (
              <>
                {/* Qty */}
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', background: 'none', cursor: 'pointer', fontWeight: 800 }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                    <button type="button" onClick={() => setQty(qty + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', background: 'none', cursor: 'pointer', fontWeight: 800 }}>+</button>
                  </div>
                </div>

                {/* Physical: delivery address */}
                {product.productType === 'PHYSICAL' && (
                  <div className="form-group">
                    <label className="form-label">Delivery address</label>
                    <input className="input" placeholder="Your delivery address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                  </div>
                )}

                {/* Pay method */}
                <div className="form-group">
                  <label className="form-label">Payment method</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setPayMethod('coins')}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-sm)', border: `2px solid ${payMethod === 'coins' ? 'var(--primary)' : 'var(--border)'}`, background: payMethod === 'coins' ? 'var(--primary-light)' : 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)', fontFamily: 'inherit', color: payMethod === 'coins' ? 'var(--primary)' : 'var(--text-muted)' }}>
                      ⭐ {totalCoins} coins
                      {!canAfford && <div style={{ fontSize: 11, color: 'var(--danger)' }}>Insufficient</div>}
                    </button>
                    <button type="button" onClick={() => setPayMethod('card')}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-sm)', border: `2px solid ${payMethod === 'card' ? 'var(--primary)' : 'var(--border)'}`, background: payMethod === 'card' ? 'var(--primary-light)' : 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--font-sm)', fontFamily: 'inherit', color: payMethod === 'card' ? 'var(--primary)' : 'var(--text-muted)' }}>
                      💳 {totalFiat}
                      <div style={{ fontSize: 11, color: 'var(--success)' }}>+10% coins back</div>
                    </button>
                  </div>
                </div>

                {wallet && (
                  <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-dim)', marginBottom: 12 }}>Your balance: ⭐ {wallet.coins} coins ({sym}{(wallet.coins * coinValue).toFixed(2)})</div>
                )}

                {err && <div style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', marginBottom: 10 }}>{err}</div>}

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleBuy}
                  disabled={buyingCoins || buyingCard || (payMethod === 'coins' && !canAfford)}>
                  {buyingCoins || buyingCard ? 'Processing…' : payMethod === 'coins' ? `⭐ Buy for ${totalCoins} coins` : `💳 Pay ${totalFiat}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CampaignCard({ campaign }) {
  const isActive = new Date(campaign.startDate) <= new Date() && new Date(campaign.endDate) >= new Date();
  return (
    <div className="card" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 'var(--font-base)' }}>{campaign.title}</span>
          <span className="badge" style={{ background: isActive ? 'rgba(16,185,129,0.15)' : 'var(--surface3)', color: isActive ? 'var(--success)' : 'var(--text-muted)' }}>{isActive ? '🟢 Live' : '⏸ Inactive'}</span>
          <span className="badge badge-dim">{GOAL_LABELS[campaign.goal]}</span>
        </div>
        {campaign.description && <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 6 }}>{campaign.description}</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
          {campaign.targetCity && <span>📍 {campaign.targetCity}</span>}
          {campaign.targetAgeGroups?.length > 0 && <span>👥 {campaign.targetAgeGroups.join(', ')}</span>}
          <span>📅 {campaign.startDate} → {campaign.endDate}</span>
        </div>
      </div>
      {isActive && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); alert('Link copied!'); }}>🔗 Share</button>
        </div>
      )}
    </div>
  );
}
