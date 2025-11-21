import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

interface TableData {
  users: any[];
  books: any[];
  copies: any[];
  loans: any[];
  reservations: any[];
}

export default function AdminPanel() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState<TableData>({ users: [], books: [], copies: [], loans: [], reservations: [] });
  const [loading, setLoading] = useState(false);
  const [executeQuery, setExecuteQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);

  // Проверяем права админа
  if (!hasRole('ADMIN')) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Доступ запрещен</h2>
        <p>Требуются права администратора</p>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/admin/tables');
      setData(result as TableData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecute = async () => {
    try {
      const query = JSON.parse(executeQuery);
      const result = await api.post('/api/admin/execute', query);
      setQueryResult(result);
      await loadData(); // Обновляем данные после выполнения
    } catch (error) {
      setQueryResult({ error: error });
    }
  };

  const renderTable = (items: any[], columns: string[]) => {
    if (items.length === 0) return <p>Нет данных</p>;

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {columns.map(col => (
                <th key={col} style={{ padding: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                {columns.map(col => (
                  <td key={col} style={{ padding: '8px', border: '1px solid #e5e7eb' }}>
                    {typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Админ-панель базы данных</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={loadData} disabled={loading}>
          {loading ? 'Обновление...' : 'Обновить данные'}
        </button>
      </div>

      {/* Вкладки таблиц */}
      <div style={{ marginBottom: '20px' }}>
        {['users', 'books', 'copies', 'loans', 'reservations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              marginRight: '8px',
              background: activeTab === tab ? '#3b82f6' : '#e5e7eb',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Отображение таблиц */}
      <div style={{ marginBottom: '30px' }}>
        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
        {(() => {
          // Restrict tab types to valid keys, TypeScript-safe
          type TabName = keyof typeof data;
          const safeTab = activeTab as TabName;
          const tabData = data[safeTab] || [];
          return renderTable(tabData, Object.keys(tabData[0] || {}));
        })()}
      </div>

      {/* Прямое выполнение запросов */}
      <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px' }}>
        <h3>Прямое выполнение Prisma запросов</h3>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            value={executeQuery}
            onChange={(e) => setExecuteQuery(e.target.value)}
            placeholder={`Пример: {"model": "user", "action": "findMany", "where": {}}`}
            style={{ width: '100%', height: '100px', padding: '8px', fontFamily: 'monospace' }}
          />
        </div>
        <button onClick={handleExecute}>Выполнить</button>
        
        {queryResult && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f9fafb', borderRadius: '4px' }}>
            <pre>{JSON.stringify(queryResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}