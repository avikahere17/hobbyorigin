import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { MY_COUPONS_QUERY, CREATE_COUPON_MUTATION, DELETE_COUPON_MUTATION } from '../graphql';

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ code: '', description: '', discountPct: 10, maxUses: 100, expiresAt: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data, loading, refetch } = useQuery(MY_COUPONS_QUERY);
  const [createCoupon, { loading: createLoading }] = useMutation(CREATE_COUPON_MUTATION, {
    onCompleted: () => { refetch(); setCreating(false); setForm({ code: '', description: '', discountPct: 10, maxUses: 100, expiresAt: '' }); setError(''); },
    onError: e => setError(e.message),
  });
  const [deleteCoupon] = useMutation(DELETE_COUPON_MUTATION, { onCompleted: refetch });

  if (!currentUser) return <div className="page"><div className="container" style={{ paddingTop: 100, textAlign: 'center' }}>Please sign in.</div></div>;

  if (currentUser.role !== 'SELLER' && currentUser.role !== 'ADMIN') {
    return (
      <div className="page">
        <div className="container" style={{ paddingTop: 100, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
          <h2>Seller access required</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Contact an admin to upgrade your account to Seller.</p>
        </div>
      </div>
    );
  }

  const coupons = data?.myCoupons || [];
  const activeCoupons = coupons.filter(c => c.isActive);

  const handleCreate = async () => {
    setError('');
    if (!form.code.trim()) { setError('Coupon code is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    try {
      await createCoupon({ variables: { code: form.code.toUpperCase().trim(), description: form.description, discountPct: parseInt(form.discountPct), maxUses: parseInt(form.maxUses), expiresAt: form.expiresAt || null } });
    } catch (e) { /* handled by onError */ }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await deleteCoupon({ variables: { id } }); }
    catch (e) { alert(e.message); }
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 4 }}>🛍️ Seller Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Create and manage discount coupons for group members</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Coupons', value: coupons.length, icon: '🏷️', color: 'var(--primary)' },
            { label: 'Active', value: activeCoupons.length, icon: '✅', color: 'var(--success)' },
            { label: 'Total Uses', value: coupons.reduce((s, c) => s + c.usedCount, 0), icon: '🛒', color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Create coupon */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)' }}>➕ Create Coupon</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(v => !v)}>{creating ? '✕ Cancel' : '+ New Coupon'}</button>
          </div>

          {creating && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Code *</label>
                  <input className="input" placeholder="e.g. GUITAR20" value={form.code} onChange={e => setF('code', e.target.value.toUpperCase())} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount %</label>
                  <input className="input" type="number" min={1} max={100} value={form.discountPct} onChange={e => setF('discountPct', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="input" placeholder="e.g. 20% off guitar accessories for club members" value={form.description} onChange={e => setF('description', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Max uses</label>
                  <input className="input" type="number" min={1} value={form.maxUses} onChange={e => setF('maxUses', e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Expires (optional)</label>
                  <input className="input" type="date" value={form.expiresAt} onChange={e => setF('expiresAt', e.target.value)} />
                </div>
              </div>
              {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', marginBottom: 10 }}>{error}</div>}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={createLoading}>
                {createLoading ? 'Creating…' : '🏷️ Create Coupon'}
              </button>
            </div>
          )}
        </div>

        {/* Coupon list */}
        <div className="card">
          <h2 style={{ fontWeight: 800, fontSize: 'var(--font-lg)', marginBottom: 16 }}>🏷️ My Coupons</h2>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏷️</div>
              <p>No coupons yet. Create one above to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {coupons.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: `2px solid ${c.isActive ? 'var(--border)' : 'var(--border)'}`, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 'var(--font-base)', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 6 }}>{c.code}</span>
                      <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: 'var(--font-sm)' }}>{c.discountPct}% OFF</span>
                      {!c.isActive && <span className="badge" style={{ background: 'rgba(107,114,128,0.15)', color: '#6b7280' }}>Inactive</span>}
                    </div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 2 }}>{c.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                      {c.usedCount}/{c.maxUses} uses
                      {c.expiresAt && ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{c.usedCount}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>USED</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
