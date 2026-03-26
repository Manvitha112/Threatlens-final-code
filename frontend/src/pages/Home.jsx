import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  const styles = {
    page: { background: '#020617', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', background: '#0F172A', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 50 },
    logoWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { width: '32px', height: '32px', background: '#3B82F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '12px' },
    logoText: { color: '#E2E8F0', fontWeight: '700', fontSize: '15px' },
    navLinks: { display: 'flex', gap: '28px' },
    navLink: { color: '#94A3B8', fontSize: '13px', cursor: 'pointer', textDecoration: 'none' },
    navBtns: { display: 'flex', gap: '10px' },
    btnOutline: { background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' },
    btnBlue: { background: '#3B82F6', border: 'none', color: 'white', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
    hero: { padding: '80px 48px 60px', textAlign: 'center', background: '#020617' },
    badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', padding: '5px 14px', borderRadius: '999px', fontSize: '12px', marginBottom: '24px', border: '1px solid rgba(59,130,246,0.25)' },
    h1: { color: '#E2E8F0', fontSize: '48px', fontWeight: '800', lineHeight: '1.15', marginBottom: '16px' },
    h1Blue: { color: '#3B82F6' },
    heroSub: { color: '#94A3B8', fontSize: '16px', maxWidth: '520px', margin: '0 auto 32px', lineHeight: '1.7' },
    heroBtns: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '48px' },
    btnLgBlue: { background: '#3B82F6', border: 'none', color: 'white', padding: '13px 30px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    btnLgGhost: { background: 'transparent', border: '1px solid #334155', color: '#E2E8F0', padding: '13px 30px', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    statsRow: { display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '52px' },
    statNum: { color: '#3B82F6', fontSize: '28px', fontWeight: '700' },
    statLabel: { color: '#475569', fontSize: '12px', marginTop: '3px' },
    previewWrap: { background: '#0F172A', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '800px', margin: '0 auto', overflow: 'hidden' },
    previewBar: { background: '#020617', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #1e293b' },
    previewBody: { display: 'flex' },
    previewSidebar: { width: '148px', background: '#0F172A', padding: '14px', borderRight: '1px solid #1e293b' },
    previewContent: { flex: 1, padding: '16px' },
    previewCardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' },
    previewCard: { background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px' },
    previewCardLabel: { color: '#475569', fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    previewTwoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
    previewSection: { background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '10px' },
    previewSectionTitle: { color: '#64748b', fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' },
    features: { padding: '72px 48px', background: '#0F172A' },
    featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' },
    featureCard: { background: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' },
    featureTitle: { color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '8px' },
    featureDesc: { color: '#64748b', fontSize: '12px', lineHeight: '1.7' },
    howSection: { padding: '72px 48px', background: '#020617' },
    howGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '860px', margin: '0 auto' },
    stepCircle: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: '700', fontSize: '13px', margin: '0 auto 14px' },
    stepTitle: { color: '#E2E8F0', fontSize: '13px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' },
    stepDesc: { color: '#64748b', fontSize: '12px', textAlign: 'center', lineHeight: '1.6' },
    ctaSection: { padding: '72px 48px', background: '#0F172A', textAlign: 'center' },
    ctaCard: { background: '#020617', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '52px', maxWidth: '560px', margin: '0 auto' },
    ctaH2: { color: '#E2E8F0', fontSize: '26px', fontWeight: '700', marginBottom: '12px' },
    ctaP: { color: '#94A3B8', fontSize: '14px', marginBottom: '28px', lineHeight: '1.7' },
    footer: { padding: '20px 48px', background: '#0F172A', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { color: '#475569', fontSize: '12px' },
    sectionLabel: { textAlign: 'center', color: '#475569', fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px' },
    sectionH2: { textAlign: 'center', color: '#E2E8F0', fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
    sectionSub: { textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginBottom: '40px' },
  }

  const features = [
    { icon: '🔐', bg: 'rgba(239,68,68,0.12)', title: 'Secret detection', desc: 'Scans every commit diff for AWS keys, GitHub tokens, Stripe keys, and 50+ patterns using regex + entropy analysis.' },
    { icon: '📦', bg: 'rgba(250,204,21,0.12)', title: 'CVE scanning', desc: 'Checks npm and Python dependencies against the OSV.dev advisory database for known vulnerabilities.' },
    { icon: '⚡', bg: 'rgba(59,130,246,0.12)', title: 'Real-time webhooks', desc: 'GitHub webhooks trigger scans within seconds of every push — no manual scanning needed.' },
    { icon: '🔔', bg: 'rgba(34,197,94,0.12)', title: 'Instant alerts', desc: 'Get notified via Slack and email when secrets or critical CVEs are detected in your repos.' },
    { icon: '📊', bg: 'rgba(168,85,247,0.12)', title: 'Security dashboard', desc: 'Centralised view of all findings across repos with severity breakdown and remediation tracking.' },
    { icon: '✅', bg: 'rgba(20,184,166,0.12)', title: 'False positive control', desc: 'Mark findings as resolved or false positive. Track remediation status across all your repos.' },
  ]

  const steps = [
    { num: '01', title: 'Create account', desc: 'Sign up with your email and password in seconds' },
    { num: '02', title: 'Connect GitHub', desc: 'Add your GitHub personal access token' },
    { num: '03', title: 'Add repos', desc: 'Select the repositories you want to monitor' },
    { num: '04', title: 'Stay protected', desc: 'Get alerts on every security issue automatically' },
  ]

  return (
    <div style={styles.page}>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>TL</div>
          <span style={styles.logoText}>ThreatLens</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#features" style={styles.navLink}>Features</a>
          <a href="#how" style={styles.navLink}>How it works</a>
        </div>
        <div style={styles.navBtns}>
          <button style={styles.btnOutline} onClick={() => navigate('/login')}>Sign in</button>
          <button style={styles.btnBlue} onClick={() => navigate('/register')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          <span style={{ fontSize: '11px' }}>🔒</span>
          Real-time GitHub security monitoring
        </div>
        <h1 style={styles.h1}>
          Protect your repos from<br />
          <span style={styles.h1Blue}>leaked secrets</span> & CVEs
        </h1>
        <p style={styles.heroSub}>
          ThreatLens scans every commit for exposed credentials and vulnerable
          dependencies — instantly alerting your team before damage is done.
        </p>
        <div style={styles.heroBtns}>
          <button style={styles.btnLgBlue} onClick={() => navigate('/register')}>
            Start monitoring free
          </button>
          <button style={styles.btnLgGhost} onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { num: '10k+', label: 'Repos protected' },
            { num: '99ms', label: 'Avg scan time' },
            { num: '50+', label: 'Secret patterns' },
            { num: '24/7', label: 'Continuous monitoring' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={styles.statNum}>{s.num}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard preview */}
        <div style={styles.previewWrap}>
          <div style={styles.previewBar}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#facc15' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: '#475569', fontSize: '11px', marginLeft: '8px' }}>ThreatLens Dashboard</span>
          </div>
          <div style={styles.previewBody}>
            <div style={styles.previewSidebar}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', padding: '0 2px' }}>
                <div style={{ width: '20px', height: '20px', background: '#3B82F6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', fontWeight: '700', flexShrink: 0 }}>TL</div>
                <span style={{ color: '#E2E8F0', fontSize: '10px', fontWeight: '700' }}>ThreatLens</span>
              </div>
              {['📊 Dashboard', '🔐 Secrets', '📦 Dependencies', '⚙️ Settings'].map((item, i) => (
                <div key={item} style={{ padding: '7px 8px', borderRadius: '6px', fontSize: '10px', marginBottom: '2px', background: i === 0 ? 'rgba(59,130,246,0.15)' : 'transparent', color: i === 0 ? '#60a5fa' : '#64748b' }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={styles.previewContent}>
              <div style={styles.previewCardsGrid}>
                {[
                  { label: 'Repos', num: '12', color: '#60a5fa' },
                  { label: 'Secrets', num: '3', color: '#f87171' },
                  { label: 'Critical', num: '1', color: '#ef4444' },
                  { label: 'CVEs', num: '7', color: '#fbbf24' },
                ].map(card => (
                  <div key={card.label} style={styles.previewCard}>
                    <div style={styles.previewCardLabel}>{card.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: card.color }}>{card.num}</div>
                  </div>
                ))}
              </div>
              <div style={styles.previewTwoCol}>
                <div style={styles.previewSection}>
                  <div style={styles.previewSectionTitle}>Repositories</div>
                  {[
                    { name: 'LoyVault', safe: true },
                    { name: 'RuralConnect', safe: false },
                    { name: 'Placement-MS', safe: true },
                  ].map(r => (
                    <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 7px', background: '#0F172A', borderRadius: '4px', marginBottom: '4px' }}>
                      <span style={{ color: '#E2E8F0', fontSize: '9px' }}>{r.name}</span>
                      <span style={{ fontSize: '8px', padding: '2px 6px', borderRadius: '999px', background: r.safe ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.safe ? '#4ade80' : '#f87171' }}>
                        {r.safe ? 'Safe' : '2 issues'}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={styles.previewSection}>
                  <div style={styles.previewSectionTitle}>Recent Alerts</div>
                  {[
                    { msg: 'AWS key in .env file', red: true },
                    { msg: 'GitHub token exposed', red: true },
                    { msg: 'lodash CVE-2021-23337', red: false },
                  ].map(a => (
                    <div key={a.msg} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 7px', borderRadius: '4px', marginBottom: '4px', background: a.red ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)', fontSize: '9px', color: a.red ? '#f87171' : '#fbbf24' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: a.red ? '#ef4444' : '#fbbf24', flexShrink: 0 }} />
                      {a.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={styles.features}>
        <div style={styles.sectionLabel}>Features</div>
        <div style={styles.sectionH2}>Everything you need to stay secure</div>
        <div style={styles.sectionSub}>Built for developers who push fast and need security that keeps up</div>
        <div style={styles.featuresGrid}>
          {features.map(f => (
            <div key={f.title} style={styles.featureCard}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '12px' }}>
                {f.icon}
              </div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={styles.howSection}>
        <div style={styles.sectionLabel}>How it works</div>
        <div style={styles.sectionH2}>Up and running in 2 minutes</div>
        <div style={{ ...styles.sectionSub, marginBottom: '40px' }}>No complex setup. Connect once, monitor forever.</div>
        <div style={styles.howGrid}>
          {steps.map(s => (
            <div key={s.num}>
              <div style={styles.stepCircle}>{s.num}</div>
              <div style={styles.stepTitle}>{s.title}</div>
              <div style={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <div style={styles.ctaH2}>Start protecting your repos today</div>
          <p style={styles.ctaP}>
            Connect your GitHub account and get your first security scan in under 2 minutes. Free to use.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button style={styles.btnLgBlue} onClick={() => navigate('/register')}>Get started free</button>
            <button style={styles.btnLgGhost} onClick={() => navigate('/login')}>Sign in</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>TL</div>
          <span style={styles.logoText}>ThreatLens</span>
        </div>
        <span style={styles.footerText}>Built for developers who care about security</span>
        <span style={styles.footerText}>© 2026 ThreatLens</span>
      </footer>

    </div>
  )
}

export default Home