import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Loan, AvailabilitySubscription , Tab } from '../types';
import { useNavigate } from 'react-router-dom';

// --- Типы ---


// --- Компонент табов ---
function TabNavigation({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: Tab[]; 
  activeTab: string; 
  onChange: (tabId: string) => void;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 1, 
      background: 'var(--gray-100)', 
      borderRadius: 8,
      padding: 4,
      marginBottom: 24
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === tab.id ? 'white' : 'transparent',
            border: 'none',
            borderRadius: 6,
            color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === tab.id ? 600 : 400,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 14,
            transition: 'all 0.2s',
            boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none'
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// --- Компонент карточки активного займа ---
function ActiveLoanCard({ loan }: { loan: Loan }) {
  const dueDate = new Date(loan.dueAt);
  const navigate = useNavigate();
  
 
  
  // Если по каким-то причинам связанный экземпляр отсутствует, просто не отображаем карточку
  if (!loan.copy || !loan.copy.book) {
    return null;
  }

  return (
    <div
      onClick={() => navigate(`/book/${loan.copy!.book.id}`)} 
      style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 4px 0'
          }}>
            {loan.copy.book.title}
          </h4>
          <p style={{ 
            fontSize: 14, 
            color: 'var(--text-secondary)',
            margin: '0 0 12px 0'
          }}>
            {loan.copy.book.author}
            {loan.copy.book.genre && (
              <span style={{ marginLeft: 8, color: 'var(--primary)' }}>
                • {loan.copy.book.genre}
              </span>
            )}
          </p>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* <div style={{
              padding: '4px 10px',
              background: getStatusColor(),
              color: 'white',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500
            }}>
              {getStatusText()}
            </div> */}
            
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              До {dueDate.toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'right',
          paddingLeft: 16,
          borderLeft: '1px solid var(--border-light)'
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Штрихкод
          </div>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            fontFamily: 'monospace'
          }}>
            {loan.copy.barcode}
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginTop: 16, 
        paddingTop: 16, 
        borderTop: '1px solid var(--border-light)',
        fontSize: 12,
        color: 'var(--text-secondary)'
      }}>
        📅 Взята {new Date(loan.issuedAt).toLocaleDateString('ru-RU')}
      </div>
    </div>
  );
}

// --- Компонент карточки подписки ---
function SubscriptionCard({ 
  subscription, 
  onUnsubscribe 
}: { 
  subscription: AvailabilitySubscription ; 
  onUnsubscribe: (id: number) => void;
}) {
	const navigate = useNavigate();
  return (
    <div 
	onClick={() => navigate(`/book/${subscription.book.id}`)}
	style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 4px 0'
          }}>
            {subscription.book.title}
          </h4>
          <p style={{ 
            fontSize: 14, 
            color: 'var(--text-secondary)',
            margin: '0 0 8px 0'
          }}>
            {subscription.book.author}
            {subscription.book.genre && (
              <span style={{ marginLeft: 8, color: 'var(--primary)' }}>
                • {subscription.book.genre}
              </span>
            )}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '2px 8px',
              background: 'var(--color-primary-50)',
              color: 'var(--primary)',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 500
            }}>
              🔔 Уведомления включены
            </span>
            
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Подписка с {new Date(subscription.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => onUnsubscribe(subscription.id)}
          style={{
            padding: '6px 12px',
            background: 'var(--gray-100)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-error)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = 'var(--color-error)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--gray-100)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }}
        >
          Отписаться
        </button>
      </div>
      
      <div style={{ 
        marginTop: 12,
        padding: 10,
        background: 'var(--gray-50)',
        borderRadius: 6,
        fontSize: 12,
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-light)'
      }}>
        📬 Вы получите уведомление, когда книга станет доступной
      </div>
    </div>
  );
}

