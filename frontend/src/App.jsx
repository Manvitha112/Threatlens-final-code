import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Secrets from './pages/Secrets'
import Dependencies from './pages/Dependencies'
import Settings from './pages/Settings'
import RepoDetail from './pages/RepoDetail'
import ProtectedRoute from './components/ProtectedRoute'
import ScanHistory from './pages/ScanHistory'
import Timeline from './pages/Timeline'
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/secrets" element={<ProtectedRoute><Secrets /></ProtectedRoute>} />
          <Route path="/dependencies" element={<ProtectedRoute><Dependencies /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/repos/:id" element={<ProtectedRoute><RepoDetail /></ProtectedRoute>} />
        <Route path="/scan-history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App