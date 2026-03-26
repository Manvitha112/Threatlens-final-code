import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'
import toast from 'react-hot-toast'

const calcSecurityScore = (secrets, vulns) => {
  if (secrets.length === 0 && vulns.length === 0) return 100
  let score = 100
  const openSecrets = secrets.filter(s => s.status === 'open')
  openSecrets.forEach(s => {
    if (s.severity === 'CRITICAL') score -= 12
    else if (s.severity === 'HIGH') score -= 8
    else if (s.severity === 'MEDIUM') score -= 4
    else score -= 2
  })
  vulns.forEach(v => {
    if (v.severity === 'CRITICAL') score -= 8
    else if (v.severity === 'HIGH') score -= 5
    else if (v.severity === 'MEDIUM') score -= 2
    else score -= 1
  })
  return Math.max(5, Math.min(100, score))
}

const scoreColor = (score) => {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#FACC15'
  return '#EF4444'
}

const scoreLabel = (score) => {
  if (score >= 80) return '● Good'
  if (score >= 60) return '● Fair'
  return '● Critical'
}

const timeAgo = (date) => {
  if (!date) return 'Never'
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const SkeletonCard = () => (
  <div style={{
    background: '#0F172A',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '20px'
  }}>
    <div style={{ height: '10px', background: '#1E293B', borderRadius: '4px', width: '60%', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
    <div style={{ height: '32px', background: '#1E293B', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s infinite' }} />
  </div>
)

const SkeletonRow = () => (
  <div style={{ height: '56px', background: '#1E293B', borderRadius: '8px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [secrets, setSecrets] = useState([])
  const [vulns, setVulns] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [reposRes, secretsRes, vulnsRes] = await Promise.all([
        api.get('/repos'),
        api.get('/secrets'),
        api.get('/vulns')
      ])
      setRepos(reposRes.data.repos || [])
      setSecrets(secretsRes.data.secrets || [])
      setVulns(vulnsRes.data.vulns || [])
      setLastUpdated(new Date())
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 15000)
  return () => clearInterval(interval)
}, [fetchData])
  const triggerScan = async (repoId, repoName, e) => {
    e.stopPropagation()
    setScanning(repoId)
    const toastId = toast.loading(`Scanning ${repoName}...`)
    try {
      const res = await api.post('/scan/trigger', { repoId })
      toast.success(res.data.message, { id: toastId })
      await fetchData()
    } catch (err) {
      toast.error('Scan failed — ' + (err.response?.data?.message || 'Unknown error'), { id: toastId })
    } finally {
      setScanning(null)
    }
  }

  const openSecrets = secrets.filter(s => s.status === 'open')
  const criticalCount = secrets.filter(s => s.severity === 'CRITICAL' && s.status === 'open').length
  const highCount = secrets.filter(s => s.severity === 'HIGH' && s.status === 'open').length
  const score = calcSecurityScore(secrets, vulns)
  const resolvedCount = secrets.filter(s => s.status === 'resolved').length

  const getLanguages = (repo) => {
    try {
      if (!repo.languages) return []
      const langs = JSON.parse(repo.languages)
      return Object.keys(langs).slice(0, 3)
    } catch { return [] }
  }

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .repo-card:hover {
          background: #1a2744 !important;
          border-color: rgba(59,130,246,0.3) !important;
          cursor: pointer;
        }
        .scan-btn:hover {
          background: rgba(59,130,246,0.25) !important;
        }
        .alert-row:hover {
          opacity: 0.85;
        }
      `}</style>

      <Sidebar />

      <div style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
              Dashboard
            </h1>
            <p style={{ color: '#475569', fontSize: '12px' }}>
              Last updated {timeAgo(lastUpdated)} ·
              <span
                onClick={fetchData}
                style={{ color: '#60a5fa', cursor: 'pointer', marginLeft: '6px' }}
              >
                Refresh
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: '#64748b' }}>
              {repos.length} repo{repos.length !== 1 ? 's' : ''} monitored
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {loading ? (
            [1,2,3,4,5].map(i => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Security Score */}
              <div style={{
                background: '#0F172A',
                border: `1px solid ${scoreColor(score)}35`,
                borderRadius: '12px', padding: '18px',
                position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Security score
                </div>
                <div style={{ color: scoreColor(score), fontSize: '32px', fontWeight: '700', marginBottom: '4px', lineHeight: 1 }}>
                  {score}
                  <span style={{ fontSize: '14px', color: '#475569' }}>/100</span>
                </div>
                <div style={{ fontSize: '11px', color: scoreColor(score), fontWeight: '600', marginTop: '6px' }}>
                  {scoreLabel(score)}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  height: '3px', width: `${score}%`,
                  background: scoreColor(score),
                  borderRadius: '0 0 0 12px',
                  transition: 'width 0.5s ease'
                }} />
              </div>

              {/* Monitored Repos */}
              <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Monitored repos
                </div>
                <div style={{ color: '#60a5fa', fontSize: '32px', fontWeight: '700', lineHeight: 1, marginBottom: '4px' }}>
                  {repos.length}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                  Active monitoring
                </div>
              </div>

              {/* Secrets Found */}
              <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Secrets found
                </div>
                <div style={{ color: openSecrets.length > 0 ? '#f87171' : '#4ade80', fontSize: '32px', fontWeight: '700', lineHeight: 1, marginBottom: '4px' }}>
                  {openSecrets.length}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                  {resolvedCount > 0 ? `${resolvedCount} resolved` : 'Open issues'}
                </div>
              </div>

              {/* Critical */}
              <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Critical / High
                </div>
                <div style={{ color: criticalCount > 0 ? '#ef4444' : '#4ade80', fontSize: '32px', fontWeight: '700', lineHeight: 1, marginBottom: '4px' }}>
                  {criticalCount}
                  <span style={{ fontSize: '16px', color: '#fb923c' }}>/{highCount}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                  Needs attention
                </div>
              </div>

              {/* Vulnerabilities */}
              <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '18px' }}>
                <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Vulnerabilities
                </div>
                <div style={{ color: vulns.length > 0 ? '#fbbf24' : '#4ade80', fontSize: '32px', fontWeight: '700', lineHeight: 1, marginBottom: '4px' }}>
                  {vulns.length}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                  CVEs detected
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Repos */}
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600' }}>
                Monitored repositories
              </div>
              <span
                onClick={() => navigate('/settings')}
                style={{ color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}
              >
                + Add repo
              </span>
            </div>

            {loading ? (
              [1,2,3].map(i => <SkeletonRow key={i} />)
            ) : repos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📁</div>
                <div style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>No repos added yet</div>
                <div style={{ color: '#475569', fontSize: '12px', marginBottom: '16px' }}>Go to Settings to add repositories</div>
                <button
                  onClick={() => navigate('/settings')}
                  style={{ background: '#3B82F6', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Go to Settings
                </button>
              </div>
            ) : repos.map(repo => {
              const repoSecrets = secrets.filter(s => s.repoId === repo.id && s.status === 'open')
              const langs = getLanguages(repo)

              return (
                <div
                  key={repo.id}
                  className="repo-card"
                  onClick={() => navigate(`/repos/${repo.id}`)}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '8px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>{repo.name}</span>
                        <span style={{ color: '#475569', fontSize: '11px' }}>→</span>
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px' }}>
                        {repo.owner} · Last scan: {timeAgo(repo.lastScannedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500',
                        background: repoSecrets.length > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                        color: repoSecrets.length > 0 ? '#f87171' : '#4ade80'
                      }}>
                        {repoSecrets.length > 0 ? `${repoSecrets.length} issues` : 'Safe'}
                      </span>
                      <button
                        className="scan-btn"
                        onClick={(e) => triggerScan(repo.id, repo.name, e)}
                        disabled={scanning === repo.id}
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.2)',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          opacity: scanning === repo.id ? 0.6 : 1,
                          transition: 'background 0.15s'
                        }}
                      >
                        {scanning === repo.id ? '⟳' : '⚡ Scan'}
                      </button>
                    </div>
                  </div>

                  {(langs.length > 0 || repo.description) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      {repo.description && (
                        <span style={{ color: '#64748b', fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {repo.description}
                        </span>
                      )}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {langs.map(lang => (
                          <span key={lang} style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 7px', borderRadius: '999px', fontSize: '10px' }}>
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recent Alerts */}
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600' }}>Recent alerts</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {openSecrets.length > 0 && (
                  <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '11px', padding: '2px 8px', borderRadius: '999px' }}>
                    {openSecrets.length} open
                  </span>
                )}
                <span
                  onClick={() => navigate('/secrets')}
                  style={{ color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}
                >
                  View all →
                </span>
              </div>
            </div>

            {loading ? (
              [1,2,3,4].map(i => <SkeletonRow key={i} />)
            ) : secrets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
                <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>No secrets detected</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>Your repos look clean!</div>
              </div>
            ) : secrets.slice(0, 7).map(secret => (
              <div
                key={secret.id}
                className="alert-row"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
                  background: secret.severity === 'CRITICAL'
                    ? 'rgba(239,68,68,0.07)'
                    : secret.severity === 'HIGH'
                    ? 'rgba(249,115,22,0.07)'
                    : 'rgba(251,191,36,0.07)',
                  border: `1px solid ${
                    secret.severity === 'CRITICAL'
                      ? 'rgba(239,68,68,0.15)'
                      : secret.severity === 'HIGH'
                      ? 'rgba(249,115,22,0.15)'
                      : 'rgba(251,191,36,0.15)'
                  }`,
                  transition: 'opacity 0.15s'
                }}
              >
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
                  background: secret.severity === 'CRITICAL' ? '#ef4444' : secret.severity === 'HIGH' ? '#fb923c' : '#fbbf24'
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', fontWeight: '600',
                    color: secret.severity === 'CRITICAL' ? '#f87171' : secret.severity === 'HIGH' ? '#fb923c' : '#fbbf24'
                  }}>
                    {secret.secretType}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {secret.repo?.name} · {secret.filePath} · Line {secret.lineNumber}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                  <span style={{
                    background: secret.status === 'open' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color: secret.status === 'open' ? '#f87171' : '#4ade80',
                    padding: '1px 6px', borderRadius: '999px', fontSize: '10px'
                  }}>
                    {secret.status}
                  </span>
                  <span style={{ color: '#475569', fontSize: '10px' }}>
                    {timeAgo(secret.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* CVE Summary Row */}
        {vulns.length > 0 && (
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600' }}>Top vulnerabilities</div>
              <span onClick={() => navigate('/dependencies')} style={{ color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}>
                View all {vulns.length} →
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {vulns.slice(0, 4).map(vuln => (
                <div key={vuln.id} style={{ background: '#1E293B', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '600' }}>{vuln.packageName}</span>
                    <span style={{
                      fontSize: '10px', padding: '1px 7px', borderRadius: '999px', fontWeight: '600',
                      background: vuln.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : vuln.severity === 'HIGH' ? 'rgba(249,115,22,0.15)' : 'rgba(251,191,36,0.15)',
                      color: vuln.severity === 'CRITICAL' ? '#f87171' : vuln.severity === 'HIGH' ? '#fb923c' : '#fbbf24'
                    }}>
                      {vuln.severity}
                    </span>
                  </div>
                  <div style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '11px', marginBottom: '4px' }}>{vuln.cveId}</div>
                  <div style={{ color: '#64748b', fontSize: '11px' }}>Fix: {vuln.fixVersion}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard