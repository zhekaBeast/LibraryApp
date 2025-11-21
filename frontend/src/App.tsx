import { Link, Outlet, useLocation } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function App() {
  const { user, logout, hasRole } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])
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
            {/* Логотип и навигация */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <Link to="/" style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', textDecoration: 'none' }}>
                Библиотека
              </Link>
              
              
            </div>
            
            {/* Правая часть с информацией о пользователе */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {!user ? (
                <>
                  <Link to="/login" style={navLinkStyle('/login')}>Вход</Link>
                  <Link to="/register" style={navLinkStyle('/register')}>Регистрация</Link>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    {user.name} ({user.role === 'READER' ? 'Читатель' : user.role === 'LIBRARIAN' ? 'Библиотекарь' : 'Администратор'})
                  </span>
                </div>
              )}
              {/* Гамбургер-меню */}
              {user && (
                <div ref={menuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#374151',
                      transition: 'all 0.3s',
                      transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
                    }} />
                    <div style={{
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#374151',
                      transition: 'all 0.3s',
                      opacity: isMobileMenuOpen ? 0 : 1
                    }} />
                    <div style={{
                      width: '20px',
                      height: '2px',
                      backgroundColor: '#374151',
                      transition: 'all 0.3s',
                      transform: isMobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
                    }} />
                  </button>

                  {/* Выпадающее меню */}
                  {isMobileMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '8px',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      minWidth: '200px',
                      zIndex: 1000
                    }}>
                      <div style={{ padding: '8px 0' }}>

                        <Link 
                          to="/dashboard" 
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            textDecoration: 'none',
                            color: location.pathname === '/dashboard' ? '#2563eb' : '#374151',
                            backgroundColor: location.pathname === '/dashboard' ? '#eff6ff' : 'transparent',
                            fontWeight: location.pathname === '/dashboard' ? '600' : '400',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Мои книги
                        </Link>

                        {hasRole('LIBRARIAN', 'ADMIN') && (
                          <Link 
                            to="/librarian" 
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              textDecoration: 'none',
                              color: location.pathname === '/librarian' ? '#2563eb' : '#374151',
                              backgroundColor: location.pathname === '/librarian' ? '#eff6ff' : 'transparent',
                              fontWeight: location.pathname === '/librarian' ? '600' : '400',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Управление
                          </Link>
                        )}

````````````````````````{hasRole('ADMIN') && (
                          <Link 
                            to="/admin" 
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              textDecoration: 'none',
                              color: location.pathname === '/librarian' ? '#2563eb' : '#374151',
                              backgroundColor: location.pathname === '/librarian' ? '#eff6ff' : 'transparent',
                              fontWeight: location.pathname === '/librarian' ? '600' : '400',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Панель управления
                          </Link>
                        )}

                        <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />
                        <button 
                          onClick={() => {
                            logout()
                            setIsMobileMenuOpen(false)
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
