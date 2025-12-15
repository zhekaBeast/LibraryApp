import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { IssueWizard } from './IssueWizard';
import { ReturnWizard } from './ReturnWizard';
import { BookManagement } from './BookManagement';
import { UserProfile } from './UserProfile';
import { LibrarianDashboard } from './LibrarianDashboard';

type LibrarianTab = 'issue' | 'return' | 'manage' | 'stats'  | 'users';

export default function LibrarianPanel() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<LibrarianTab>('users');
  
  // Проверяем права
  if (!hasRole('LIBRARIAN', 'ADMIN')) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-error)' }}>Доступ запрещён</h2>
        <p>Только библиотекари и администраторы имеют доступ к этой панели.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>
      {/* Заголовок */}
      <div>
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: 'var(--text-primary)',
          margin: 0
        }}>
          🛠️ Панель библиотекаря
        </h1>
        <p style={{ 
          fontSize: 14, 
          color: 'var(--text-secondary)',
          marginTop: 4
        }}>
          Управление выдачей, приёмом и каталогом книг
        </p>
      </div>

      {/* Быстрые метрики */}
      {/* <QuickStats /> */}

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Основной контент */}
        <div style={{ flex: 1 }}>
          {/* Табы навигации */}
          <div style={{ 
            display: 'flex', 
            gap: 1, 
            background: 'var(--gray-100)', 
            borderRadius: 8,
            padding: 4,
            marginBottom: 24
          }}>
            <TabButton 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')}
              icon="👤"
              label="Пользователи"
            />
            <TabButton 
              active={activeTab === 'issue'} 
              onClick={() => setActiveTab('issue')}
              icon="📤"
              label="Выдача книг"
            />
            <TabButton 
              active={activeTab === 'return'} 
              onClick={() => setActiveTab('return')}
              icon="📥"
              label="Приём книг"
            />
            <TabButton 
              active={activeTab === 'manage'} 
              onClick={() => setActiveTab('manage')}
              icon="📚"
              label="Управление книгами"
            />
            <TabButton 
              active={activeTab === 'stats'} 
              onClick={() => setActiveTab('stats')}
              icon="📊"
              label="Статистика"
            />
            
          </div>

          {/* Контент табов */}
          <div>
            {activeTab === 'issue' && <IssueWizard />}
            {activeTab === 'return' && <ReturnWizard />}
            {activeTab === 'manage' && <BookManagement />}
            {activeTab === 'users' && <UserProfile />}
            {activeTab === 'stats' && <LibrarianDashboard />}
          </div>
        </div>

        {/* Сайдбар с уведомлениями */}
        {/* <NotificationsSidebar /> */}
      </div>
    </div>
  );
}

// Компонент кнопки таба
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        background: active ? 'white' : 'transparent',
        border: 'none',
        borderRadius: 6,
        color: active ? 'var(--primary)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 14,
        transition: 'all 0.2s',
        boxShadow: active ? 'var(--shadow-sm)' : 'none'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// // Заглушка для статистики
// function StatisticsPanel() {
//   return (
//     <div style={{ 
//       padding: 40, 
//       textAlign: 'center',
//       background: 'var(--bg-card)',
//       borderRadius: 12,
//       border: '1px solid var(--border-light)'
//     }}>
//       <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
//       <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
//         Статистика в разработке
//       </h3>
//       <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
//         Здесь будут графики и аналитика по работе библиотеки
//       </p>
//     </div>
//   );
// }