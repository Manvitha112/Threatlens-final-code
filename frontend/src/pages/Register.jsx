import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', { email, password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020617',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#0F172A',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#3B82F6', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '700', fontSize: '16px',
            margin: '0 auto 16px'
          }}>TL</div>
          <h1 style={{ color: '#E2E8F0', fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>
            Create account
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px' }}>Start monitoring your repos for free</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '12px 16px',
            color: '#f87171', fontSize: '13px', marginBottom: '20px'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', fontWeight: '500', marginBottom: '6px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{
                width: '100%', padding: '11px 14px',
                background: '#1E293B', border: '1px solid #334155',
                borderRadius: '8px', color: '#E2E8F0', fontSize: '14px', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', fontWeight: '500', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters" required
              style={{
                width: '100%', padding: '11px 14px',
                background: '#1E293B', border: '1px solid #334155',
                borderRadius: '8px', color: '#E2E8F0', fontSize: '14px', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#3B82F6'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: '#3B82F6', border: 'none', borderRadius: '8px',
              color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register