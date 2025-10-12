import { Link, Outlet, useLocation } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/AuthContext'

export default function App() {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()

  const navLinkStyle = (path: string) => ({
    padding: '8px 16px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: location.pathname === path ? '#2563eb' : '#374151',
    backgroundColor: location.pathname === path ? '#eff6ff' : 'transparent',
    fontWeight: location.pathname === path ? '600' : '400',
    transition: 'all 0.2s'
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <Link to="/" style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', textDecoration: 'none' }}>
                Библиотека
              </Link>
              <nav style={{ display: 'flex', gap: '8px' }}>
                <Link to="/" style={navLinkStyle('/')}>Каталог</Link>
                {user && <Link to="/dashboard" style={navLinkStyle('/dashboard')}>Мои книги</Link>}
                {hasRole('LIBRARIAN', 'ADMIN') && (
                  <Link to="/librarian" style={navLinkStyle('/librarian')}>Управление</Link>
                )}
              </nav>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {!user ? (
                <>
                  <Link to="/login" style={navLinkStyle('/login')}>Вход</Link>
                  <Link to="/register" style={navLinkStyle('/register')}>Регистрация</Link>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      {user.name} ({user.role === 'READER' ? 'Читатель' : user.role === 'LIBRARIAN' ? 'Библиотекарь' : 'Администратор'})
                    </span>
                    <button 
                      onClick={logout}
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#e5e7eb'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f3f4f6'
                      }}
                    >
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main style={{ flex: 1, background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
