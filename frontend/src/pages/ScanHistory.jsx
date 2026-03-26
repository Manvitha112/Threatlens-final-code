import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'
import toast from 'react-hot-toast'

const timeAgo = (date) => {
  if (!date) return 'Unknown'
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const statusStyle = (status) => {
  const map = {
    completed: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)', icon: '✅' },
    running: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)', icon: '⟳' },
    failed: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', icon: '❌' },
  }
  return map[status] || map.completed
}

const ScanHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/scan/history')
      .then(res => setHistory(res.data.history || []))
      .catch(() => toast.error('Failed to load scan history'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL'
    ? history
    : history.filter(h => h.status === filter.toLowerCase())

  const totalScans = history.length
  const successScans = history.filter(h => h.status === 'completed').length
  const failedScans = history.filter(h => h.status === 'failed').length
  const totalFindings = history.reduce((sum, h) => sum + (h.findingsCount || 0), 0)

  const sel = {
    padding: '7px 12px',
    background: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
            Scan History
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Complete audit trail of all security scans
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total scans', value: totalScans, color: '#60a5fa' },
            { label: 'Successful', value: successScans, color: '#4ade80' },
            { label: 'Failed', value: failedScans, color: '#f87171' },
            { label: 'Total findings', value: totalFindings, color: '#fbbf24' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <div style={{ color: stat.color, fontSize: '28px', fontWeight: '700' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={sel}>
            <option value="ALL">All scans</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="RUNNING">Running</option>
          </select>
          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '13px', alignSelf: 'center' }}>
            {filtered.length} scans
          </span>
        </div>

        <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading scan history...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
              <div style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>No scan history yet</div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>Go to Dashboard and click ⚡ Scan on any repo</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1E293B', borderBottom: '1px solid #1e293b' }}>
                  {['Repository', 'Status', 'Findings', 'Duration', 'Triggered by', 'Retries', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(scan => {
                  const ss = statusStyle(scan.status)
                  return (
                    <tr key={scan.id}
                      style={{ borderBottom: '1px solid #1e293b', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>{scan.repoName}</div>
                        {scan.commitSha && (
                          <div style={{ color: '#475569', fontSize: '11px', fontFamily: 'monospace', marginTop: '2px' }}>
                            {scan.commitSha.slice(0, 7)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: ss.bg, color: ss.color,
                          border: `1px solid ${ss.border}`,
                          padding: '4px 10px', borderRadius: '999px',
                          fontSize: '11px', fontWeight: '600',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          {ss.icon} {scan.status}
                        </span>
                        {scan.errorMessage && (
                          <div style={{ color: '#f87171', fontSize: '10px', marginTop: '4px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {scan.errorMessage}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          color: scan.findingsCount > 0 ? '#f87171' : '#4ade80',
                          fontSize: '16px', fontWeight: '700'
                        }}>
                          {scan.findingsCount}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '4px' }}>found</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '13px' }}>
                        {scan.duration > 0 ? `${scan.duration}s` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: scan.triggeredBy === 'manual' ? 'rgba(99,102,241,0.12)' : 'rgba(20,184,166,0.12)',
                          color: scan.triggeredBy === 'manual' ? '#a5b4fc' : '#2dd4bf',
                          padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '500'
                        }}>
                          {scan.triggeredBy === 'manual' ? '👤 Manual' : '🤖 Webhook'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                        {scan.retryCount > 0 ? (
                          <span style={{ color: '#fbbf24' }}>{scan.retryCount} retries</span>
                        ) : (
                          <span style={{ color: '#4ade80' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                        {timeAgo(scan.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}

export default ScanHistory