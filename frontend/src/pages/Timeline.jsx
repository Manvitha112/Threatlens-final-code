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

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const eventConfig = (eventType, severity) => {
  const map = {
    secret_detected: {
      CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '🚨', dot: '#ef4444' },
      HIGH: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: '⚠️', dot: '#fb923c' },
      MEDIUM: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', icon: '🔶', dot: '#fbbf24' },
      LOW: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '🔵', dot: '#4ade80' },
    },
    scan_started: { color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '⚡', dot: '#3B82F6' },
    scan_completed: { color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '✅', dot: '#22C55E' },
    secret_resolved: { color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '✓', dot: '#22C55E' },
  }

  if (eventType === 'secret_detected') {
    return map.secret_detected[severity] || map.secret_detected.LOW
  }
  return map[eventType] || map.scan_completed
}

const Timeline = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [repoFilter, setRepoFilter] = useState('ALL')

  useEffect(() => {
    api.get('/scan/timeline')
      .then(res => setEvents(res.data.events || []))
      .catch(() => toast.error('Failed to load timeline'))
      .finally(() => setLoading(false))
  }, [])

  const repos = [...new Set(events.map(e => e.repoName))]

  const filtered = events.filter(e => {
    const typeMatch = filter === 'ALL' ||
      (filter === 'SECRETS' && e.eventType === 'secret_detected') ||
      (filter === 'SCANS' && (e.eventType === 'scan_started' || e.eventType === 'scan_completed'))
    const repoMatch = repoFilter === 'ALL' || e.repoName === repoFilter
    return typeMatch && repoMatch
  })

  const secretEvents = events.filter(e => e.eventType === 'secret_detected')
  const criticalEvents = secretEvents.filter(e => e.severity === 'CRITICAL')
  const resolvedEvents = events.filter(e => e.eventType === 'secret_resolved')
  const scanEvents = events.filter(e => e.eventType === 'scan_completed')

  const sel = {
    padding: '7px 12px', background: '#1E293B',
    border: '1px solid #334155', borderRadius: '8px',
    color: '#E2E8F0', fontSize: '12px', outline: 'none', cursor: 'pointer'
  }

  const groupByDate = (events) => {
    const groups = {}
    events.forEach(event => {
      const date = new Date(event.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      })
      if (!groups[date]) groups[date] = []
      groups[date].push(event)
    })
    return groups
  }

  const grouped = groupByDate(filtered)

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
            Security Timeline
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            Complete history of security events across all repositories
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total events', value: events.length, color: '#60a5fa' },
            { label: 'Secrets detected', value: secretEvents.length, color: '#f87171' },
            { label: 'Critical findings', value: criticalEvents.length, color: '#ef4444' },
            { label: 'Scans completed', value: scanEvents.length, color: '#4ade80' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
              <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <div style={{ color: stat.color, fontSize: '28px', fontWeight: '700' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={sel}>
            <option value="ALL">All events</option>
            <option value="SECRETS">Secrets only</option>
            <option value="SCANS">Scans only</option>
          </select>
          <select value={repoFilter} onChange={e => setRepoFilter(e.target.value)} style={sel}>
            <option value="ALL">All repos</option>
            {repos.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '13px', alignSelf: 'center' }}>
            {filtered.length} events
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading timeline...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
            <div style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              No events yet
            </div>
            <div style={{ color: '#64748b', fontSize: '13px' }}>
              Run a scan to start building your security timeline
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: '19px', top: 0, bottom: 0,
              width: '2px', background: '#1e293b'
            }} />

            {Object.entries(grouped).map(([date, dateEvents]) => (
              <div key={date} style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  marginBottom: '16px', marginLeft: '40px'
                }}>
                  <div style={{
                    background: '#0F172A', border: '1px solid #1e293b',
                    borderRadius: '999px', padding: '4px 14px',
                    color: '#94A3B8', fontSize: '12px', fontWeight: '500'
                  }}>
                    {date}
                  </div>
                </div>

                {dateEvents.map((event, idx) => {
                  const config = eventConfig(event.eventType, event.severity)
                  return (
                    <div key={event.id} style={{
                      display: 'flex', gap: '16px',
                      marginBottom: '10px', position: 'relative'
                    }}>
                      <div style={{
                        width: '40px', display: 'flex',
                        justifyContent: 'center', flexShrink: 0,
                        paddingTop: '2px'
                      }}>
                        <div style={{
                          width: '14px', height: '14px',
                          borderRadius: '50%',
                          background: config.dot,
                          border: `3px solid #020617`,
                          boxShadow: `0 0 0 2px ${config.dot}30`,
                          zIndex: 1, flexShrink: 0
                        }} />
                      </div>

                      <div style={{
                        flex: 1, background: '#0F172A',
                        border: `1px solid ${config.border}`,
                        borderRadius: '10px', padding: '14px 16px',
                        background: config.bg
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{config.icon}</span>
                            <span style={{ color: config.color, fontSize: '13px', fontWeight: '600' }}>
                              {event.title}
                            </span>
                            {event.severity && event.eventType === 'secret_detected' && (
                              <span style={{
                                background: config.bg, color: config.color,
                                border: `1px solid ${config.border}`,
                                padding: '1px 7px', borderRadius: '999px',
                                fontSize: '10px', fontWeight: '700'
                              }}>
                                {event.severity}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{ color: '#475569', fontSize: '11px' }}>{timeAgo(event.createdAt)}</span>
                            <span style={{ color: '#334155', fontSize: '10px' }}>{formatDate(event.createdAt)}</span>
                          </div>
                        </div>

                        <p style={{ color: '#94A3B8', fontSize: '12px', margin: '0 0 8px', lineHeight: '1.5' }}>
                          {event.description}
                        </p>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📁 {event.repoName}
                          </span>
                          {event.commitSha && (
                            <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: '11px' }}>
                              {event.commitSha.slice(0, 7)}
                            </span>
                          )}
                          {event.filePath && event.filePath !== 'unknown' && (
                            <span style={{ color: '#94A3B8', fontSize: '11px', fontFamily: 'monospace' }}>
                              {event.filePath}
                            </span>
                          )}
                          {event.author && event.author !== 'Unknown' && (
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              👤 {event.author}
                            </span>
                          )}
                          {event.lineNumber && (
                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                              Line {event.lineNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Timeline