import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Book, Copy } from '../types';




export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [addingCopy, setAddingCopy] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [bookData, copiesData] = await Promise.all([
          api.get<Book>(`/api/books/${id}`),
          api.get<Copy[]>(`/api/copies/${id}`)
        ]);
        setBook(bookData);
        setCopies(copiesData);
      } catch (err) {
        addToast('Ошибка загрузки', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const availableCount = copies.filter(c => c.status === 'AVAILABLE').length;
  const isAvailable = availableCount > 0;

  const handleSubscribe = async () => {
    if (!book) return;
    setSubscribing(true);
    try {
      await api.post('/api/subscriptions', { bookId: book.id });
      addToast('Подписка оформлена', 'success');
    } catch {
      addToast('Ошибка подписки', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const handleAddCopy = async () => {
    if (!book) return;
    setAddingCopy(true);
    try {
      const newCopy = await api.post<Copy>('/api/copies', {
        bookId: book.id,
        barcode: `BC${Date.now()}`
      });
      setCopies(prev => [...prev, newCopy]);
      addToast('Экземпляр добавлен', 'success');
    } catch {
      addToast('Ошибка добавления', 'error');
    } finally {
      setAddingCopy(false);
    }
  };

  const handleDeleteCopy = async (copyId: number) => {
    try {
      await api.delete(`/api/copies/${copyId}`);
      setCopies(prev => prev.filter(c => c.id !== copyId));
      addToast('Экземпляр удален', 'success');
    } catch {
      addToast('Нельзя удалить выданную копию', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
        Загрузка информации...
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 40 }}>
        <h2 style={{ color: 'var(--color-error)' }}>Книга не найдена</h2>
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          ← Назад в каталог
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
      {/* Навигация */}
      <div style={{ marginBottom: 24 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '8px 12px',
            border: '1px solid var(--border-light)',
            borderRadius: 6
          }}
        >
          ← Каталог
        </Link>
      </div>

      {/* Карточка книги */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: 32,
        marginBottom: 24
      }}>
        {/* Заголовок и статус */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
          <div>
            <h1 style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              margin: '0 0 8px 0' 
            }}>
              {book.title}
            </h1>
            <p style={{ 
              fontSize: 18, 
              color: 'var(--text-secondary)',
              margin: '0 0 16px 0' 
            }}>
              {book.author}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {book.genre && (
                <span style={{
                  background: 'var(--color-primary-50)',
                  color: 'var(--primary)',
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500
                }}>
                  {book.genre}
                </span>
              )}
              {book.year && (
                <span style={{
                  background: 'var(--color-gray-100)',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: 12,
                  fontSize: 13
                }}>
                  {book.year} год
                </span>
              )}
            </div>
          </div>

          {/* Статус доступности */}
          <div style={{
            padding: '8px 16px',
            background: isAvailable ? 'var(--color-success)' : 'var(--color-error)',
            color: 'white',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14
          }}>
            {isAvailable ? 'Доступна' : 'Нет в наличии'}
          </div>
        </div>

        {/* Детали */}
        {book.isbn && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            <strong>ISBN:</strong> {book.isbn}
          </p>
        )}
        {book.description && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            lineHeight: 1.6,
            marginBottom: 24 
          }}>
            {book.description}
          </p>
        )}

        {/* Действия для пользователя */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 24 }}>
          {isAvailable ? (
            <button
              style={{
                padding: '12px 24px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Уведомлять о наличии
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                style={{
                  padding: '12px 24px',
                  background: 'var(--color-warning)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  opacity: subscribing ? 0.7 : 1
                }}
              >
                {subscribing ? '...' : 'Уведомить о доступности'}
              </button>
              <span style={{ color: 'var(--text-secondary)' }}>
                Все экземпляры выданы
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Управление для библиотекарей */}
      {hasRole('LIBRARIAN', 'ADMIN') && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          padding: 24
        }}>
          <h3 style={{ 
            fontSize: 18, 
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16 
          }}>
            Управление экземплярами
          </h3>

          {/* Список копий */}
          <div style={{ marginBottom: 20 }}>
            {copies.map(copy => (
              <div
                key={copy.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8,
                  marginBottom: 8
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    Экземпляр #{copy.id}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {copy.barcode} • {copy.status}
                  </div>
                </div>
                {copy.status === 'AVAILABLE' && (
                  <button
                    onClick={() => handleDeleteCopy(copy.id)}
                    style={{
                      background: 'var(--color-error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Кнопка добавления */}
          <button
            onClick={handleAddCopy}
            disabled={addingCopy}
            style={{
              padding: '10px 20px',
              background: 'var(--color-success)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: addingCopy ? 0.7 : 1
            }}
          >
            {addingCopy ? 'Добавление...' : 'Добавить экземпляр'}
          </button>
        </div>
      )}
    </div>
  );
}