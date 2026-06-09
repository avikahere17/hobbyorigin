import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ id, title, children }) => (
  <section id={id} style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, marginBottom: 12, color: 'var(--text)', paddingTop: 8 }}>{title}</h2>
    {children}
  </section>
);

const P = ({ children }) => <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 12 }}>{children}</p>;
const Li = ({ children }) => <li style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 6 }}>{children}</li>;

export default function PrivacyPolicy() {
  const LAST_UPDATED = '9 June 2026';
  const CONTACT = 'ceo@hobbyorigin.com';

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 16px', maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(99,102,241,0.12)', color: 'var(--primary)' }}>GDPR Compliant</span>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: 'var(--success)' }}>CPRA Compliant</span>
          </div>
          <h1 style={{ fontSize: 'calc(var(--font-xl) + 4px)', fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Last updated: {LAST_UPDATED} · <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a></p>
          <div style={{ marginTop: 16, padding: '14px 18px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)', fontSize: 'var(--font-sm)', lineHeight: 1.7 }}>
            <strong>Plain-English summary:</strong> We collect only what we need to run the platform. We never sell your personal data. You can download everything we hold about you, or delete your account permanently, at any time from your Profile → Privacy Settings.
          </div>
        </div>

        {/* Contents */}
        <div style={{ marginBottom: 32, padding: '16px 20px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-sm)' }}>
          <strong style={{ display: 'block', marginBottom: 10 }}>Contents</strong>
          {['Who we are','Data we collect','How we use your data','Legal basis (GDPR)','Your GDPR rights','Your CPRA rights','Data sharing','Cookies','Data retention','Security','Children','International transfers','Changes','Contact us'].map((t, i) => (
            <a key={t} href={`#s${i+1}`} style={{ display: 'inline-block', marginRight: 16, marginBottom: 4, color: 'var(--primary)' }}>{i+1}. {t}</a>
          ))}
        </div>

        <Section id="s1" title="1. Who we are">
          <P>HobbyOrigin ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is operated by HobbyOrigin Ltd. We provide an online platform connecting people through shared hobbies, expert coaching, and community groups.</P>
          <P><strong>Data Controller:</strong> HobbyOrigin Ltd · <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a></P>
        </Section>

        <Section id="s2" title="2. Data we collect">
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Account data</strong> — name, email address, hashed password, age, city/country, language preference, currency.</Li>
            <Li><strong>Profile data</strong> — bio, interests, location (building/neighbourhood — only if you provide it), GPS coordinates (only if you press "Detect GPS" — never collected automatically).</Li>
            <Li><strong>Usage data</strong> — messages sent, groups joined, events attended, expert bookings made.</Li>
            <Li><strong>Payment-adjacent data</strong> — if you purchase products or book paid sessions we record the amount and currency. We do <strong>not</strong> store card numbers — payment processing is handled by third-party providers.</Li>
            <Li><strong>Technical data</strong> — IP address (for rate-limiting and fraud prevention), browser User-Agent (for security audit logs), session tokens.</Li>
            <Li><strong>Consent records</strong> — timestamps of when you accepted our Terms and Privacy Policy.</Li>
          </ul>
          <P>We do <strong>not</strong> collect race or ethnicity, health data, political views, religion, sexual orientation, or biometric data.</P>
        </Section>

        <Section id="s3" title="3. How we use your data">
          <ul style={{ paddingLeft: 20 }}>
            <Li>Providing the platform — matching you with nearby groups, enabling chat and bookings.</Li>
            <Li>Security — detecting brute-force login attempts, preventing abuse.</Li>
            <Li>Platform improvements — aggregate (never individual) analytics when you have given analytics consent.</Li>
            <Li>Communications — booking confirmations, session reminders (you can turn these off in Notification Preferences).</Li>
            <Li>Legal obligations — responding to lawful requests from authorities.</Li>
          </ul>
        </Section>

        <Section id="s4" title="4. Legal basis for processing (GDPR Article 6)">
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Contract (Art. 6(1)(b))</strong> — processing your account data and bookings is necessary to deliver the service you signed up for.</Li>
            <Li><strong>Consent (Art. 6(1)(a))</strong> — analytics and marketing cookies; location data beyond city level. You can withdraw consent at any time.</Li>
            <Li><strong>Legitimate interests (Art. 6(1)(f))</strong> — fraud prevention, security logging, platform abuse prevention.</Li>
            <Li><strong>Legal obligation (Art. 6(1)(c))</strong> — retaining financial transaction records as required by applicable law.</Li>
          </ul>
        </Section>

        <Section id="s5" title="5. Your GDPR rights (EEA, UK, Switzerland)">
          <P>You have the right to:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Access (Art. 15)</strong> — request a copy of all data we hold about you. Use <em>Profile → Privacy → Export My Data</em>.</Li>
            <Li><strong>Rectification (Art. 16)</strong> — correct inaccurate data in your Profile at any time.</Li>
            <Li><strong>Erasure (Art. 17)</strong> — delete your account and all associated personal data. Use <em>Profile → Privacy → Delete My Account</em>. Messages are anonymised rather than deleted to preserve group history.</Li>
            <Li><strong>Portability (Art. 20)</strong> — receive your data in a machine-readable JSON format via the Export tool.</Li>
            <Li><strong>Restriction (Art. 18)</strong> — request we stop processing your data while a dispute is resolved.</Li>
            <Li><strong>Object (Art. 21)</strong> — object to processing based on legitimate interests. Use the Do-Not-Sell / Do-Not-Share toggle in Privacy Settings.</Li>
            <Li><strong>Withdraw consent</strong> — update cookie and marketing preferences at any time in Privacy Settings.</Li>
          </ul>
          <P>To exercise rights not covered by in-app tools, email <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a>. We will respond within 30 days. You also have the right to lodge a complaint with your national supervisory authority (e.g. ICO in the UK, CNIL in France).</P>
        </Section>

        <Section id="s6" title="6. Your CPRA rights (California residents)">
          <P>Under the California Privacy Rights Act (effective 1 January 2023):</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Right to Know</strong> — you can request the categories and specific pieces of personal information we have collected about you in the past 12 months.</Li>
            <Li><strong>Right to Delete</strong> — you can ask us to delete your personal information (subject to certain exceptions).</Li>
            <Li><strong>Right to Correct</strong> — you can correct inaccurate personal information we hold.</Li>
            <Li><strong>Right to Opt-Out of Sale/Sharing</strong> — we <strong>do not sell or share</strong> personal information with third parties for cross-context behavioural advertising. You can still toggle "Do Not Sell or Share My Personal Information" in Privacy Settings as a formal record.</Li>
            <Li><strong>Right to Limit Sensitive Data Use</strong> — we do not collect sensitive personal information as defined by CPRA (precise geolocation beyond what you explicitly share, financial account details, health data, etc.).</Li>
            <Li><strong>Right of No Retaliation</strong> — exercising any of these rights will never affect your access to HobbyOrigin.</Li>
          </ul>
          <P>California residents may exercise rights by emailing <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a> with subject "CPRA Request". We will respond within 45 days.</P>
        </Section>

        <Section id="s7" title="7. Data sharing">
          <P>We do <strong>not sell</strong> your personal data. We share data only with:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Infrastructure providers</strong> — Netlify (web hosting), Render (server hosting), Neon (database hosting). All are contractually bound to EU/UK GDPR standard contractual clauses.</Li>
            <Li><strong>Other users</strong> — your display name, avatar, and messages are visible to members of groups you join. Your exact location (GPS, building name) is <em>never</em> shared publicly.</Li>
            <Li><strong>Authorities</strong> — only when legally required and we cannot reasonably refuse.</Li>
          </ul>
        </Section>

        <Section id="s8" title="8. Cookies">
          <P>We use three categories of cookies:</P>
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Strictly Necessary</strong> — authentication token (hc_token), cookie consent preference. These cannot be disabled.</Li>
            <Li><strong>Analytics</strong> — aggregate usage metrics to improve the platform. Only set with your consent.</Li>
            <Li><strong>Marketing</strong> — used to show relevant content recommendations. Only set with your consent.</Li>
          </ul>
          <P>You can update your cookie preferences at any time — a "Manage Cookies" option is available in your Profile → Privacy Settings and in the cookie banner shown on first visit.</P>
        </Section>

        <Section id="s9" title="9. Data retention">
          <ul style={{ paddingLeft: 20 }}>
            <Li><strong>Account data</strong> — retained until you delete your account.</Li>
            <Li><strong>Messages</strong> — anonymised (content replaced with "[deleted]") when you delete your account; the message shell is retained to preserve group conversation context.</Li>
            <Li><strong>Security audit logs</strong> — retained for 90 days for fraud and abuse investigation.</Li>
            <Li><strong>Financial records</strong> — retained for 7 years as required by applicable accounting law.</Li>
            <Li><strong>Consent records</strong> — retained for 3 years after your account is closed to demonstrate regulatory compliance.</Li>
          </ul>
        </Section>

        <Section id="s10" title="10. Security">
          <ul style={{ paddingLeft: 20 }}>
            <Li>All connections are encrypted in transit via TLS/HTTPS.</Li>
            <Li>Passwords are stored using bcrypt (cost factor 10) — we never store plaintext passwords.</Li>
            <Li>Authentication tokens (JWT) expire after 30 days.</Li>
            <Li>Rate limiting is applied to login and registration endpoints (20 attempts per 15 minutes per IP).</Li>
            <Li>HTTP security headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, X-XSS-Protection) are applied via Helmet.js.</Li>
            <Li>The database is hosted on Neon with connection pooling and TLS encryption at rest.</Li>
          </ul>
          <P>If you discover a security vulnerability please disclose it responsibly to <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a>.</P>
        </Section>

        <Section id="s11" title="11. Children">
          <P>Children aged 7–17 may use HobbyOrigin with verified parental consent via the "Link Child" feature. A parent or guardian must create the child's account and link it to their own. We do not knowingly collect data from children without parental consent. If you believe a child's account was created without consent, contact us immediately.</P>
        </Section>

        <Section id="s12" title="12. International data transfers">
          <P>HobbyOrigin's infrastructure is hosted in the United States (Render, Neon) and distributed globally (Netlify CDN). Transfers from the EEA/UK to the US are covered by Standard Contractual Clauses (SCCs) as provided by our hosting partners. We maintain records of these transfer mechanisms and can provide them on request.</P>
        </Section>

        <Section id="s13" title="13. Changes to this policy">
          <P>We will notify you of material changes via an in-app notification and by updating the "Last updated" date above. Continued use after 30 days constitutes acceptance of the revised policy.</P>
        </Section>

        <Section id="s14" title="14. Contact us">
          <P>Data Controller: HobbyOrigin Ltd</P>
          <P>Email: <a href={`mailto:${CONTACT}`} style={{ color: 'var(--primary)' }}>{CONTACT}</a></P>
          <P>For formal data subject requests (GDPR / CPRA), please include your full name, registered email address, and the specific right you wish to exercise. We respond within 30 days (GDPR) or 45 days (CPRA).</P>
        </Section>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--primary)', fontSize: 'var(--font-sm)' }}>← Back to HobbyOrigin</Link>
          {' · '}
          <Link to="/profile" style={{ color: 'var(--primary)', fontSize: 'var(--font-sm)' }}>Manage your Privacy Settings →</Link>
        </div>
      </div>
    </div>
  );
}
