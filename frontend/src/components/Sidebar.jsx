import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/secrets', label: 'Secrets', icon: '🔐' },
  { path: '/dependencies', label: 'Dependencies', icon: '📦' },
  { path: '/timeline', label: 'Timeline', icon: '📅' },
  { path: '/scan-history', label: 'Scan History', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0,
      width: '240px', height: '100vh',
      background: '#0F172A',
      borderRight: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column',
      zIndex: 100
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#3B82F6', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '12px', flexShrink: 0
          }}>TL</div>
          <div>
            <div style={{ color: '#E2E8F0', fontWeight: '700', fontSize: '14px' }}>ThreatLens</div>
            <div style={{ color: '#475569', fontSize: '11px' }}>Security Monitor</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px' }}>
        {menuItems.map(item => {
          const active = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                marginBottom: '2px', textDecoration: 'none',
                fontSize: '13px', fontWeight: '500',
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: active ? '#60a5fa' : '#94A3B8',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={() => { logout(); navigate('/login') }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px',
            background: 'transparent', border: 'none',
            color: '#94A3B8', fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar