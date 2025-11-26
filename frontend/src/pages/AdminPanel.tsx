// src/pages/Admin.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';

interface TableData {
  users: any[];
  books: any[];
  copies: any[];
  loans: any[];
  reservations: any[];
  reviews: any[];
  notifications: any[];
}

export default function Admin() {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);

  // Проверяем права админа
  if (!user || !hasRole('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  // Загружаем данные таблиц
  const loadTableData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tables', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableData();
  }, []);

  // Компонент для отображения таблицы
  const DataTable = ({ data, title }: { data: any[], title: string }) => {
    if (!data || data.length === 0) {
      return <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>Нет данных</div>;
    }

    const columns = Object.keys(data[0]);

    return (
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '12px' }}>{title} ({data.length})</h3>
        <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {columns.map(column => (
                  <th key={column} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {columns.map(column => (
                    <td key={column} style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof row[column] === 'object' ? JSON.stringify(row[column]) : String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Панель управления</h1>
        <p style={{ color: '#6b7280' }}>Управление всеми данными системы</p>
      </div>

      {/* Навигация по табам */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Обзор данных' },
            { id: 'api-docs', label: 'API Документация' },
            { id: 'studio', label: 'Prisma Studio' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент табов */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Все данные системы</h2>
              <button 
                onClick={loadTableData}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка данных...</div>
            ) : tableData ? (
              <div>
                <DataTable data={tableData.users} title="Пользователи" />
                <DataTable data={tableData.books} title="Книги" />
                <DataTable data={tableData.copies} title="Экземпляры" />
                <DataTable data={tableData.loans} title="Выдачи" />
                <DataTable data={tableData.reservations} title="Бронирования" />
                <DataTable data={tableData.reviews} title="Отзывы" />
                <DataTable data={tableData.notifications} title="Уведомления" />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                Не удалось загрузить данные
              </div>
            )}
          </div>
        )}

        {activeTab === 'api-docs' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>API Документация</h2>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px' }}>
              <p style={{ marginBottom: '16px' }}>Полная документация API доступна по ссылке:</p>
              <a 
                href="/api/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}
              >
                Открыть Swagger UI
              </a>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Prisma Studio</h2>
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '24px' }}>
              <p style={{ marginBottom: '16px' }}>Для доступа к Prisma Studio выполните команду:</p>
              <div style={{ 
                background: '#1f2937', 
                color: '#f3f4f6', 
                padding: '16px', 
                borderRadius: '6px', 
                fontFamily: 'monospace',
                marginBottom: '16px'
              }}>
                npx prisma studio
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Prisma Studio запустится на http://localhost:5555 и предоставит полный визуальный доступ к базе данных.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}