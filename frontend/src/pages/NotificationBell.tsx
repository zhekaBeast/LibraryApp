// src/components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Notification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: string;
  isRead: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Загрузка уведомлений
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get<Notification[]>('/api/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Пометить все как прочитанные
  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Пометить одно уведомление как прочитанное
  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Загружаем уведомления при монтировании
  useEffect(() => {
    loadNotifications();
  }, []);

  // Считаем непрочитанные
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Функция для получения иконки по типу
  const getIconByType = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  // Функция для получения цвета по типу
  const getColorByType = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'var(--color-blue-500)';
      case 'warning': return 'var(--color-yellow-500)';
      case 'success': return 'var(--color-green-500)';
      case 'error': return 'var(--color-red-500)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Кнопка колокольчика */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '20px',
          color: 'var(--text-primary)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--color-gray-100)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'none';
        }}
      >
        🔔
        {/* Бейдж с количеством непрочитанных */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--gray-100)',
            color: 'var(--text-primary)',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающий список уведомлений */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '320px',
          maxHeight: '400px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Заголовок */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: 'var(--text-primary)'
            }}>
              Уведомления
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}>
                  {unreadCount} новых
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--color-primary-50)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список уведомлений */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                Загрузка...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                Уведомлений нет
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: notification.isRead 
                      ? 'transparent' 
                      : 'var(--color-blue-50)',
                    opacity: notification.isRead ? 0.7 : 1
                  }}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-gray-100)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = notification.isRead 
                      ? 'transparent' 
                      : 'var(--color-blue-50)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      {getIconByType(notification.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '4px',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          {new Date(notification.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                        {!notification.isRead && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getColorByType(notification.type)
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          
        </div>
      )}
    </div>
  );
}