// --- Компонент карточки истории ---
function HistoryCard({ loan }: { loan: Loan }) {
  const borrowedDate = new Date(loan.issuedAt);
  const returnedDate = loan.returnedAt ? new Date(loan.returnedAt) : null;
  const navigate = useNavigate();	

  if (!loan.copy || !loan.copy.book) {
    return null;
  }

  return (
    <div 
      onClick={() => navigate(`/book/${loan.copy!.book.id}`)}
      style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontSize: 15, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 2px 0'
          }}>
            {loan.copy.book.title}
          </h4>
          <p style={{ 
            fontSize: 13, 
            color: 'var(--text-secondary)',
            margin: '0 0 8px 0'
          }}>
            {loan.copy.book.author}
          </p>
          
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>📅 {borrowedDate.toLocaleDateString('ru-RU')}</span>
            <span>→</span>
            <span>📅 {returnedDate?.toLocaleDateString('ru-RU') || 'Не возвращена'}</span>
            {/* <span>•</span>
            <span>{daysHeld} дней</span> */}
          </div>
        </div>
        
        {(loan.fineCents !== null && loan.fineCents !== undefined && loan.fineCents > 0) && (
          <div style={{ 
            paddingLeft: 12,
            borderLeft: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-error)', marginBottom: 2 }}>
              Штраф
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-error)' }}>
              {(loan.fineCents / 100).toFixed(2)} руб
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Компонент пустого состояния ---
function EmptyState({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '60px 20px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}

// --- Основной компонент ---
const TABS: Tab[] = [
  { id: 'active', label: 'Активные', icon: '📚' },
  { id: 'waiting', label: 'Отслеживаются', icon: '🔔' },
  { id: 'history', label: 'История', icon: '📅' }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('active');
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AvailabilitySubscription []>([]);
  const [loanHistory, setLoanHistory] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        const [loansData, subsData] = await Promise.all([
          api.get<Loan[]>('/api/loans/my'),
          api.get<AvailabilitySubscription []>('/api/subscriptions')
        ]);
		console.log('Loans ответ:', loansData);
		console.log('Subs ответ:', subsData);
        // Разделяем займы на активные и историю
        const active = loansData.filter(loan => !loan.returnedAt);
        const history = loansData.filter(loan => loan.returnedAt);
        
        setActiveLoans(active);
        setLoanHistory(history);
        setSubscriptions(subsData.filter(sub => sub.isActive));
      } catch (err) {
        console.error('Ошибка загрузки:', err);
        addToast('Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, addToast]);

  // Отписка от уведомлений
  const handleUnsubscribe = async (subscriptionId: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (subscription) {
        await api.delete(`/api/subscriptions/${subscription.bookId}`);
        setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId));
        addToast('Вы отписались от уведомлений', 'success');
      }
    } catch (err) {
      console.error('Ошибка отписки:', err);
      addToast('Ошибка отписки', 'error');
    } finally {
    }
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 80, 
        color: 'var(--text-secondary)',
        fontSize: 14 
      }}>
        Загрузка ваших книг...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 40px' }}>
      <h1 style={{ 
        fontSize: 28, 
        fontWeight: 700, 
        color: 'var(--text-primary)',
        margin: '0 0 24px 0'
      }}>
        📋 Мои книги
      </h1>
      
      <TabNavigation 
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {/* Активные займы */}
      {activeTab === 'active' && (
        <div>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>📦</span>
            <span>Книги на руках ({activeLoans.length})</span>
          </h2>
          
          {activeLoans.length > 0 ? (
            activeLoans.map(loan => (
              <ActiveLoanCard key={loan.id} loan={loan} />
            ))
          ) : (
            <EmptyState 
              icon="📭"
              title="Нет активных займов"
              description="У вас нет книг на руках. Найдите интересную книгу в каталоге и возьмите её!"
            />
          )}
        </div>
      )}
      
      {/* Подписки */}
      {activeTab === 'waiting' && (
        <div>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>🔔</span>
            <span>Отслеживаемые книги ({subscriptions.length})</span>
          </h2>
          
          {subscriptions.length > 0 ? (
            subscriptions.map(sub => (
              <SubscriptionCard 
                key={sub.id} 
                subscription={sub} 
                onUnsubscribe={handleUnsubscribe}
              />
            ))
          ) : (
            <EmptyState 
              icon="🔕"
              title="Нет активных подписок"
              description="Вы не отслеживаете доступность книг. Подпишитесь на уведомления, чтобы узнать, когда интересующая книга станет доступной."
            />
          )}
        </div>
      )}
      
      {/* История */}
      {activeTab === 'history' && (
        <div>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>📚</span>
            <span>История чтения ({loanHistory.length})</span>
          </h2>
          
          {loanHistory.length > 0 ? (
            <div>
              {loanHistory.map(loan => (
                <HistoryCard key={loan.id} loan={loan} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon="📖"
              title="История пуста"
              description="Здесь появятся книги, которые вы уже прочитали и вернули в библиотеку."
            />
          )}
        </div>
      )}
    </div>
  );
}