// UserProfile.tsx
import { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { User, Loan } from '../types';

export function UserProfile() {
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    overdueLoans: 0,
    totalFines: 0
  });

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const users = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(users);
    } catch {
      addToast('Ошибка поиска пользователя', 'error');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLoans = async (userId: number) => {
    try {
      const loans = await api.get<Loan[]>(`/api/loans/active?userId=${userId}`);
      setUserLoans(loans);
      
      // Рассчитываем статистику
      const stats = {
        totalLoans: loans.length,
        activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
        overdueLoans: loans.filter(l => new Date(l.dueAt) < new Date()).length,
        totalFines: loans.reduce((sum, l) => sum + (l.fineCents || 0), 0) / 100
      };
      setUserStats(stats);
    } catch {
      addToast('Ошибка загрузки займов', 'error');
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadUserLoans(user.id);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 32
    }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>
        👤 Профиль пользователя
      </h2>

      {/* Поиск пользователя */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            placeholder="Email или имя пользователя..."
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              fontSize: 14,
              background: 'var(--bg-body)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            onClick={searchUsers}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '...' : 'Найти'}
          </button>
        </div>

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.map(user => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                style={{
                  padding: 12,
                  background: selectedUser?.id === user.id ? 'var(--ui-secondary-bg)' : 'var(--bg-body)',
                  border: `1px solid ${selectedUser?.id === user.id ? 'var(--primary)' : 'var(--border-light)'}`,
                  borderRadius: 6,
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {user.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Информация о пользователе */}
      {selectedUser && (
        <div>
          {/* Статистика */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 12,
            marginBottom: 24 
          }}>
            <div style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                {userStats.totalLoans}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Всего займов
              </div>
            </div>
            
            <div style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: userStats.activeLoans > 0 ? 'var(--color-warning)' : 'var(--text-secondary)',
                marginBottom: 4 
              }}>
                {userStats.activeLoans}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Активные
              </div>
            </div>
            
            <div style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: userStats.overdueLoans > 0 ? 'var(--color-error)' : 'var(--text-secondary)',
                marginBottom: 4 
              }}>
                {userStats.overdueLoans}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Просроченные
              </div>
            </div>
            
            <div style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: userStats.totalFines > 0 ? 'var(--color-error)' : 'var(--text-secondary)',
                marginBottom: 4 
              }}>
                {userStats.totalFines} ₽
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Штрафы
              </div>
            </div>
          </div>

          {/* Список активных займов */}
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            📋 Активные займы
          </h3>
          
          { userLoans.length === 0  && (
            <div style={{ 
              textAlign: 'center', 
              padding: 24, 
              color: 'var(--text-secondary)',
              fontSize: 14,
              background: 'var(--bg-body)',
              borderRadius: 8,
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div>У пользователя нет активных займов</div>
            </div>
                      )}            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {userLoans.map(loan => {
                const overdue = new Date(loan.dueAt) < new Date();
                
                return (
                  <div
                    key={loan.id}
                    style={{
                      padding: 16,
                      background: 'var(--bg-body)',
                      border: `1px solid ${overdue ? 'var(--color-error)' : 'var(--border-light)'}`,
                      borderRadius: 8,
                      marginBottom: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {loan.book?.title || 'Неизвестная книга'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          {loan.book?.author || 'Неизвестный автор'}
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        padding: '4px 8px',
                        background: overdue ? 'var(--color-error-50)' : 'var(--gray-100)',
                        color: overdue ? 'var(--color-error)' : 'var(--text-secondary)',
                        borderRadius: 4,
                        fontWeight: 500
                      }}>
                        {overdue ? 'ПРОСРОЧЕНО' : 'АКТИВНО'}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>Выдано</div>
                        <div>{new Date(loan.issuedAt).toLocaleDateString('ru-RU')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>Вернуть до</div>
                        <div style={{ color: overdue ? 'var(--color-error)' : 'var(--text-primary)' }}>
                          {new Date(loan.dueAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    
                    {false && (
                      <div style={{
                        marginTop: 8,
                        padding: 8,
                        background: 'var(--color-error-50)',
                        borderRadius: 4,
                        fontSize: 12,
                        color: 'var(--color-error)',
                        fontWeight: 500
                      }}>
                        {/* ⚠️ Штраф: {(loan.fineCents / 100).toFixed(2)} ₽ */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          
          {/* Блок статуса для выдачи книг */}
          <div style={{ marginTop: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              📋 Статус для выдачи книг
            </h4>
            
            {userStats.overdueLoans > 0 ? (
              <div style={{ color: 'var(--color-error)', fontWeight: 500 }}>
                ⚠️ Пользователю НЕЛЬЗЯ выдавать книги (есть просроченные займы)
              </div>
            ) : userStats.totalFines > 0 ? (
              <div style={{ color: 'var(--color-warning)', fontWeight: 500 }}>
                ⚠️ Есть неоплаченные штрафы. Рекомендуется сначала оплатить.
              </div>
            ) : (
              <div style={{ color: 'var(--color-success)', fontWeight: 500 }}>
                ✅ Пользователю можно выдавать книги
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}