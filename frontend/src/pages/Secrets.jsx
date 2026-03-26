import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'
import toast from 'react-hot-toast'

const getSecretAge = (createdAt) => {
  const seconds = Math.floor((new Date() - new Date(createdAt)) / 1000)
  if (seconds < 3600) return { text: `${Math.floor(seconds / 60)}m exposed`, urgency: 'low' }
  if (seconds < 86400) return { text: `${Math.floor(seconds / 3600)}h exposed`, urgency: 'medium' }
  const days = Math.floor(seconds / 86400)
  if (days === 1) return { text: '1 day exposed', urgency: 'high' }
  if (days <= 7) return { text: `${days} days exposed`, urgency: 'high' }
  return { text: `${days} days exposed ⚠️`, urgency: 'critical' }
}

const urgencyColor = (urgency) => {
  const map = {
    low: { color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    high: { color: '#fb923c', bg: 'rgba(249,115,22,0.1)' },
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  }
  return map[urgency] || map.low
}

const severityStyle = (sev) => {
  const map = {
    CRITICAL: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    HIGH: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
    MEDIUM: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    LOW: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  }
  return map[sev] || map.LOW
}

const statusStyle = (status) => {
  const map = {
    open: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
    resolved: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80' },
    false_positive: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
  }
  return map[status] || map.open
}

const Secrets = () => {
  const [secrets, setSecrets] = useState([])
  const [filtered, setFiltered] = useState([])
  const [sevFilter, setSevFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    api.get('/secrets').then(res => {
      setSecrets(res.data.secrets)
      setFiltered(res.data.secrets)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let r = secrets
    if (sevFilter !== 'ALL') r = r.filter(s => s.severity === sevFilter)
    if (statusFilter !== 'ALL') r = r.filter(s => s.status === statusFilter)
    setFiltered(r)
  }, [sevFilter, statusFilter, secrets])

  const updateStatus = async (id, status) => {
    await api.patch(`/secrets/${id}`, { status })
    setSecrets(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    toast.success(status === 'resolved' ? '✅ Marked as resolved' : '🔕 Marked as false positive')
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const exportCSV = () => {
    const headers = ['Repo', 'File Path', 'Line', 'Type', 'Severity', 'Status', 'Age', 'Commit', 'Detected At']
    const rows = filtered.map(s => {
      const age = getSecretAge(s.createdAt)
      return [
        s.repo?.name,
        s.filePath,
        s.lineNumber,
        s.secretType,
        s.severity,
        s.status,
        age.text,
        s.commitSha?.slice(0, 7),
        new Date(s.createdAt).toLocaleString()
      ]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threatlens-secrets-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast.success('CSV exported!')
  }

  const sel = {
    padding: '8px 12px', background: '#1E293B',
    border: '1px solid #334155', borderRadius: '8px',
    color: '#E2E8F0', fontSize: '13px', outline: 'none', cursor: 'pointer'
  }

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
const exportPDF = async () => {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('ThreatLens Security Report', 14, 20)

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
  doc.text(`Total findings: ${filtered.length}`, 14, 38)
  doc.text(`Critical: ${filtered.filter(s => s.severity === 'CRITICAL').length}  High: ${filtered.filter(s => s.severity === 'HIGH').length}  Open: ${filtered.filter(s => s.status === 'open').length}`, 14, 46)

  autoTable(doc, {
    startY: 55,
    head: [['Repo', 'File', 'Line', 'Type', 'Severity', 'Age', 'Status']],
    body: filtered.map(s => {
      const age = getSecretAge(s.createdAt)
      return [
        s.repo?.name,
        s.filePath,
        s.lineNumber,
        s.secretType,
        s.severity,
        age.text,
        s.status
      ]
    }),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      4: {
        fontStyle: 'bold',
        textColor: (cell) => {
          if (cell.raw === 'CRITICAL') return [239, 68, 68]
          if (cell.raw === 'HIGH') return [249, 115, 22]
          return [0, 0, 0]
        }
      }
    }
  })

  filtered.forEach((secret, i) => {
    if (secret.risk || secret.fix) {
      const finalY = doc.lastAutoTable.finalY + (i === 0 ? 15 : 5)
      if (finalY > 250) doc.addPage()

      if (secret.risk) {
        doc.setFontSize(10)
        doc.setTextColor(239, 68, 68)
        doc.text(`⚠ ${secret.secretType} — Risk`, 14, finalY)
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        const riskLines = doc.splitTextToSize(secret.risk, 180)
        doc.text(riskLines, 14, finalY + 6)
      }
    }
  })

  doc.save(`threatlens-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  toast.success('PDF report exported!')
}
  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <style>{`
        .secret-row:hover { background: rgba(255,255,255,0.02) !important; cursor: pointer; }
      `}</style>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>
        <div style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Secrets</div>
        <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>
          Detected credentials — click any row for risk details and fix suggestions
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={sel}>
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={sel}>
            <option value="ALL">All status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False positive</option>
          </select>
          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '13px' }}>
            {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={exportCSV}
            style={{
              background: 'rgba(59,130,246,0.12)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.25)',
              padding: '8px 16px', borderRadius: '8px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer'
            }}
          >
            📥 Export CSV
          </button>
<button
  onClick={exportPDF}
  style={{
    background: 'rgba(239,68,68,0.12)', color: '#f87171',
    border: '1px solid rgba(239,68,68,0.25)',
    padding: '8px 16px', borderRadius: '8px',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer'
  }}
>
  📄 Export PDF
</button>

        </div>

        <div style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
              <div style={{ color: '#4ade80', fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No secrets found</div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Your repositories look clean!</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['', 'Repo', 'File path', 'Line', 'Type', 'Severity', 'Age', 'Status', 'Actions'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(secret => {
                    const ss = severityStyle(secret.severity)
                    const st = statusStyle(secret.status)
                    const isExpanded = expandedId === secret.id
                    const age = getSecretAge(secret.createdAt)
                    const uc = urgencyColor(age.urgency)
                    return (
                      <>
                        <tr
                          key={secret.id}
                          className="secret-row"
                          onClick={() => toggleExpand(secret.id)}
                          style={{
                            transition: 'background 0.15s',
                            borderBottom: isExpanded ? 'none' : '1px solid #1e293b'
                          }}
                        >
                          <td style={{ ...tdStyle, width: '32px', color: '#64748b', fontSize: '11px' }}>
                            {isExpanded ? '▼' : '▶'}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '600' }}>{secret.repo?.name}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: '#94A3B8', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {secret.filePath}
                          </td>
                          <td style={{ ...tdStyle, color: '#64748b' }}>{secret.lineNumber}</td>
                          <td style={{ ...tdStyle }}>{secret.secretType}</td>
                          <td style={tdStyle}>
                            <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>
                              {secret.severity}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              background: uc.bg, color: uc.color,
                              padding: '3px 10px', borderRadius: '999px',
                              fontSize: '11px', fontWeight: '600'
                            }}>
                              {age.text}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '500' }}>
                              {secret.status}
                            </span>
                          </td>
                          <td style={tdStyle} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => updateStatus(secret.id, 'resolved')}
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                                Resolve
                              </button>
                              <button onClick={() => updateStatus(secret.id, 'false_positive')}
                                style={{ background: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
                                False +
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${secret.id}-expand`}>
                            <td colSpan={9} style={{ padding: '0', borderBottom: '1px solid #1e293b' }}>
                              <div style={{
                                background: '#1E293B', padding: '16px 20px',
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
                              }}>
                                {secret.risk && (
                                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                      <span>⚠️</span>
                                      <span style={{ color: '#f87171', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Why this is risky
                                      </span>
                                    </div>
                                    <p style={{ color: '#fca5a5', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                                      {secret.risk}
                                    </p>
                                  </div>
                                )}

                                {secret.fix && (
                                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                      <span>🔧</span>
                                      <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        How to fix it
                                      </span>
                                    </div>
                                    <p style={{ color: '#86efac', fontSize: '12px', lineHeight: '1.7', margin: 0 }}>
                                      {secret.fix}
                                    </p>
                                  </div>
                                )}

                                {!secret.risk && !secret.fix && (
                                  <div style={{ gridColumn: '1/-1', color: '#64748b', fontSize: '12px', padding: '8px 0' }}>
                                    Re-scan this repo to get risk analysis and fix suggestions.
                                  </div>
                                )}

                                <div style={{ gridColumn: '1/-1', display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid #334155', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
                                  <span>📁 {secret.repo?.name}</span>
                                  <span>📄 {secret.filePath}</span>
                                  <span>📍 Line {secret.lineNumber}</span>
                                  <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>🔑 {secret.commitSha?.slice(0, 7)}</span>
                                  <span>🕐 Detected {new Date(secret.createdAt).toLocaleString()}</span>
                                  <span style={{ color: uc.color, fontWeight: '600' }}>⏱ {age.text}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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

export default Secrets