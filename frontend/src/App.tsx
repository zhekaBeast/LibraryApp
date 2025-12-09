import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { useState, useEffect, useRef } from 'react';
import type { Role } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { Container } from './components/Container';
import React from 'react';
import NotificationBell from './pages/NotificationBell';

export default function App() {
  const { user, logout, hasRole, switchRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }, []);
  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-body)'
    }}>
      {/* Хедер */}
      <header style={{
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Container size="full">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            height: '64px' 
          }}>
            {/* Логотип */}
            <Link to={user ? '/' : '/login'} style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: 'var(--primary)', fontSize: '24px' }}>📚</span>
              <span>Библиотека</span>
            </Link>

            {/* Правая часть */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {user && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {user.name}
                </span>
              )}

              {/* Селектор роли */}
              {user && user.role == "ADMIN" && 
                <RoleSelector role={user.role} onChange={switchRole} />
              }
              {user && <NotificationBell />}
              {/* Мобильное меню (всегда) */}
              <MobileMenu 
                ref={menuRef}
                isOpen={isMobileMenuOpen}
                onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                onLogout={logout}
                hasRole={hasRole}
                isAuthenticated={!!user}
              />
            </div>
          </div>
        </Container>
      </header>

      {/* Основной контент */}
      <main style={{ flex: 1 }}>
        <Container size="full">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}

// Компонент выбора роли
function RoleSelector({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  return (
    <select
      value={role}
      onChange={(e) => onChange(e.target.value as Role)}
      style={{
        padding: '6px 10px',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--border-radius)',
        fontSize: '12px',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        cursor: 'pointer'
      }}
    >
      <option value="READER">Читатель</option>
      <option value="LIBRARIAN">Библиотекарь</option>
      <option value="ADMIN">Админ</option>
    </select>
  );
}

// Компонент мобильного меню
const MobileMenu = React.forwardRef<HTMLDivElement, {
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  isAuthenticated: boolean;
}>(({ isOpen, onToggle, onLogout, hasRole, isAuthenticated }, ref) => {
  const location = useLocation();

  const menuItems = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Мои книги', icon: '📋' },
        ...(hasRole('LIBRARIAN', 'ADMIN') 
          ? [{ to: '/librarian', label: 'Управление', icon: '🛠️' }] 
          : []),
        ...(hasRole('ADMIN') 
          ? [{ to: '/admin', label: 'Админка', icon: '⚙️' }] 
          : []),
      ]
    : [
        { to: '/login', label: 'Войти', icon: '🔑' },
        { to: '/register', label: 'Регистрация', icon: '📝' },
      ];

  return (
    <div ref={ref} style={{ position: 'relative', paddingRight: '40px' }}>
      {/* Гамбургер кнопка */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: isOpen ? 'var(--color-gray-100)' : 'transparent',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--border-radius)',
          cursor: 'pointer',
          padding: '10px',
          transition: 'all 0.2s'
        }}
        aria-label="Меню"
      >
        <span style={{ width: '20px', height: '2px', background: 'var(--text-primary)' }} />
        <span style={{ width: '20px', height: '2px', background: 'var(--text-primary)' }} />
        <span style={{ width: '20px', height: '2px', background: 'var(--text-primary)' }} />
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: '200px',
          zIndex: 1000
        }}>
          <div style={{ padding: '4px 0' }}>
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  textDecoration: 'none',
                  color: location.pathname === item.to 
                    ? 'var(--primary)' 
                    : 'var(--text-primary)',
                  background: location.pathname === item.to 
                    ? 'var(--color-primary-50)' 
                    : 'transparent',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
                onClick={onToggle}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* О проекте */}
            <Link
              to="/about"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                background: 'transparent',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onClick={onToggle}
            >
              <span>ℹ️</span>
              <span>О проекте</span>
            </Link>

            <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />

            {/* Тогглер темы */}
            <div style={{ padding: '8px 16px' }}>
              <ThemeToggle />
            </div>

            {/* Выход для авторизованных */}
            {isAuthenticated && (
              <>
                <div style={{ borderTop: '1px solid var(--border-light)', margin: '4px 0' }} />
                <button
                  onClick={() => {
                    onLogout();
                    onToggle();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-error)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>👋</span>
                  <span>Выйти</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});