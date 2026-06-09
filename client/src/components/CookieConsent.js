import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_PRIVACY_SETTINGS_MUTATION } from '../graphql';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'ho_cookie_consent';

export default function CookieConsent() {
  const { currentUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });

  const [updatePrivacy] = useMutation(UPDATE_PRIVACY_SETTINGS_MUTATION);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const save = async (accepted) => {
    const cp = accepted === 'all'
      ? { necessary: true, analytics: true, marketing: true }
      : accepted === 'necessary'
      ? { necessary: true, analytics: false, marketing: false }
      : prefs;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cp, savedAt: new Date().toISOString() }));
    setVisible(false);
    // Persist to server if logged in
    if (currentUser) {
      updatePrivacy({
        variables: {
          analyticsConsent: cp.analytics,
          marketingConsent: cp.marketing,
          cookiePreferences: JSON.stringify(cp),
        }
      }).catch(() => {});
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--surface)', borderTop: '2px solid var(--border)',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
      padding: showDetails ? '24px 24px 20px' : '16px 24px',
      transition: 'padding 0.2s',
    }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {!showDetails ? (
          /* Compact banner */
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span style={{ fontWeight: 700, marginRight: 8 }}>🍪 We use cookies</span>
              <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                We use necessary cookies to run the platform. With your consent we also use analytics cookies to improve your experience.{' '}
                <a href="/privacy" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDetails(true)}>Manage Preferences</button>
              <button className="btn btn-ghost btn-sm" onClick={() => save('necessary')}>Necessary Only</button>
              <button className="btn btn-primary btn-sm" onClick={() => save('all')}>Accept All</button>
            </div>
          </div>
        ) : (
          /* Detailed preferences */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 'var(--font-base)' }}>🍪 Cookie Preferences</h3>
              <button onClick={() => setShowDetails(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              {[
                { key: 'necessary', label: 'Strictly Necessary', desc: 'Required for the platform to function — login session, security tokens, language preferences. Cannot be disabled.', locked: true },
                { key: 'analytics', label: 'Analytics', desc: 'Help us understand how you use HobbyOrigin so we can improve the experience. No personal data sold.' },
                { key: 'marketing', label: 'Marketing', desc: 'Allow us to show you relevant hobby groups and expert recommendations. You can opt out at any time.' },
              ].map(({ key, label, desc, locked }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: locked ? 'default' : 'pointer', flexShrink: 0, marginTop: 2 }}>
                    <input type="checkbox" checked={locked || prefs[key]} disabled={locked}
                      onChange={e => setPrefs(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                  </label>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: 2 }}>
                      {label} {locked && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(always active)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => save('necessary')}>Reject Non-Essential</button>
              <button className="btn btn-primary btn-sm" onClick={() => save('custom')}>Save My Preferences</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
              We comply with <strong>GDPR</strong> (EU Regulation 2016/679) and <strong>CPRA</strong> (California Privacy Rights Act). You can change these preferences at any time in your account Privacy Settings.{' '}
              <a href="/privacy" style={{ color: 'var(--primary)' }}>Full Privacy Policy →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
