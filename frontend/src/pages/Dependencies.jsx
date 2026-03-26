import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const severityStyle = (sev) => {
  const map = {
    CRITICAL: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    HIGH: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
    MEDIUM: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    LOW: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  }
  return map[sev] || map.LOW
}

const Dependencies = () => {
  const [vulns, setVulns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vulns')
      .then(res => setVulns(res.data.vulns || []))
      .catch(() => setVulns([]))
      .finally(() => setLoading(false))
  }, [])

  const thStyle = {
    textAlign: 'left', padding: '12px 16px',
    color: '#64748b', fontSize: '11px', fontWeight: '600',
    letterSpacing: '0.5px', textTransform: 'uppercase',
    background: '#1E293B', borderBottom: '1px solid #1e293b'
  }

  const tdStyle = {
    padding: '12px 16px', color: '#E2E8F0',
    fontSize: '13px', borderBottom: '1px solid #1e293b',
    verticalAlign: 'middle'
  }

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>
        <div style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Dependencies</div>
        <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>
          Vulnerable packages detected in your repositories
        </div>

        <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : vulns.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <div style={{ color: '#4ade80', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>No vulnerabilities found</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>All your dependencies look safe!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Package', 'Version', 'CVE ID', 'Severity', 'Fix version', 'Repo'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vulns.map(vuln => {
                    const ss = severityStyle(vuln.severity)
                    return (
                      <tr key={vuln.id}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, fontWeight: '600' }}>{vuln.packageName}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#94A3B8' }}>{vuln.version}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa' }}>{vuln.cveId}</td>
                        <td style={tdStyle}>
                          <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>
                            {vuln.severity}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#4ade80' }}>{vuln.fixVersion}</td>
                        <td style={{ ...tdStyle, color: '#94A3B8' }}>{vuln.repo?.name}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dependencies