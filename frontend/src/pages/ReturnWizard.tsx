// ReturnWizard.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { User, Book, Copy, Loan } from '../types';

type WizardStep = 'select-user' | 'select-loan' | 'confirm';

export function ReturnWizard() {
  const { addToast } = useToast();
  const [step, setStep] = useState<WizardStep>('select-user');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finePerDayCents, setFinePerDayCents] = useState<number>(10);

  console.log('[ReturnWizard] render', {
    step,
    selectedUserId: selectedUser?.id,
    selectedLoanId: selectedLoan?.id,
    finePerDayCents,
  });

  // Автоматическая навигация
  useEffect(() => {
    if (!selectedUser) setStep('select-user');
    else if (!selectedLoan) setStep('select-loan');
    else setStep('confirm');
  }, [selectedUser, selectedLoan]);

  // Загрузка активных займов пользователя
  useEffect(() => {
    if (!selectedUser) {
      setUserLoans([]);
      return;
    }

    const loadUserLoans = async () => {
      try {
        const loans = await api.get<Loan[]>(`/api/loans/active?userId=${selectedUser.id}`);
        setUserLoans(loans);
      } catch {
        setUserLoans([]);
        addToast('Ошибка загрузки займов', 'error');
      }
    };

    loadUserLoans();
  }, [selectedUser]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await api.get<{ loanPeriodDays: number; finePerDay: number }>('/api/config');
        console.log('[ReturnWizard] /api/config response', config);
        if (typeof config?.finePerDay === 'number') {
          setFinePerDayCents(config.finePerDay);
          console.log('[ReturnWizard] finePerDayCents set to', config.finePerDay);
        }
      } catch (err) {
        console.warn('[ReturnWizard] failed to load /api/config, using default fine 10', err);
      }
    };

    loadConfig();
  }, []);

  // Обработка возврата
  const handleReturn = async () => {
    if (!selectedUser || !selectedLoan) return;
    
    setSubmitting(true);
    try {
      await api.post(`/api/loans/${selectedLoan.id}/return`);
      
      addToast(`Книга возвращена пользователем ${selectedUser.name}`, 'success');
      
      // Сброс формы
      setSelectedUser(null);
      setSelectedLoan(null);
      setUserLoans([]);
      setStep('select-user');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка возврата книги';
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 32,
      position: 'relative'
    }}>
      {/* Индикатор шагов */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 32,
        maxWidth: 400,
        margin: '0 auto 32px'
      }}>
        {['select-user', 'select-loan', 'confirm'].map((s, index) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Круг с номером */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: step === s ? 'var(--primary)' : 
                        ['select-loan', 'confirm'].indexOf(s) <= ['select-loan', 'confirm'].indexOf(step) ? 
                        'var(--color-primary-100)' : 'var(--gray-200)',
              color: step === s ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 14,
              zIndex: 2,
              position: 'relative'
            }}>
              {index + 1}
            </div>
            
            {/* Линия между кругами (кроме последнего) */}
            {index < 2 && (
              <div style={{
                flex: 1,
                height: 2,
                background: ['select-loan', 'confirm'].indexOf(s) < ['select-loan', 'confirm'].indexOf(step) ? 
                          'var(--primary)' : 'var(--gray-200)',
                margin: '0 8px'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Подписи шагов */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        maxWidth: 400,
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Пользователь</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Шаг 1</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Активные займы</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Шаг 2</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Подтверждение</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Шаг 3</div>
        </div>
      </div>

      {/* Контент шагов */}
      <div>
        {/* Шаг 1: Выбор пользователя */}
        {step === 'select-user' && (
          <UserSearchStep
            selectedUser={selectedUser}
            onSelect={(user) => {
              setSelectedUser(user);
              setSelectedLoan(null);
            }}
          />
        )}

        {/* Шаг 2: Выбор займа для возврата */}
        {step === 'select-loan' && (
          <LoanSelectStep
            selectedUser={selectedUser}
            userLoans={userLoans}
            selectedLoan={selectedLoan}
            onSelectLoan={setSelectedLoan}
            onBack={() => {
              setSelectedUser(null);
              setUserLoans([]);
            }}
          />
        )}

        {/* Шаг 3: Подтверждение */}
        {step === 'confirm' && selectedLoan && (
          <ConfirmReturnStep
            user={selectedUser}
            loan={selectedLoan}
            onBack={() => setSelectedLoan(null)}
            onConfirm={handleReturn}
            submitting={submitting}
            finePerDayCents={finePerDayCents}
          />
        )}
      </div>
    </div>
  );
}

// --- Компоненты шагов ---

// Шаг 1: Поиск пользователя (можно переиспользовать из IssueWizard)
function UserSearchStep({ 
  selectedUser, 
  onSelect 
}: { 
  selectedUser: User | null;
  onSelect: (user: User) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const users = await api.get<User[]>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(users);
      setNotFound(users.length === 0);
    } catch {
      setSearchResults([]);
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: 'var(--text-primary)',
        marginBottom: 16
      }}>
        👤 Найти пользователя
      </h3>
      
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Введите email или имя пользователя для поиска активных займов
      </p>

      {/* Поисковая строка */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="ivan@mail.ru или Иван"
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
          onClick={handleSearch}
          disabled={searching}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: searching ? 'not-allowed' : 'pointer',
            opacity: searching ? 0.7 : 1
          }}
        >
          {searching ? '...' : 'Найти'}
        </button>
      </div>

      {/* Результаты поиска */}
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {searchResults.map(user => (
          <UserCard
            key={user.id}
            user={user}
            isSelected={selectedUser?.id === user.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      {searchResults.length === 0 && notFound && (
        <div style={{ 
          textAlign: 'center', 
          padding: 20, 
          color: 'var(--text-secondary)',
          fontSize: 14
        }}>
          Пользователи не найдены
        </div>
      )}

      {searchResults.length === 0 && !notFound && (
        <div style={{ 
          textAlign: 'center', 
          padding: 20, 
          color: 'var(--text-secondary)',
          fontSize: 14
        }}>
          Введите запрос для поиска пользователя
        </div>
      )}
    </div>
  );
}

// Карточка пользователя (можно переиспользовать)
function UserCard({ 
  user, 
  isSelected, 
  onSelect 
}: { 
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
}) {
  const cardStyle = {
    padding: 16,
    background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-body)',
    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
    borderRadius: 8,
    marginBottom: 8,
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return (
    <div
      onClick={() => onSelect(user)}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.backgroundColor = 'var(--gray-50)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.backgroundColor = 'var(--bg-body)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
            {user.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {user.email}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {user.role === 'READER' ? '👤 Читатель' : user.role === 'LIBRARIAN' ? '📚 Библиотекарь' : '⚙️ Админ'}
        </div>
      </div>
    </div>
  );
}

// Шаг 2: Выбор займа для возврата
// LoanSelectStep component
function LoanSelectStep({
    selectedUser,
    userLoans,
    selectedLoan,
    onSelectLoan,
    onBack
  }: {
    selectedUser: User | null;
    userLoans: Loan[];
    selectedLoan: Loan | null;
    onSelectLoan: (loan: Loan) => void;
    onBack: () => void;
  }) {
    // УДАЛИТЕ этот useEffect и состояние loadingDetails
  
    // Форматирование даты
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    };
  
    // Проверка просрочки
    const isOverdue = (dueDate: string) => {
      return new Date(dueDate) < new Date();
    };
  
    const backButtonStyle = {
      padding: '8px 16px',
      background: 'var(--gray-100)',
      color: 'var(--text-secondary)',
      border: 'none',
      borderRadius: 6,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    };
  
    const loanCardStyle = (isSelected: boolean, isOverdue: boolean) => ({
      padding: 16,
      background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-body)',
      border: `1px solid ${isSelected ? 'var(--primary)' : isOverdue ? 'var(--color-error)' : 'var(--border-light)'}`,
      borderRadius: 8,
      marginBottom: 8,
      cursor: 'pointer',
      transition: 'all 0.2s'
    });
  
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: 'var(--text-primary)'
          }}>
            📚 Активные займы
          </h3>
          
          <button
            onClick={onBack}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)';
            }}
          >
            ← Сменить пользователя
          </button>
        </div>
  
        {/* Информация о пользователе */}
        {selectedUser && (
          <div style={{ 
            background: 'var(--gray-50)', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 20,
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              👤 Пользователь
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {selectedUser.name}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {selectedUser.email}
            </div>
          </div>
        )}
  
        {/* Список займов */}
        {userLoans.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: 'var(--text-secondary)',
            fontSize: 14,
            background: 'var(--bg-body)',
            borderRadius: 8,
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Нет активных займов</div>
            <div>У пользователя нет книг для возврата</div>
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {userLoans.map(loan => {
              const overdue = isOverdue(loan.dueAt);
              
              return (
                <div
                  key={loan.id}
                  onClick={() => onSelectLoan(loan)}
                  style={loanCardStyle(selectedLoan?.id === loan.id, overdue)}
                  onMouseEnter={(e) => {
                    if (selectedLoan?.id !== loan.id) {
                      e.currentTarget.style.borderColor = overdue ? 'var(--color-error)' : 'var(--primary)';
                      e.currentTarget.style.backgroundColor = 'var(--gray-50)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLoan?.id !== loan.id) {
                      e.currentTarget.style.borderColor = overdue ? 'var(--color-error)' : 'var(--border-light)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-body)';
                    }
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    {loan.book ? (
                      <>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                          {loan.book.title}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {loan.book.author}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Информация о книге недоступна
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div>📅 Выдано: {formatDate(loan.issuedAt)}</div>
                      <div style={{ color: overdue ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                        ⏰ Вернуть до: {formatDate(loan.dueAt)}
                        {overdue && ' (ПРОСРОЧЕНО)'}
                      </div>
                    </div>
                    
                    {loan.copy && (
                      <div style={{ 
                        fontSize: 12, 
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }}>
                        📋 {loan.copy.barcode}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

// Шаг 3: Подтверждение возврата
function ConfirmReturnStep({
  user,
  loan,
  onBack,
  onConfirm,
  submitting,
  finePerDayCents
}: {
  user: User | null;
  loan: Loan;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  finePerDayCents: number;
}) {


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const overdueDays = isOverdue(loan.dueAt) ? calculateDaysOverdue(loan.dueAt) : 0;
  // Берём штраф из настроек (SystemConfig.finePerDay), либо 10 коп/день по умолчанию
  const perDay = finePerDayCents || 10;
  const estimatedFineCents = overdueDays * perDay;
  const estimatedFineRub = estimatedFineCents / 100;

  console.log('[ConfirmReturnStep] debug', {
    loanId: loan.id,
    loanDueAt: loan.dueAt,
    now: new Date().toISOString(),
    isOverdue: isOverdue(loan.dueAt),
    overdueDays,
    finePerDayCents,
    perDay,
    estimatedFineCents,
    estimatedFineRub,
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          ✅ Подтверждение возврата
        </h3>
        
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: 'var(--gray-100)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          ← Назад к выбору займа
        </button>
      </div>

      {/* Информационная панель */}
      <div style={{ 
        background: 'var(--gray-50)', 
        borderRadius: 8, 
        padding: 20,
        marginBottom: 24,
        border: '1px solid var(--border-light)'
      }}>
        {/* Пользователь */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            👤 Пользователь
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {user?.email}
          </div>
        </div>

        {loan.book ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {loan.book.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {loan.book.author}
          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Информация о книге недоступна
        </div>
      )}
      
      {/* И для копии: */}
      {loan.copy ? (
        <div style={{ 
          fontSize: 16, 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          fontFamily: 'monospace'
        }}>
          {loan.copy.barcode}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Информация об экземпляре недоступна
        </div>
      )}

        {/* Даты */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            📅 Даты выдачи
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Выдано</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(loan.issuedAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Срок возврата</div>
              <div style={{ 
                fontSize: 14, 
                fontWeight: 500,
                color: isOverdue(loan.dueAt) ? 'var(--color-error)' : 'var(--text-primary)'
              }}>
                {formatDate(loan.dueAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Статус просрочки */}
        {isOverdue(loan.dueAt) && (
          <div style={{ 
            background: 'var(--color-error-50)', 
            padding: 12,
            borderRadius: 6,
            border: '1px solid var(--color-error)',
            marginTop: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 20 }}>⚠️</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-error)' }}>
                  Книга просрочена
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Просрочено на {overdueDays} {overdueDays === 1 ? 'день' : overdueDays < 5 ? 'дня' : 'дней'}
                </div>
                {(
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Штраф: {estimatedFineRub.toFixed(2)} ₽
                  </div>
                )}
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onBack}
          disabled={submitting}
          style={{
            padding: '12px 24px',
            background: 'var(--gray-100)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          style={{
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? 'Возврат...' : '✅ Подтвердить возврат'}
        </button>
      </div>
    </div>
  );
}