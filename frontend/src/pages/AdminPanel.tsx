// src/pages/AdminPanel.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import { api } from '../lib/api';

const MODELS = [
  { name: 'User', label: 'Пользователи', fields: ['id', 'email', 'name', 'role'] },
  { name: 'Book', label: 'Книги', fields: ['id', 'title', 'author', 'isbn', 'genre'] },
  { name: 'BookCopy', label: 'Копии', fields: ['id', 'bookId', 'barcode', 'status'] },
  { name: 'Loan', label: 'Выдачи', fields: ['id', 'userId', 'copyId', 'status'] },
  { name: 'Notification', label: 'Уведомления', fields: ['id', 'userId', 'title', 'isRead'] },
  { name: 'AvailabilitySubscription', label: 'Подписки', fields: ['id', 'userId', 'bookId', 'isActive'] },
  { name: 'SystemConfig', label: 'Конфигурация', fields: ['id', 'loanPeriodDays', 'finePerDay'] },
];

export default function AdminPanel() {
  const { user, hasRole } = useAuth();
  const [activeModel, setActiveModel] = useState('User');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<any>({});
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });

  if (!user || !hasRole('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/${activeModel}?page=${page}&limit=${pagination.limit}`);
      setData(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeModel]);

  const handleEdit = (row: any) => {
    setEditingRow(row.id);
    setEditForm({ ...row });
  };

  const handleSave = async () => {
    if (!editingRow) return;
    
    try {
      await api.put(`/api/admin/${activeModel}/${editingRow}`, editForm);
      await loadData(pagination.page);
      setEditingRow(null);
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить запись?')) return;
    
    try {
      await api.delete(`/api/admin/${activeModel}/${id}`);
      await loadData(pagination.page);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post(`/api/admin/${activeModel}`, newItem);
      await loadData(pagination.page);
      setIsCreating(false);
      setNewItem({});
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  const currentModel = MODELS.find(m => m.name === activeModel);

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto',
      padding: '24px'
    }}>
      {/* Заголовок */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '8px',
          color: 'var(--text-primary)' 
        }}>
          Админ-панель
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Управление всеми данными системы
        </p>
      </div>
      <a 
        href="/api/docs" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          background: 'var(--primary)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        📚 Прямой доступ к апи
      </a>
      {/* Навигация по моделям */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        flexWrap: 'wrap',
        marginBottom: '24px',
        paddingBottom: '16px',
        paddingTop: '16px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {MODELS.map(model => (
          <button
            key={model.name}
            onClick={() => setActiveModel(model.name)}
            style={{
              padding: '8px 16px',
              background: activeModel === model.name 
                ? 'var(--primary)' 
                : 'var(--bg-card)',
              color: activeModel === model.name 
                ? 'white' 
                : 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {model.label}
          </button>
        ))}
      </div>

      {/* Панель управления */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          color: 'var(--text-primary)'
        }}>
          {currentModel?.label} ({pagination.total} записей)
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '8px 16px',
              background: 'var(--color-green-600)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + Добавить
          </button>
          
          <button
            onClick={() => loadData()}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {loading ? '🔄' : 'Обновить'}
          </button>
        </div>
      </div>

      {/* Форма создания */}
      {isCreating && (
        <div style={{
          background: 'var(--color-blue-50)',
          border: '1px solid var(--color-blue-200)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
            Создание новой записи
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {currentModel?.fields.map(field => (
              <div key={field}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}>
                  {field}
                </label>
                <input
                  type="text"
                  value={newItem[field] || ''}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    [field]: e.target.value
                  })}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    background: 'white',
                    minWidth: '150px'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={handleCreate}
              style={{
                padding: '8px 16px',
                background: 'var(--color-green-600)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Сохранить
            </button>
            <button
              onClick={() => setIsCreating(false)}
              style={{
                padding: '8px 16px',
                background: 'var(--color-gray-300)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Таблица данных */}
      <div style={{
        overflowX: 'auto',
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'var(--text-secondary)'
          }}>
            Загрузка данных...
          </div>
        ) : (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{ 
                background: 'var(--ui-secondary-bg)',
                borderBottom: '2px solid var(--border-light)'
              }}>
                {currentModel?.fields.map(field => (
                  <th key={field} style={{ 
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                  }}>
                    {field}
                  </th>
                ))}
                <th style={{ padding: '16px 12px', width: '120px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} style={{ 
                  borderBottom: '1px solid var(--border-light)',
                  background: editingRow === row.id 
                    ? 'var(--color-blue-50)' 
                    : 'transparent'
                }}>
                  {currentModel?.fields.map(field => (
                    <td key={field} style={{ 
                      padding: '12px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {editingRow === row.id ? (
                        <input
                          type="text"
                          value={editForm[field] || ''}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            [field]: e.target.value
                          })}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            background: 'white'
                          }}
                        />
                      ) : (
                        typeof row[field] === 'object' 
                          ? JSON.stringify(row[field])
                          : String(row[field] || '—')
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '12px' }}>
                    {editingRow === row.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleSave}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-green-600)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          💾
                        </button>
                        <button
                          onClick={() => setEditingRow(null)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-gray-300)',
                            color: 'var(--text-primary)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(row)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-blue-100)',
                            color: 'var(--color-blue-700)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--color-red-100)',
                            color: 'var(--color-red-700)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {pagination.pages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '16px',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <button
            onClick={() => {
              if (pagination.page > 1) {
                loadData(pagination.page - 1);
              }
            }}
            disabled={pagination.page === 1}
            style={{
              padding: '8px 16px',
              background: pagination.page === 1 
                ? 'var(--color-gray-200)' 
                : 'var(--primary)',
              color: pagination.page === 1 
                ? 'var(--text-secondary)' 
                : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Назад
          </button>
          
          <span style={{ color: 'var(--text-secondary)' }}>
            Страница {pagination.page} из {pagination.pages}
          </span>
          
          <button
            onClick={() => {
              if (pagination.page < pagination.pages) {
                loadData(pagination.page + 1);
              }
            }}
            disabled={pagination.page === pagination.pages}
            style={{
              padding: '8px 16px',
              background: pagination.page === pagination.pages 
                ? 'var(--color-gray-200)' 
                : 'var(--primary)',
              color: pagination.page === pagination.pages 
                ? 'var(--text-secondary)' 
                : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
            }}
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
}