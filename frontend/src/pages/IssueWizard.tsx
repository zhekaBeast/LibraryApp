// IssueWizard.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { User, Book, Copy, Loan } from '../types';

type WizardStep = 'select-user' | 'select-book' | 'confirm';

export function IssueWizard() {
  const { addToast } = useToast();
  const [step, setStep] = useState<WizardStep>('select-user');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(null);
  const [dueDays, setDueDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);

  // Автоматическая навигация
  useEffect(() => {
    if (!selectedUser) setStep('select-user');
    else if (!selectedCopy) setStep('select-book');
    else setStep('confirm');
  }, [selectedUser, selectedCopy]);

  // Обработка выдачи
  const handleIssue = async () => {
    if (!selectedUser || !selectedBook || !selectedCopy) return;
    
    setSubmitting(true);
    try {
        const userLoans = await api.get<Loan[]>(`/api/loans/active?userId=${selectedUser.id}`);
        const overdueLoans = userLoans.filter(loan => new Date(loan.dueAt) < new Date());
        
        if (overdueLoans.length > 0) {
        addToast('У пользователя есть просроченные займы. Выдача невозможна.', 'error');
        return;
        }
        const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + dueDays);
      
      await api.post('/api/loans/issue', {
        userId: selectedUser.id,
        copyId: selectedCopy.id,
        dueAt: dueAt.toISOString()
      });
      
      addToast(`Книга выдана пользователю ${selectedUser.name}`, 'success');
      
      // Сброс формы
      setSelectedUser(null);
      setSelectedBook(null);
      setSelectedCopy(null);
      setDueDays(14);
      setStep('select-user');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка выдачи книги';
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
        {['select-user', 'select-book', 'confirm'].map((s, index) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Круг с номером */}
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: step === s ? 'var(--primary)' : 
                        ['select-book', 'confirm'].indexOf(s) <= ['select-book', 'confirm'].indexOf(step) ? 
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
                background: ['select-book', 'confirm'].indexOf(s) < ['select-book', 'confirm'].indexOf(step) ? 
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
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Книга</div>
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
            onSelect={setSelectedUser}
          />
        )}

        {/* Шаг 2: Выбор книги */}
        {step === 'select-book' && (
          <BookSearchStep
            selectedBook={selectedBook}
            selectedCopy={selectedCopy}
            onSelectBook={setSelectedBook}
            onSelectCopy={setSelectedCopy}
            onBack={() => setSelectedUser(null)}
          />
        )}

        {/* Шаг 3: Подтверждение */}
        {step === 'confirm' && (
          <ConfirmStep
            user={selectedUser}
            book={selectedBook}
            copy={selectedCopy}
            dueDays={dueDays}
            onDueDaysChange={setDueDays}
            onBack={() => setSelectedBook(null)}
            onConfirm={handleIssue}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

// --- Компоненты шагов ---

// Шаг 1: Поиск пользователя
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
    } catch {
      setSearchResults([]);
    } finally {
        if(searchResults.length === 0)
            setNotFound(true)
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
        Введите email или логин пользователя
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

// Карточка пользователя
function UserCard({ 
  user, 
  isSelected, 
  onSelect 
}: { 
  user: User;
  isSelected: boolean;
  onSelect: (user: User) => void;
}) {
  // TODO: Загрузить доп информацию о пользователе (количество активных займов и т.д.)
  
  return (
    <div
      onClick={() => onSelect(user)}
      style={{
        padding: 16,
        background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-body)',
        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
        borderRadius: 8,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.2s'
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

// Шаг 2: Поиск книги
function BookSearchStep({ 
    selectedBook,
    selectedCopy,
    onSelectBook, 
    onSelectCopy,
    onBack
  }: { 
    selectedBook: Book | null;
    selectedCopy: Copy | null;
    onSelectBook: (book: Book | null) => void;
    onSelectCopy: (copy: Copy | null) => void; 
    onBack: () => void;
  }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [bookCopies, setBookCopies] = useState<Copy[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
  
    // Загружаем все книги при монтировании
    useEffect(() => {
      const loadAllBooks = async () => {
        try {
          const books = await api.get<Book[]>('/api/books');
          setAllBooks(books);
          setFilteredBooks(books);
        } catch {
          setAllBooks([]);
          setFilteredBooks([]);
        } finally {
          setLoadingBooks(false);
        }
      };
      loadAllBooks();
    }, []);
  
    // Фильтруем книги при изменении поискового запроса
    useEffect(() => {
      if (!searchQuery.trim()) {
        setFilteredBooks(allBooks);
        setHasSearched(false);
        return;
      }
      
      const query = searchQuery.toLowerCase().trim();
      
      const filtered = allBooks.filter((book: Book) => 
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        (book.isbn && book.isbn.toLowerCase().includes(query))
      );
      
      setFilteredBooks(filtered);
      setHasSearched(true);
    }, [searchQuery, allBooks]);
  
    // Загрузка копий книги при выборе
    useEffect(() => {
      if (!selectedBook) {
        setBookCopies([]);
        return;
      }
  
      const loadCopies = async () => {
        try {
          const copies = await api.get<Copy[]>(`/api/copies/${selectedBook.id}`);
          setBookCopies(copies.filter(c => c.status === 'AVAILABLE'));
        } catch {
          setBookCopies([]);
        }
      };
  
      loadCopies();
    }, [selectedBook]);
  
    // Обработчик ручного поиска (по Enter или кнопке)
    const handleSearch = () => {
      if (searchQuery.trim()) {
        setHasSearched(true);
      }
    };
  
    // Создаем стили для hover эффектов
    const backButtonStyle = {
      padding: '8px 16px',
      background: 'var(--ui-secondary-bg)',
      color: 'var(--text-secondary)',
      border: 'none',
      borderRadius: 6,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    };
  
    const changeBookButtonStyle = {
      padding: '6px 12px',
      background: 'var(--ui-secondary-bg)',
      color: 'var(--text-secondary)',
      border: 'none',
      borderRadius: 6,
      fontSize: 13,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    };
  
    const copyCardStyle = (isSelected: boolean) => ({
      padding: 12,
      background: isSelected ? 'var(--color-primary-50)' : 'var(--bg-body)',
      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
      borderRadius: 6,
      cursor: 'pointer',
      transition: 'all 0.2s',
    });
  
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            color: 'var(--text-primary)'
          }}>
            📚 Найти книгу
          </h3>
          
          <button
            onClick={onBack}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-200)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--ui-secondary-bg)';
            }}
          >
            ← Сменить пользователя
          </button>
        </div>
  
        {/* Поисковая строка */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Название книги, автор или ISBN"
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              fontSize: 14,
              background: 'var(--bg-body)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
  
        {/* Состояния загрузки */}
        {loadingBooks && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: 'var(--text-secondary)',
            fontSize: 14
          }}>
            Загрузка книг...
          </div>
        )}

        {/* РЕЗУЛЬТАТЫ ПОИСКА (книги) */}
        {!selectedBook && !loadingBooks && allBooks.length > 0 && (
          <div>
            {/* Информация о количестве */}
            <div style={{ 
              fontSize: 13, 
              color: 'var(--text-secondary)', 
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                {searchQuery.trim() && hasSearched 
                  ? `Найдено книг: ${filteredBooks.length} из ${allBooks.length}`
                  : `Всего книг: ${allBooks.length}`
                }
              </span>
            </div>
  
            {/* Список книг */}
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book, index) => (
                  <BookCard
                    key={index}
                    book={book}
                    isSelected={selectedBook === book}
                    onSelect={onSelectBook} // Выбираем книгу
                  />
                ))
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 40, 
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  background: 'var(--bg-body)',
                  borderRadius: 8,
                  border: '1px solid var(--border-light)'
                }}>
                  {hasSearched ? (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>Книги не найдены</div>
                      <div>Попробуйте изменить поисковый запрос</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
                      <div>Начните вводить название книги, автора или ISBN</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
  
        {/* ВЫБРАННАЯ КНИГА И ВЫБОР КОПИЙ */}
        {selectedBook && !loadingBooks && (
          <div>
            {/* Выбранная книга */}
            <div style={{ 
              padding: 16, 
              background: 'var(--color-primary)',
              border: '1px solid var(--primary)',
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>
                    {selectedBook.title}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {selectedBook.author} {selectedBook.year && `• ${selectedBook.year}`}
                  </div>
                  {selectedBook.isbn && (
                    <div style={{ 
                      fontSize: 12, 
                      color: 'var(--text-secondary)', 
                      marginTop: 2,
                      fontFamily: 'monospace, Consolas, Monaco, "Courier New", monospace'
                    }}>
                      ISBN: {selectedBook.isbn}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    onSelectBook(null);
                    onSelectCopy(null);
                  }}
                  style={changeBookButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-200)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--ui-secondary-bg)';
                  }}
                >
                  Сменить книгу
                </button>
              </div>
            </div>
  
            {/* Выбор копии */}
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Доступные экземпляры ({bookCopies.length})
            </h4>
            
            {bookCopies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bookCopies.map((copy) => (
                  <div
                    key={copy.id}
                    onClick={() => onSelectCopy(copy)} // ВАЖНО: Выбираем копию здесь!
                    style={copyCardStyle(selectedCopy?.id === copy.id)}
                    onMouseEnter={(e) => {
                      if (selectedCopy?.id !== copy.id) {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'var(--primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCopy?.id !== copy.id) {
                        e.currentTarget.style.borderColor = selectedCopy?.id === copy.id 
                          ? 'var(--primary)' 
                          : 'var(--border-light)';
                        e.currentTarget.style.backgroundColor = selectedCopy?.id === copy.id 
                          ? 'var(--color-primary-50)' 
                          : 'var(--bg-body)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 14 }}>
                        Экземпляр #{copy.barcode}
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: 40, 
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 14,
                background: 'var(--bg-body)',
                borderRadius: 8,
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📖</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Нет доступных экземпляров</div>
                <div>Все экземпляры этой книги в данный момент выданы</div>
              </div>
            )}
          </div>
        )}
  
        {/* Пустая библиотека */}
        {!loadingBooks && allBooks.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: 'var(--text-secondary)',
            fontSize: 14,
            background: 'var(--bg-body)',
            borderRadius: 8,
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Библиотека пуста</div>
            <div>Добавьте книги в систему</div>
          </div>
        )}
      </div>
    );
  }

  // Карточка книги
function BookCard({ 
    book, 
    isSelected, 
    onSelect 
  }: { 
    book: Book;
    isSelected: boolean;
    onSelect: (book: Book) => void;
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
        onClick={() => onSelect(book)}
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
              {book.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {book.author} {book.year && `• ${book.year}`}
            </div>
          </div>
          {book.isbn && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {book.isbn}
            </div>
          )}
        </div>
      </div>
    );
  }
// Шаг 3: Подтверждение
function ConfirmStep({
  user,
  book,
  copy,
  dueDays,
  onDueDaysChange,
  onBack,
  onConfirm,
  submitting
}: {
  user: User | null;
  book: Book | null;
  copy: Copy | null;
  dueDays: number;
  onDueDaysChange: (days: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!user || !book || !copy) return null;

  const calculateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + dueDays);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          ✅ Подтверждение выдачи
        </h3>
        
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: 'var(--ui-secondary-bg)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          ← Назад к выбору книги
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
            {user.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {user.email}
          </div>
        </div>

        {/* Книга */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            📚 Книга
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {book.title}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {book.author} {book.year && `• ${book.year}`}
          </div>
        </div>

        {/* Экземпляр */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            🏷️ Экземпляр
          </div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            fontFamily: 'monospace'
          }}>
            {copy.barcode}
          </div>
        </div>

        {/* Срок выдачи */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            📅 Срок выдачи
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select
              value={dueDays}
              onChange={(e) => onDueDaysChange(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-light)',
                borderRadius: 6,
                background: 'var(--bg-body)',
                color: 'var(--text-primary)',
                fontSize: 14
              }}
            >
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
              <option value={21}>21 день</option>
              <option value={30}>30 дней</option>
            </select>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              <strong>Вернуть до:</strong> {calculateDueDate()}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onBack}
          disabled={submitting}
          style={{
            padding: '12px 24px',
            background: 'var(--ui-secondary-bg)',
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
          {submitting ? 'Выдача...' : '✅ Выдать книгу'}
        </button>
      </div>
    </div>
  );
}