// Dashboard.tsx - упрощенная версия
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

type DashboardStats = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalUsers: number;
  popularBooks: Array<any>;
  activeUsers: Array<any>;
};

type QuickStats = {
  totalBooks: number;
  activeLoans: number;
  overdueLoans: number;
  availableCopies: number;
  updatedAt: string;
};

export function LibrarianDashboard() {
  const { addToast } = useToast();
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [fullStats, setFullStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'quick' | 'full'>('quick');

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      const response = await api.get<QuickStats>('/api/dashboard/quick-stats');
      setQuickStats(response);
    } catch (error) {
      addToast('Ошибка загрузки статистики', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullStats = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardStats>('/api/dashboard/stats');
      setFullStats(response);
      setView('full');
    } catch (error) {
      addToast('Ошибка загрузки полной статистики', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quickStats) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 32 
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
          📊 Панель управления
        </h1>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              setView('quick');
              loadQuickStats();
            }}
            style={{
              padding: '10px 20px',
              background: view === 'quick' ? 'var(--primary)' : 'var(--ui-secondary-bg)',
              color: view === 'quick' ? 'white' : 'var(--ui-secondary-text)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>⚡</span> Быстрый просмотр
          </button>
          
          <button
            onClick={loadFullStats}
            style={{
              padding: '10px 20px',
              background: view === 'full' ? 'var(--primary)' : 'var(--ui-secondary-bg)',
              color: view === 'full' ? 'white' : 'var(--ui-secondary-text)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span>📈</span> Полная статистика
          </button>
        </div>
      </div>

      {view === 'quick' && quickStats && (
        <QuickStatsView stats={quickStats} onRefresh={loadQuickStats} />
      )}

      {view === 'full' && fullStats && (
        <FullStatsView stats={fullStats} onRefresh={loadFullStats} />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Загрузка данных...
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент быстрой статистики
function QuickStatsView({ stats, onRefresh }: { stats: QuickStats; onRefresh: () => void }) {
  const metrics = [
    { title: 'Всего книг', value: stats.totalBooks, icon: '📚', color: 'var(--color-primary-500)' },
    { title: 'Доступно сейчас', value: stats.availableCopies, icon: '✅', color: 'var(--color-success)' },
    { title: 'Выдано', value: stats.activeLoans, icon: '📖', color: 'var(--color-warning)' },
    { title: 'Просрочено', value: stats.overdueLoans, icon: '⏰', color: 'var(--color-error)' },
  ];

  return (
    <div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              padding: 24,
              transition: 'all 0.2s',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: 'var(--shadow-md)'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {metric.title}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {metric.value.toLocaleString('ru-RU')}
                </div>
              </div>
              
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: metric.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24
              }}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        background: 'var(--bg-card)', 
        padding: 20, 
        borderRadius: 12, 
        border: '1px solid var(--border-light)',
        marginBottom: 24
      }}>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Обновлено: {new Date(stats.updatedAt).toLocaleString('ru-RU')}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onRefresh}
          style={{
            padding: '10px 24px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>🔄</span> Обновить
        </button>
      </div>
    </div>
  );
}

// Компонент полной статистики
function FullStatsView({ stats, onRefresh }: { stats: DashboardStats; onRefresh: () => void }) {
  const mainMetrics = [
    { title: 'Книг в каталоге', value: stats.totalBooks, icon: '📚', color: 'var(--color-primary-500)' },
    { title: 'Всего экземпляров', value: stats.totalCopies, icon: '📦', color: 'var(--color-primary-400)' },
    { title: 'Доступно', value: stats.availableCopies, icon: '✅', color: 'var(--color-success)' },
    { title: 'Активные займы', value: stats.activeLoans, icon: '📖', color: 'var(--color-warning)' },
    { title: 'Просрочено', value: stats.overdueLoans, icon: '⏰', color: 'var(--color-error)' },
    { title: 'Пользователей', value: stats.totalUsers, icon: '👥', color: 'var(--color-info)' },
  ];

  return (
    <div>
      {/* Основные метрики */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        {mainMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Популярные книги и активные пользователи */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 24,
        '@media (max-width: 1024px)': { gridTemplateColumns: '1fr' }
      }}>
        <ListSection
          title="📈 Популярные книги"
          items={stats.popularBooks}
          renderItem={(book) => (
            <>
              <div style={{ fontWeight: 500 }}>{book.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{book.author}</div>
            </>
          )}
          valueKey="loanCount"
          valueSuffix="раз"
        />

        <ListSection
          title="🏆 Активные читатели"
          items={stats.activeUsers}
          renderItem={(user) => (
            <>
              <div style={{ fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
            </>
          )}
          valueKey="loanCount"
          valueSuffix="книг"
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          onClick={onRefresh}
          style={{
            padding: '10px 24px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>🔄</span> Обновить статистику
        </button>
      </div>
    </div>
  );
}

// Компонент карточки метрики
function MetricCard({ title, value, icon, color }: any) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 24,
      transition: 'all 0.2s',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: 'var(--shadow-md)'
      }
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
            {value.toLocaleString('ru-RU')}
          </div>
        </div>
        
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Компонент списка
function ListSection({ title, items, renderItem, valueKey, valueSuffix }: any) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 24
    }}>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
        {title}
      </h3>
      
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
          Нет данных
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.slice(0, 5).map((item: any, index: number) => (
            <div
              key={item.id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-body)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: 'var(--primary)',
                  background: 'var(--ui-card-hover)'
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: index === 0 ? 'var(--color-warning)' : 
                            index === 1 ? 'var(--color-gray-400)' : 
                            index === 2 ? 'var(--color-primary-300)' : 'var(--ui-secondary-bg)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  {renderItem(item)}
                </div>
              </div>
              
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                {item[valueKey]} {valueSuffix}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}