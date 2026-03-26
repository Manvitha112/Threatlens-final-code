import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const Settings = () => {
  const [githubRepos, setGithubRepos] = useState([])
  const [monitoredRepos, setMonitoredRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    api.get('/repos').then(res => setMonitoredRepos(res.data.repos))
  }, [])

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const fetchRepos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/repos/github')
      setGithubRepos(res.data.repos)
    } catch {
      showMsg('Failed to fetch GitHub repos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addRepo = async (repo) => {
    try {
      await api.post('/repos/add', {
        repoId: String(repo.id),
        name: repo.name,
        owner: repo.owner.login,
        defaultBranch: repo.default_branch
      })
      showMsg(`${repo.name} added to monitoring!`)
      const res = await api.get('/repos')
      setMonitoredRepos(res.data.repos)
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add repo', 'error')
    }
  }

  const removeRepo = async (id) => {
    try {
      await api.delete(`/repos/${id}`)
      setMonitoredRepos(prev => prev.filter(r => r.id !== id))
      showMsg('Repository removed')
    } catch {
      showMsg('Failed to remove repo', 'error')
    }
  }

  const isMonitored = (repoId) => monitoredRepos.some(r => r.repoId === String(repoId))

  const cardStyle = {
    background: '#0F172A', border: '1px solid #1e293b',
    borderRadius: '12px', padding: '24px', marginBottom: '16px'
  }

  const btnStyle = (type) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
    background: type === 'primary' ? '#3B82F6' : type === 'danger' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
    color: type === 'primary' ? 'white' : type === 'danger' ? '#f87171' : '#60a5fa',
  })

  return (
    <div style={{ display: 'flex', background: '#020617', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, padding: '32px', maxWidth: '900px' }}>
        <div style={{ color: '#E2E8F0', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Settings</div>
        <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>
          Manage GitHub integration and repository monitoring
        </div>

        {message.text && (
          <div style={{
            background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius: '8px', padding: '12px 16px',
            color: message.type === 'error' ? '#f87171' : '#4ade80',
            fontSize: '13px', marginBottom: '20px'
          }}>{message.text}</div>
        )}

        <div style={cardStyle}>
          <div style={{ color: '#E2E8F0', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
            GitHub repositories
          </div>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
            Fetch and add your GitHub repositories to ThreatLens monitoring
          </div>
          <button onClick={fetchRepos} disabled={loading} style={btnStyle('primary')}>
            {loading ? 'Fetching...' : 'Fetch my GitHub repos'}
          </button>

          {githubRepos.length > 0 && (
            <div style={{ marginTop: '16px', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {githubRepos.map(repo => (
                <div key={repo.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#1E293B', borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '500' }}>{repo.full_name}</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {repo.private ? '🔒 Private' : '🌐 Public'} · {repo.language || 'Unknown language'}
                    </div>
                  </div>
                  {isMonitored(repo.id) ? (
                    <span style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '500' }}>
                      Monitoring
                    </span>
                  ) : (
                    <button onClick={() => addRepo(repo)} style={btnStyle('info')}>
                      Add repo
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ color: '#E2E8F0', fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>
            Currently monitoring
          </div>
          <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
            {monitoredRepos.length} repositor{monitoredRepos.length !== 1 ? 'ies' : 'y'} being monitored
          </div>
          {monitoredRepos.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>No repositories added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {monitoredRepos.map(repo => (
                <div key={repo.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#1E293B', borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '500' }}>
                      {repo.owner}/{repo.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      Branch: {repo.defaultBranch} · Status: {repo.status}
                    </div>
                  </div>
                  <button onClick={() => removeRepo(repo.id)} style={btnStyle('danger')}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings