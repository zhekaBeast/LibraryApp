import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Book, Copy, Review, ReviewsSectionProps, SubscriptionCheckResponse } from '../types';

// --- Основной компонент ---
export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();
  
  console.log('Текущий пользователь:', user);
  console.log('ID книги:', id);

  const [book, setBook] = useState<Book | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [addingCopy, setAddingCopy] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Загрузка данных
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [bookData, copiesData, subscriptionData] = await Promise.all([
          api.get<Book>(`/api/books/${id}`),
          api.get<Copy[]>(`/api/copies/${id}`),
          api.get<SubscriptionCheckResponse>(`/api/subscriptions/check/${id}`).catch(() => ({ isSubscribed: false }))
        ]);
        setBook(bookData);
        setCopies(copiesData);
        setIsSubscribed(subscriptionData.isSubscribed || false);
      } catch (err) {
        addToast('Ошибка загрузки', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, addToast]);

  const availableCount = copies.filter(c => c.status === 'AVAILABLE').length;
  const isAvailable = availableCount > 0;

  const handleSubscribe = async () => {
    if (!book) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        // Отписываемся
        await api.delete(`/api/subscriptions/${book.id}`);
        addToast('Вы отписались от уведомлений', 'success');
        return false; // возвращаем новое состояние
      } else {
        // Подписываемся
        await api.post('/api/subscriptions', { bookId: book.id });
        addToast('Подписка оформлена', 'success');
        return true;
      }
    } catch (err: any) {
      if (err.response?.status === 400) {
        addToast('Ошибка подписки', 'warning');
      } else {
        addToast('Ошибка подписки', 'error');
      }
      throw err;
    } finally {
      setSubscribing(false);
    }
  };

  // Добавление экземпляра
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

  // Удаление экземпляра
  const handleDeleteCopy = async (copyId: number) => {
    try {
      await api.delete(`/api/copies/${copyId}`);
      setCopies(prev => prev.filter(c => c.id !== copyId));
      addToast('Экземпляр удален', 'success');
    } catch {
      addToast('Нельзя удалить выданную копию', 'error');
    }
  };

  // Состояния загрузки
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
        <BookHeader book={book} isAvailable={isAvailable} />
        <BookDetails book={book} />
        <SubscriptionButton 
          book={book}
          isSubscribed={isSubscribed}
          subscribing={subscribing}
          onSubscribe={handleSubscribe}
        />
      </div>

      {/* Управление для библиотекарей */}
      {hasRole('LIBRARIAN', 'ADMIN') && (
        <CopiesManagement 
          copies={copies}
          addingCopy={addingCopy}
          onAddCopy={handleAddCopy}
          onDeleteCopy={handleDeleteCopy}
        />
      )}
      <ReviewsSection bookId={book.id} />
      {/* TODO: Добавить сюда компонент для отзывов */}
      {/* TODO: Добавить сюда компонент для редактирования книги (для админов) */}
    </div>
  );
}

// --- Компоненты ---

function BookHeader({ book, isAvailable }: { book: Book; isAvailable: boolean }) {
  return (
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
              background: 'var(--color-gray-200)',
              color: 'var(--color-gray-700)',
              padding: '6px 12px',
              borderRadius: 12,
              fontSize: 13
            }}>
              {book.year} год
            </span>
          )}
        </div>
      </div>
      {isAvailable ? <div/>:
      <div style={{
        padding: '8px 16px',
        background: isAvailable ? 'var(--color-success)' : 'var(--color-error)',
        color: 'white',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14
      }}>
          Нет в наличии
      </div>}
    </div>
  );
}

function BookDetails({ book }: { book: Book }) {
  return (
    <>
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
    </>
  );
}

function SubscriptionButton({ 
  book,
  subscribing, 
  onSubscribe,
  isSubscribed: initialSubscribed
}: { 
  book: Book;
  subscribing: boolean;
  onSubscribe: () => void;
  isSubscribed: boolean;
}) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  
  const handleClick = async () => {
    try {
      await onSubscribe();
      setIsSubscribed(prev => !prev);
    } catch (err) {
      console.error('Ошибка при подписке:', err);
    }
  };
  
  // Определяем текст и стили кнопки
  const buttonConfig = isSubscribed 
    ? {
        text: 'Вы подписаны',
        bgColor: 'var(--color-gray-200)',
        textColor: 'var(--color-gray-700)',
        hoverBgColor: 'var(--color-gray-300)',
      }
    : {
        text: 'Уведомлять о наличии',
        bgColor: 'var(--color-primary-500)',
        textColor: 'white',
        hoverBgColor: 'var(--color-primary-600)',
      };
  
  return (
    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={handleClick}
          disabled={subscribing}
          style={{
            padding: '12px 24px',
            background: buttonConfig.bgColor,
            color: buttonConfig.textColor,
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: subscribing ? 'not-allowed' : 'pointer',
            opacity: subscribing ? 0.7 : 1,
            transition: 'background-color 0.2s',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            if (!subscribing && isSubscribed) {
              e.currentTarget.style.background = 'var(--color-error)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.textContent = 'Отписаться';
            }
          }}
          onMouseLeave={(e) => {
            if (!subscribing && isSubscribed) {
              e.currentTarget.style.background = buttonConfig.bgColor;
              e.currentTarget.style.color = buttonConfig.textColor;
              e.currentTarget.textContent = buttonConfig.text;
            }
          }}
        >
          {subscribing ? '...' : buttonConfig.text}
        </button>
      </div>
    </div>
  );
}

function CopyItem({ 
  copy, 
  onDelete 
}: { 
  copy: Copy; 
  onDelete: (id: number) => void;
}) {
  return (
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
          onClick={() => onDelete(copy.id)}
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
  );
}

function CopiesManagement({ 
  copies, 
  addingCopy, 
  onAddCopy, 
  onDeleteCopy 
}: { 
  copies: Copy[]; 
  addingCopy: boolean; 
  onAddCopy: () => void; 
  onDeleteCopy: (id: number) => void;
}) {
  return (
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

      <div style={{ marginBottom: 20 }}>
        {copies.map(copy => (
          <CopyItem key={copy.id} copy={copy} onDelete={onDeleteCopy} />
        ))}
      </div>

      <button
        onClick={onAddCopy}
        disabled={addingCopy}
        style={{
          padding: '10px 20px',
          background: 'var(--color-success)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          cursor: addingCopy ? 'not-allowed' : 'pointer',
          opacity: addingCopy ? 0.7 : 1
        }}
      >
        {addingCopy ? 'Добавление...' : 'Добавить экземпляр'}
      </button>
    </div>
  );
}



function ReviewsSection({ bookId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Загрузка отзывов
  useEffect(() => {
    loadReviews();
  }, [bookId]);

  const loadReviews = async () => {
    try {
      const [allReviews, myReviews] = await Promise.all([
        api.get<Review[]>(`/api/reviews/book/${bookId}`),
        user ? api.get<Review[]>(`/api/reviews/my`).catch(() => []) : []
      ]);
      
      setReviews(allReviews);
      
      // Находим отзыв текущего пользователя для этой книги
      const myReview = myReviews.find(r => r.bookId === bookId);
      setUserReview(myReview || null);
      
      if (myReview) {
        setFormData({
          rating: myReview.rating,
          comment: myReview.comment || ''
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
      addToast('Ошибка загрузки отзывов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      addToast('Войдите, чтобы оставить отзыв', 'warning');
      return;
    }
    
    setSubmitting(true);
    try {
      const review = await api.post<Review>('/api/reviews', {
        bookId,
        rating: formData.rating,
        comment: formData.comment || null
      });
      
      // Обновляем список
      if (userReview) {
        setReviews(prev => prev.map(r => r.id === review.id ? review : r));
      } else {
        setReviews(prev => [{ ...review, user: { name: user.name } }, ...prev]);
      }
      
      setUserReview(review);
      setShowForm(false);
      addToast(userReview ? 'Отзыв обновлен' : 'Отзыв добавлен', 'success');
    } catch (err) {
      console.error('Ошибка сохранения отзыва:', err);
      addToast('Ошибка сохранения отзыва', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!userReview) return;
    
    if (!window.confirm('Удалить отзыв?')) return;
    
    try {
      await api.delete(`/api/reviews/${userReview.id}`);
      setReviews(prev => prev.filter(r => r.id !== userReview.id));
      setUserReview(null);
      setFormData({ rating: 5, comment: '' });
      addToast('Отзыв удален', 'success');
    } catch (err) {
      console.error('Ошибка удаления отзыва:', err);
      addToast('Ошибка удаления отзыва', 'error');
    }
  };

  // Рейтинг звездами
  const renderStars = (rating: number, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setFormData(prev => ({ ...prev, rating: star }))}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: interactive ? 'pointer' : 'default',
              fontSize: '24px',
              color: star <= rating ? '#fbbf24' : '#d1d5db',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (interactive) {
                const hoverStars = e.currentTarget.parentElement?.children;
                if (hoverStars) {
                  for (let i = 0; i < hoverStars.length; i++) {
                    (hoverStars[i] as HTMLElement).style.color = i < star ? '#fbbf24' : '#d1d5db';
                  }
                }
              }
            }}
            onMouseLeave={(e) => {
              if (interactive) {
                const hoverStars = e.currentTarget.parentElement?.children;
                if (hoverStars) {
                  for (let i = 0; i < hoverStars.length; i++) {
                    (hoverStars[i] as HTMLElement).style.color = i < formData.rating ? '#fbbf24' : '#d1d5db';
                  }
                }
              }
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // Рассчитать средний рейтинг
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
        Загрузка отзывов...
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 12,
      padding: 24,
      marginTop: 24
    }}>
      <h3 style={{ 
        fontSize: 18, 
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 16 
      }}>
        Отзывы
        <span style={{
          marginLeft: 12,
          fontSize: 14,
          fontWeight: 400,
          color: 'var(--text-secondary)'
        }}>
          {reviews.length} отзывов • Средняя оценка: {averageRating} ★
        </span>
      </h3>

      {/* Форма отзыва */}
      {user && (
        <div style={{
          background: 'var(--bg-body)',
          border: '1px solid var(--border-light)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20
        }}>
          {userReview ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Ваш отзыв</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {renderStars(userReview.rating)} • {new Date(userReview.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(!showForm)}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  {showForm ? 'Отмена' : 'Изменить'}
                </button>
              </div>
              {userReview.comment && (
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {userReview.comment}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--gray-100)',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-light)',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Написать отзыв...
            </button>
          )}

          {/* Форма редактирования/создания */}
          {showForm && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 14 }}>Ваша оценка:</div>
                {renderStars(formData.rating, true)}
              </div>
              
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Ваш отзыв (необязательно)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 6,
                  background: 'var(--bg-body)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  marginBottom: 12,
                  resize: 'vertical'
                }}
              />
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--gray-200)',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                {userReview && (
                  <button
                    onClick={handleDelete}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--color-error)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    Удалить
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Сохранение...' : userReview ? 'Обновить' : 'Опубликовать'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Список отзывов */}
      {reviews.length > 0 ? (
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '16px 0',
                borderTop: '1px solid var(--border-light)',
                ...(review.id === userReview?.id && {
                  background: 'var(--color-primary-50)',
                  margin: '0 -16px',
                  padding: '16px'
                })
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {review.user.name}
                  {review.id === userReview?.id && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--primary)', fontWeight: 400 }}>
                      (Вы)
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {renderStars(review.rating)} • {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              {review.comment && (
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
          Пока нет отзывов. Будьте первым!
        </div>
      )}
    </div>
  );
}