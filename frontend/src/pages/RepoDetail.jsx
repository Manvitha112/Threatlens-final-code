import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'
import toast from 'react-hot-toast'

const timeAgo = (date) => {
  if (!date) return 'Never'
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const formatDate = (date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const severityColor = (sev) => {
  const map = {
    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
    HIGH: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)' },
    MEDIUM: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
    LOW: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
  }
  return map[sev] || map.LOW
}

const langColors = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Solidity: '#AA6746',
}

const RepoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repo, setRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get(`/repos/${id}/details`)
      .then(res => setRepo(res.data.repo))
      .catch(() => toast.error('Failed to load repo details'))
      .finally(() => setLoading(false))
  }, [id])

  const triggerScan = async () => {
    setScanning(true)
    const toastId = toast.loading(`Scanning ${repo.name}...`)
    try {
      const res = await api.post('/scan/trigger', { repoId: id })
      toast.success(res.data.message, { id: toastId })
      const updated = await api.get(`/repos/${id}/details`)
      setRepo(updated.data.repo)
    } catch (err) {
      toast.error('Scan failed', { id: toastId })
    } finally {
      setScanning(false)
    }
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  const openGitHubCommit = (sha) => {
    window.open(`https://github.com/${repo.owner}/${repo.name}/commit/${sha}`, '_blank')
  }

  if (loading) return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #1e293b', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '13px' }}>Loading repo details...</p>
        </div>
      </div>
    </div>
  )

  if (!repo) return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Repository not found</p>
      </div>
    </div>
  )

  const languages = repo.languages ? JSON.parse(repo.languages) : {}
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)
  const contributors = repo.contributors ? JSON.parse(repo.contributors) : []
  const commits = repo.recentCommits ? JSON.parse(repo.recentCommits) : []
  const dependencies = repo.dependencies ? JSON.parse(repo.dependencies) : []
  const openSecrets = repo.secrets?.filter(s => s.status === 'open') || []
  const allSecrets = repo.secrets || []

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'security', label: `🚨 Security (${allSecrets.length})` },
    { id: 'commits', label: `📝 Commits (${commits.length})` },
    { id: 'dependencies', label: `📦 Dependencies (${dependencies.length})` },
  ]

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .commit-row:hover { background: #253352 !important; cursor: pointer; }
        .copy-btn:hover { background: rgba(59,130,246,0.2) !important; }
        .tab-item:hover { color: #E2E8F0 !important; }
      `}</style>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 240px)' }}>

        {/* Back */}
        <button onClick={() => navigate('/dashboard')}
          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
          ← Back to dashboard
        </button>

        {/* Repo Header */}
        <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '36px', height: '36px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  📁
                </div>
                <div>
                  <h1 style={{ color: '#E2E8F0', fontSize: '20px', fontWeight: '700', margin: 0 }}>
                    {repo.owner}/{repo.name}
                  </h1>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                    Branch: {repo.defaultBranch} · Added {timeAgo(repo.createdAt)} · Last scan: {timeAgo(repo.lastScannedAt)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ color: repo.description ? '#94A3B8' : '#475569', fontSize: '13px', margin: '10px 0 12px', fontStyle: repo.description ? 'normal' : 'italic' }}>
                {repo.description || '📄 No README found for this repository'}
              </p>

              {/* Tags row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.keys(languages).slice(0, 4).map(lang => (
                  <span key={lang} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: '#1E293B', border: '1px solid #334155',
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', color: '#E2E8F0'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: langColors[lang] || '#64748b' }} />
                    {lang}
                  </span>
                ))}
                <span style={{ background: '#1E293B', border: '1px solid #334155', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', color: '#64748b' }}>
                  {repo.defaultBranch}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <button onClick={triggerScan} disabled={scanning}
                style={{
                  background: '#3B82F6', border: 'none', color: 'white',
                  padding: '10px 20px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer', opacity: scanning ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                {scanning ? '⟳ Scanning...' : '⚡ Scan now'}
              </button>
              <a href={`https://github.com/${repo.owner}/${repo.name}`} target="_blank" rel="noreferrer"
                style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                View on GitHub →
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
            {[
              { label: 'Open secrets', value: openSecrets.length, color: openSecrets.length > 0 ? '#f87171' : '#4ade80' },
              { label: 'Vulnerabilities', value: repo.vulns?.length || 0, color: (repo.vulns?.length || 0) > 0 ? '#fbbf24' : '#4ade80' },
              { label: 'Stars', value: repo.stars || 0, color: '#fbbf24' },
              { label: 'Forks', value: repo.forks || 0, color: '#60a5fa' },
              { label: 'Files', value: repo.fileCount || 0, color: '#94a3b8' },
              { label: 'Size', value: `${((repo.repoSize || 0) / 1024).toFixed(1)} MB`, color: '#94a3b8' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', background: '#1E293B', borderRadius: '8px', padding: '10px' }}>
                <div style={{ color: stat.color, fontSize: '20px', fontWeight: '700' }}>{stat.value}</div>
                <div style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#0F172A', border: '1px solid #1e293b', borderRadius: '10px', padding: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className="tab-item"
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none',
                fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                background: activeTab === tab.id ? '#1E293B' : 'transparent',
                color: activeTab === tab.id ? '#E2E8F0' : '#64748b',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Languages */}
            <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
                🔤 Languages
              </div>
              {Object.keys(languages).length === 0 ? (
                <p style={{ color: '#475569', fontSize: '13px', fontStyle: 'italic' }}>No language data available</p>
              ) : (
                <>
                  <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    {Object.entries(languages).map(([lang, bytes]) => (
                      <div key={lang} style={{
                        width: `${(bytes / totalBytes) * 100}%`,
                        background: langColors[lang] || '#64748b',
                        transition: 'width 0.3s'
                      }} />
                    ))}
                  </div>
                  {Object.entries(languages).map(([lang, bytes]) => (
                    <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: langColors[lang] || '#64748b' }} />
                        <span style={{ color: '#E2E8F0', fontSize: '13px' }}>{lang}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '80px', height: '4px', background: '#1E293B', borderRadius: '2px' }}>
                          <div style={{ width: `${(bytes / totalBytes) * 100}%`, height: '4px', background: langColors[lang] || '#64748b', borderRadius: '2px' }} />
                        </div>
                        <span style={{ color: '#64748b', fontSize: '12px', minWidth: '36px', textAlign: 'right' }}>
                          {((bytes / totalBytes) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Contributors */}
            <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
                👥 Top contributors
              </div>
              {contributors.length === 0 ? (
                <p style={{ color: '#475569', fontSize: '13px', fontStyle: 'italic' }}>No contributor data available</p>
              ) : contributors.map((c, i) => (
                <div key={c.login} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', background: '#1E293B', borderRadius: '8px', marginBottom: '6px'
                }}>
                  <div style={{ color: '#475569', fontSize: '11px', width: '16px', textAlign: 'center' }}>#{i + 1}</div>
                  <img src={c.avatar} alt={c.login}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0F172A' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '500' }}>{c.login}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{c.contributions} commits</div>
                  </div>
                  <div style={{
                    background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600'
                  }}>
                    {c.contributions}
                  </div>
                </div>
              ))}
            </div>

            {/* README */}
            <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', gridColumn: '1 / -1' }}>
              <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                📄 README
              </div>
              {repo.readmeSummary ? (
                <div style={{ background: '#1E293B', borderRadius: '8px', padding: '16px' }}>
                  <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.8', margin: 0 }}>
                    {repo.readmeSummary}...
                  </p>
                  <a href={`https://github.com/${repo.owner}/${repo.name}#readme`} target="_blank" rel="noreferrer"
                    style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none', display: 'inline-block', marginTop: '10px' }}>
                    Read full README on GitHub →
                  </a>
                </div>
              ) : (
                <div style={{ background: '#1E293B', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>No README found for this repository</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            {allSecrets.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <div style={{ color: '#4ade80', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>No secrets detected</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>This repository looks clean!</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1E293B', borderBottom: '1px solid #1e293b' }}>
                    {['Type', 'File', 'Line', 'Severity', 'Status', 'Detected', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSecrets.map(secret => {
                    const sc = severityColor(secret.severity)
                    return (
                      <tr key={secret.id} style={{ borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: sc.color, fontSize: '13px', fontWeight: '600' }}>
                          {secret.secretType}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {secret.filePath}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                          {secret.lineNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>
                            {secret.severity}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: secret.status === 'resolved' ? 'rgba(34,197,94,0.12)' : secret.status === 'false_positive' ? 'rgba(100,116,139,0.12)' : 'rgba(239,68,68,0.12)',
                            color: secret.status === 'resolved' ? '#4ade80' : secret.status === 'false_positive' ? '#94a3b8' : '#f87171',
                            padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '500'
                          }}>
                            {secret.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '11px' }}>
                          {timeAgo(secret.createdAt)}<br />
                          <span style={{ fontSize: '10px' }}>{formatDate(secret.createdAt)}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(`${secret.secretType} found in ${secret.filePath} line ${secret.lineNumber}`, 'Finding')}
                            style={{
                              background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                              border: '1px solid rgba(59,130,246,0.2)',
                              padding: '4px 10px', borderRadius: '6px',
                              fontSize: '11px', cursor: 'pointer', transition: 'background 0.15s'
                            }}
                          >
                            📋 Copy
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* COMMITS TAB */}
        {activeTab === 'commits' && (
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              📝 Recent commits
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>
              Click a commit hash to view on GitHub
            </div>
            {commits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📭</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>No commit data available</div>
                <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>Re-add this repo to fetch commit history</div>
              </div>
            ) : commits.map((c, i) => (
              <div
                key={c.sha}
                className="commit-row"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '14px 16px', background: '#1E293B',
                  borderRadius: '8px', marginBottom: '6px',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px', minWidth: '20px', textAlign: 'center' }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '500', marginBottom: '6px', lineHeight: '1.4' }}>
                    {c.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      👤 {c.author}
                    </span>
                    <span style={{ color: '#475569', fontSize: '11px' }}>
                      🕐 {timeAgo(c.date)} · {formatDate(c.date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => openGitHubCommit(c.sha)}
                  style={{
                    background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.2)',
                    padding: '5px 12px', borderRadius: '6px',
                    fontSize: '11px', fontFamily: 'monospace',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  title="View on GitHub"
                >
                  {c.sha} ↗
                </button>
              </div>
            ))}
          </div>
        )}

        {/* DEPENDENCIES TAB */}
        {activeTab === 'dependencies' && (
          <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ color: '#E2E8F0', fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>
                  📦 Dependencies
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                  {dependencies.length} packages found · {repo.vulns?.length || 0} with known CVEs
                </div>
              </div>
              {repo.vulns?.length > 0 && (
                <span style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' }}>
                  ⚠️ {repo.vulns.length} vulnerable
                </span>
              )}
            </div>

            {dependencies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📦</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>No dependency data available</div>
                <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>Re-add this repo to fetch package info</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {dependencies.map(dep => {
                  const hasVuln = repo.vulns?.some(v => v.packageName === dep)
                  return (
                    <div key={dep} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', background: hasVuln ? 'rgba(239,68,68,0.05)' : '#1E293B',
                      border: `1px solid ${hasVuln ? 'rgba(239,68,68,0.2)' : '#334155'}`,
                      borderRadius: '8px'
                    }}>
                      <span style={{ color: '#E2E8F0', fontSize: '12px', fontWeight: '500' }}>{dep}</span>
                      {hasVuln && (
                        <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: '600', flexShrink: 0, marginLeft: '6px' }}>
                          CVE
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {repo.vulns?.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
                <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                  Known vulnerabilities
                </div>
                {repo.vulns.map(vuln => {
                  const sc = severityColor(vuln.severity)
                  return (
                    <div key={vuln.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', background: '#1E293B', borderRadius: '8px', marginBottom: '6px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>{vuln.packageName}</span>
                          <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>v{vuln.version}</span>
                          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: '1px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: '600' }}>
                            {vuln.severity}
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          {vuln.description?.slice(0, 80)}...
                        </div>
                      </div>
                      <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, marginLeft: '12px' }}>
                        <a href={vuln.advisoryUrl} target="_blank" rel="noreferrer"
                          style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '11px', textDecoration: 'none' }}>
                          {vuln.cveId} ↗
                        </a>
                        <span style={{ color: '#4ade80', fontSize: '11px' }}>Fix: {vuln.fixVersion}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default RepoDetail