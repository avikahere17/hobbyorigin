import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import { MY_WALLET_FULL_QUERY, CASHOUT_COINS_MUTATION, CREATE_PAYMENT_INTENT_MUTATION } from '../graphql';

const CURRENCY_SYMBOLS = { GBP: '£', USD: '$', EUR: '€', INR: '₹', AUD: 'A$', CAD: 'C$', SGD: 'S$' };

function fmt(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${sym}${(amount / 100).toFixed(2)}`;
}

export default function Wallet({ onAuthRequired }) {
  const { currentUser } = useAuth();
  const [cashoutCoins, setCashoutCoins] = useState('');
  const [cashoutDone, setCashoutDone] = useState(null);
  const [cashoutErr, setCashoutErr] = useState('');
  const [tab, setTab] = useState('overview');

  const { data, loading, refetch } = useQuery(MY_WALLET_FULL_QUERY, { skip: !currentUser, fetchPolicy: 'cache-and-network' });
  const [cashout, { loading: cashing }] = useMutation(CASHOUT_COINS_MUTATION, { onCompleted: (d) => { setCashoutDone(d.cashoutCoins); refetch(); }, onError: (e) => setCashoutErr(e.message) });
  const [createPaymentIntent] = useMutation(CREATE_PAYMENT_INTENT_MUTATION);

  if (!currentUser) return (
    <div className="page container" style={{ paddingTop: 80 }}>
      <div className="empty-state">
        <div className="empty-state-icon">💰</div>
        <div className="empty-state-title">Sign in to view your wallet</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onAuthRequired('login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading && !data) return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;

  const wallet = data?.myWallet;
  const orders = data?.myOrders || [];
  const currency = wallet?.coinCurrency || currentUser.currency || 'GBP';
  const coinValue = wallet?.coinValueLocal || 0.01; // e.g. £0.01
  const sym = CURRENCY_SYMBOLS[currency] || currency;

  const MIN_CASHOUT = 500;
  const cashoutAmount = parseInt(cashoutCoins) || 0;
  const cashoutFiat = (cashoutAmount * coinValue).toFixed(2);
  const canCashout = cashoutAmount >= MIN_CASHOUT && cashoutAmount <= (wallet?.coins || 0);

  const handleCashout = async () => {
    setCashoutErr('');
    if (!canCashout) return;
    await cashout({ variables: { coins: cashoutAmount } });
  };

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(245,158,11,0.08))', borderBottom: '2px solid var(--border)', padding: '32px 0 24px' }}>
        <div className="container">
          <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: 6 }}>💰 My Wallet</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Earn coins through tips & webinars. Spend on products or cash out.</p>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Coin Balance</div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>⭐ {wallet?.coins ?? 0}</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>1 coin = {sym}{coinValue.toFixed(2)}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg,#f97316,#eab308)', color: '#fff', border: 'none' }}>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>Coin Value</div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>{sym}{((wallet?.coins ?? 0) * coinValue).toFixed(2)}</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>≈ current balance in {currency}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total Orders</div>
            <div style={{ fontSize: 36, fontWeight: 900 }}>{orders.length}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>products purchased</div>
          </div>
        </div>

        {/* How coins work */}
        <div className="card" style={{ marginBottom: 24, background: 'rgba(99,102,241,0.05)', border: '1.5px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 'var(--font-base)' }}>How Coins Work</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            <div>⭐ <strong>Earn</strong> — Receive tips from group members or webinar rewards</div>
            <div>🛒 <strong>Spend</strong> — Buy products in any group shop using coins</div>
            <div>💳 <strong>Pay by card</strong> — Buy products with credit/debit card and earn 10% back as coins</div>
            <div>💸 <strong>Cash out</strong> — Convert {MIN_CASHOUT}+ coins to real money ({sym}{(MIN_CASHOUT * coinValue).toFixed(2)} minimum)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>💰 Cash Out</button>
          <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>🛒 My Orders {orders.length > 0 && `(${orders.length})`}</button>
        </div>

        {tab === 'overview' && (
          <div style={{ maxWidth: 480 }}>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', marginBottom: 4 }}>💸 Convert Coins to {currency}</div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: 16 }}>
                Minimum {MIN_CASHOUT} coins ({sym}{(MIN_CASHOUT * coinValue).toFixed(2)}). Funds sent via bank transfer within 3–5 business days.
              </div>

              <div className="form-group">
                <label className="form-label">Coins to cash out</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[500, 1000, 2500, 5000].filter(v => v <= (wallet?.coins || 0)).map(v => (
                    <button key={v} type="button" onClick={() => setCashoutCoins(String(v))}
                      style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${cashoutCoins == v ? 'var(--primary)' : 'var(--border)'}`, background: cashoutCoins == v ? 'var(--primary-light)' : 'transparent', color: cashoutCoins == v ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-sm)', fontFamily: 'inherit' }}>
                      ⭐ {v}
                    </button>
                  ))}
                </div>
                <input className="input" type="number" min={MIN_CASHOUT} max={wallet?.coins || 0}
                  placeholder={`Min ${MIN_CASHOUT} coins`}
                  value={cashoutCoins} onChange={e => { setCashoutCoins(e.target.value); setCashoutErr(''); }} />
              </div>

              {cashoutCoins && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14, fontSize: 'var(--font-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>⭐ {cashoutAmount} coins</span>
                    <span style={{ fontWeight: 700 }}>→ {sym}{cashoutFiat}</span>
                  </div>
                  {cashoutAmount < MIN_CASHOUT && <div style={{ color: 'var(--danger)', marginTop: 4 }}>Minimum is {MIN_CASHOUT} coins</div>}
                  {cashoutAmount > (wallet?.coins || 0) && <div style={{ color: 'var(--danger)', marginTop: 4 }}>You only have {wallet?.coins} coins</div>}
                </div>
              )}

              {cashoutErr && <div style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', marginBottom: 10 }}>{cashoutErr}</div>}

              {cashoutDone ? (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid var(--success)', borderRadius: 'var(--radius-sm)', padding: 14, color: 'var(--success)' }}>
                  ✅ Cashout requested! <strong>{sym}{(cashoutDone.amount / 100).toFixed(2)}</strong> will arrive in 3–5 business days.
                  <button className="btn btn-ghost btn-sm" style={{ display: 'block', marginTop: 8 }} onClick={() => { setCashoutDone(null); setCashoutCoins(''); }}>Request another</button>
                </div>
              ) : (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCashout} disabled={!canCashout || cashing}>
                  {cashing ? 'Processing…' : canCashout ? `Cash out ${sym}${cashoutFiat}` : 'Enter coins above'}
                </button>
              )}

              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                🔒 Payments processed securely. Platform fee: 10% retained on cashout. Bank details collected at time of payout via secure form.
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-title">No orders yet</div>
              <div className="empty-state-desc">Browse group shops to buy products with coins or card.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(o => (
                <div key={o.id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 36 }}>{o.product?.imageEmoji || '📦'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{o.product?.name || 'Product'}</div>
                    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                      Qty: {o.quantity} · {o.paymentMethod === 'coins' ? `⭐ ${o.totalCoins} coins` : `💳 ${fmt(o.totalAmount, o.currency)}`}
                    </div>
                    {o.deliveryAddress && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>📦 {o.deliveryAddress}</div>}
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge ${o.status === 'confirmed' ? 'badge-success' : 'badge-dim'}`} style={{ textTransform: 'capitalize' }}>{o.status}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
