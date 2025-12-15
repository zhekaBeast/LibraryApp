// BookManagement.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { Book, Copy } from '../types';

export function BookManagement() {
  const { addToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    year: '',
    description: ''
  });

  const [copies, setCopies] = useState<Record<number, Copy[]>>({}); // {bookId: Copy[]}
  const [loadingCopies, setLoadingCopies] = useState<Record<number, boolean>>({});
  const [addingCopy, setAddingCopy] = useState<number | null>(null);

  // Загрузка книг
  const loadBooks = async () => {
    setLoading(true);
    try {
      const data = await api.get<Book[]>('/api/books');
      setBooks(data);
    } catch {
      addToast('Ошибка загрузки книг', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка копий для конкретной книги
  const loadCopies = async (bookId: number) => {
    setLoadingCopies(prev => ({ ...prev, [bookId]: true }));
    try {
      const data = await api.get<Copy[]>(`/api/copies/${bookId}`);
      setCopies(prev => ({ ...prev, [bookId]: data }));
    } catch {
      addToast('Ошибка загрузки экземпляров', 'error');
    } finally {
      setLoadingCopies(prev => ({ ...prev, [bookId]: false }));
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Сброс формы
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      genre: '',
      year: '',
      description: ''
    });
    setEditingBook(null);
    setShowForm(false);
  };

  // Заполнение формы для редактирования
  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      genre: book.genre || '',
      year: book.year?.toString() || '',
      description: book.description || ''
    });
    setShowForm(true);
    
    // Загружаем копии при редактировании
    if (!copies[book.id]) {
      loadCopies(book.id);
    }
  };

  // Добавление копии
  const handleAddCopy = async (bookId: number) => {
    setAddingCopy(bookId);
    try {
      const newCopy = await api.post<Copy>('/api/copies', { bookId });
      
      setCopies(prev => ({
        ...prev,
        [bookId]: [...(prev[bookId] || []), newCopy]
      }));
      
      if (window.confirm(`📖 Экземпляр добавлен успешно!\n\nШтрихкод: ${newCopy.barcode}\n\nНе забудьте:\n1️⃣ Напечатать и приклеить штрихкод на книгу\n2️⃣ Внести номер в инвентарную книгу\n\nОК - понятно`)) {
        console.log('Персонал подтвердил процедуру добавления книги');
      }
    } catch {
      addToast('Ошибка добавления', 'error');
    } finally {
      setAddingCopy(null);
    }
  };

  // Удаление копии
  const handleDeleteCopy = async (bookId: number, copyId: number) => {
    try {
      await api.delete(`/api/copies/${copyId}`);
      setCopies(prev => ({
        ...prev,
        [bookId]: (prev[bookId] || []).filter(c => c.id !== copyId)
      }));
      addToast('Экземпляр удален', 'success');
    } catch {
      addToast('Нельзя удалить выданную копию', 'error');
    }
  };

  // Сохранение книги (создание или обновление)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      addToast('Заполните обязательные поля', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        genre: formData.genre || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        description: formData.description || undefined
      };

      if (editingBook) {
        // Обновление существующей книги
        const updatedBook = await api.put<Book>(`/api/books/${editingBook.id}`, data);
        addToast(`Книга "${updatedBook.title}" обновлена`, 'success');
        setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
      } else {
        // Создание новой книги
        const newBook = await api.post<Book>('/api/books', data);
        addToast(`Книга "${newBook.title}" создана`, 'success');
        setBooks([newBook, ...books]);
      }
      
      resetForm();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка сохранения книги';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Удаление книги
  const handleDelete = async (bookId: number, bookTitle: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить книгу "${bookTitle}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/api/books/${bookId}`);
      addToast(`Книга "${bookTitle}" удалена`, 'success');
      setBooks(books.filter(b => b.id !== bookId));
      
      // Удаляем копии из состояния
      setCopies(prev => {
        const newCopies = { ...prev };
        delete newCopies[bookId];
        return newCopies;
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Ошибка удаления книги';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 32
    }}>
      {/* Заголовок и кнопки */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
          📚 Управление книгами ({books.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>➕</span>
          <span>Добавить книгу</span>
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && editingBook && (
        <EditBookForm
          formData={formData}
          setFormData={setFormData}
          copies={copies[editingBook.id] || []}
          loadingCopies={loadingCopies[editingBook.id]}
          addingCopy={addingCopy === editingBook.id}
          onClose={resetForm}
          onSave={handleSave}
          onAddCopy={() => handleAddCopy(editingBook.id)}
          onDeleteCopy={(copyId) => handleDeleteCopy(editingBook.id, copyId)}
          loading={loading}
        />
      )}

      {showForm && !editingBook && (
        <CreateBookForm
          formData={formData}
          setFormData={setFormData}
          onClose={resetForm}
          onSave={handleSave}
          loading={loading}
        />
      )}

      {/* Список книг */}
      {loading && !showForm ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Загрузка книг...
          </div>
        </div>
      ) : books.length === 0 ? (
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
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Книги не найдены</div>
          <div>Нажмите "Добавить книгу" чтобы создать первую книгу</div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: 16 
        }}>
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              copies={copies[book.id] || []}
              loadingCopies={loadingCopies[book.id]}
              addingCopy={addingCopy === book.id}
              onEdit={() => handleEdit(book)}
              onDelete={() => handleDelete(book.id, book.title)}
              onAddCopy={() => handleAddCopy(book.id)}
              onDeleteCopy={(copyId) => handleDeleteCopy(book.id, copyId)}
              onLoadCopies={() => !copies[book.id] && loadCopies(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент карточки книги
function BookCard({
  book,
  copies,
  loadingCopies,
  addingCopy,
  onEdit,
  onDelete,
  onAddCopy,
  onDeleteCopy,
  onLoadCopies
}: {
  book: Book;
  copies: Copy[];
  loadingCopies?: boolean;
  addingCopy?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddCopy: () => void;
  onDeleteCopy: (copyId: number) => void;
  onLoadCopies: () => void;
}) {
  const [showCopies, setShowCopies] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-body)',
      border: '1px solid var(--border-light)',
      borderRadius: 8,
      padding: 16,
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      {/* Кнопки действий */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={onEdit}
          style={{
            padding: '6px',
            background: 'var(--gray-100)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            color: 'var(--text-secondary)'
          }}
          title="Редактировать"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '6px',
            background: 'var(--color-error-50)',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            color: 'var(--color-error)'
          }}
          title="Удалить"
        >
          🗑️
        </button>
      </div>
      
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4, paddingRight: 40 }}>
          {book.title}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {book.author}
        </div>
      </div>
      
      {book.isbn && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <span style={{ opacity: 0.7 }}>ISBN:</span> {book.isbn}
        </div>
      )}
      
      {book.genre && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <span style={{ opacity: 0.7 }}>Жанр:</span> {book.genre}
        </div>
      )}
      
      {book.year && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <span style={{ opacity: 0.7 }}>Год:</span> {book.year}
        </div>
      )}
      
      {book.description && (
        <div style={{ 
          fontSize: 12, 
          color: 'var(--text-secondary)', 
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid var(--border-light)',
          lineHeight: 1.4
        }}>
          {book.description.length > 100 
            ? `${book.description.substring(0, 100)}...` 
            : book.description}
        </div>
      )}

      {/* Кнопка управления экземплярами */}
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <button
          onClick={() => {
            setShowCopies(!showCopies);
            onLoadCopies();
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: 'var(--gray-100)',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <span>📋</span>
          <span>Экземпляры ({copies.length})</span>
          <span>{showCopies ? '▲' : '▼'}</span>
        </button>

        {showCopies && (
          <div style={{ marginTop: 12 }}>
            {loadingCopies ? (
              <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Загрузка экземпляров...
              </div>
            ) : copies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                Нет экземпляров
              </div>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {copies.map(copy => (
                  <div
                    key={copy.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--gray-50)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 4,
                      marginBottom: 4,
                      fontSize: 12
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{copy.barcode}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {copy.status === 'AVAILABLE' ? 'Доступен' : 
                         copy.status === 'BORROWED' ? 'Выдан' : 'Удален'}
                      </div>
                    </div>
                    {copy.status === 'AVAILABLE' && (
                      <button
                        onClick={() => onDeleteCopy(copy.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--color-error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={onAddCopy}
              disabled={addingCopy}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '8px',
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: addingCopy ? 'not-allowed' : 'pointer',
                opacity: addingCopy ? 0.7 : 1
              }}
            >
              {addingCopy ? 'Добавление...' : '➕ Добавить экземпляр'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Форма создания книги
function CreateBookForm({
  formData,
  setFormData,
  onClose,
  onSave,
  loading
}: {
  formData: any;
  setFormData: any;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      background: 'var(--gray-50)',
      padding: 24,
      borderRadius: 8,
      marginBottom: 24,
      border: '1px solid var(--border-light)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          📝 Новая книга
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          ✕
        </button>
      </div>
      
      <FormFields formData={formData} setFormData={setFormData} />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: 'var(--gray-100)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Отмена
        </button>
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Создание...' : '✅ Создать книгу'}
        </button>
      </div>
    </div>
  );
}

// Форма редактирования книги
function EditBookForm({
  formData,
  setFormData,
  copies,
  loadingCopies,
  addingCopy,
  onClose,
  onSave,
  onAddCopy,
  onDeleteCopy,
  loading
}: {
  formData: any;
  setFormData: any;
  copies: Copy[];
  loadingCopies?: boolean;
  addingCopy?: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddCopy: () => void;
  onDeleteCopy: (copyId: number) => void;
  loading: boolean;
}) {
  return (
    <div style={{
      background: 'var(--gray-50)',
      padding: 24,
      borderRadius: 8,
      marginBottom: 24,
      border: '1px solid var(--border-light)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          ✏️ Редактирование книги
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          ✕
        </button>
      </div>
      
      <FormFields formData={formData} setFormData={setFormData} />
      
      {/* Управление экземплярами в режиме редактирования */}
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
          📋 Экземпляры книги ({copies.length})
        </h4>
        
        {loadingCopies ? (
          <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            Загрузка экземпляров...
          </div>
        ) : copies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
            Нет экземпляров. Добавьте первый экземпляр.
          </div>
        ) : (
          <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
            {copies.map(copy => (
              <div
                key={copy.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 4,
                  marginBottom: 4,
                  fontSize: 12
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{copy.barcode}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {copy.status === 'AVAILABLE' ? '🟢 Доступен' : 
                     copy.status === 'BORROWED' ? '🔴 Выдан' : '⚫ Удален'}
                  </div>
                </div>
                {copy.status === 'AVAILABLE' && (
                  <button
                    onClick={() => onDeleteCopy(copy.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--color-error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onAddCopy}
          disabled={addingCopy}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--color-success)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: addingCopy ? 'not-allowed' : 'pointer',
            opacity: addingCopy ? 0.7 : 1
          }}
        >
          {addingCopy ? 'Добавление...' : '➕ Добавить новый экземпляр'}
        </button>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            background: 'var(--gray-100)',
            color: 'var(--text-secondary)',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Отмена
        </button>
        <button
          onClick={onSave}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Сохранение...' : '💾 Сохранить изменения'}
        </button>
      </div>
    </div>
  );
}

// Общие поля формы
function FormFields({ formData, setFormData }: { formData: any; setFormData: any }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Название *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
          }}
          placeholder="Война и мир"
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Автор *
        </label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({...formData, author: e.target.value})}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
          }}
          placeholder="Лев Толстой"
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          ISBN
        </label>
        <input
          type="text"
          value={formData.isbn}
          onChange={(e) => setFormData({...formData, isbn: e.target.value})}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
          }}
          placeholder="978-5-17-090530-3"
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Жанр
        </label>
        <input
          type="text"
          value={formData.genre}
          onChange={(e) => setFormData({...formData, genre: e.target.value})}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
          }}
          placeholder="Роман"
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Год издания
        </label>
        <input
          type="number"
          value={formData.year}
          onChange={(e) => setFormData({...formData, year: e.target.value})}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)'
          }}
          placeholder="1869"
        />
      </div>
      
      <div style={{ gridColumn: 'span 2' }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)' }}>
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={4}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            fontSize: 14,
            background: 'var(--bg-body)',
            color: 'var(--text-primary)',
            resize: 'vertical'
          }}
          placeholder="Краткое описание книги..."
        />
      </div>
    </div>
  );
}