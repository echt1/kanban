import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import BoardPage from './pages/BoardPage'
import CalendarPage from './pages/CalendarPage'
import ViewBoardPage from './pages/ViewBoardPage'
import TablesPage from './pages/TablesPage'
import TableDetailPage from './pages/TableDetailPage'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullscreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function FullscreenLoader() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', color: 'var(--muted)', letterSpacing: '0.05em',
    }}>
      lädt …
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/view/:boardId" element={<ViewBoardPage />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
      <Route path="/tables" element={<Protected><TablesPage /></Protected>} />
      <Route path="/tables/:tableId" element={<Protected><TableDetailPage /></Protected>} />
      <Route path="/board/:boardId" element={<Protected><BoardPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
