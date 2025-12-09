import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, name, password });
      addToast('Регистрация прошла успешно!', 'success');
      navigate('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-xl) var(--spacing)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Карточка */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--border-radius-lg)',
          padding: 'var(--spacing-2xl)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--color-primary-50)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--spacing)',
              color: 'var(--primary)',
              fontSize: '32px'
            }}>
              ✨
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Библиотека
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '16px'
            }}>
              Создание аккаунта
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing)' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ваше имя"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}>
                  Пароль
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '16px',
                    background: 'var(--bg-body)',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    marginBottom: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    padding: '0',
                    textAlign: 'left',
                    fontWeight: '500'
                  }}
                >
                  Показать пароль
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: 'var(--spacing)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--primary-dark)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>

          {/* Ссылка на вход */}
          <div style={{
            marginTop: 'var(--spacing-xl)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              marginBottom: 'var(--spacing-sm)'
            }}>
              Уже есть аккаунт?
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              Войти в систему
            </Link>
          </div>
        </div>

        {/* Подсказка */}
        <div style={{
          marginTop: 'var(--spacing-xl)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px'
        }}>
          После регистрации вы получите доступ ко всем возможностям библиотеки
        </div>
      </div>
    </div>
  );
}