import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Book } from '../types';


export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const booksPerPage = 10;

  useEffect(() => {
    api.get<Book[]>('/api/books')
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Поиск на фронте
  const filtered = search
    ? books.filter(b => 
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        b.genre?.toLowerCase().includes(search.toLowerCase())
      )
    : books;

  // Пагинация
  const totalPages = Math.ceil(filtered.length / booksPerPage);
  const start = (page - 1) * booksPerPage;
  const displayed = filtered.slice(start, start + booksPerPage);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
        Загрузка книг...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
      {/* Заголовок */}
      <h1 style={{ 
        fontSize: 28, 
        fontWeight: 700, 
        color: 'var(--text-primary)',
        marginBottom: 8 
      }}>
        Каталог книг
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
        {books.length} книг в библиотеке
      </p>

      {/* Поиск */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Сбрасываем на первую страницу при поиске
          }}
          placeholder="Поиск книг..."
          style={{
            width: '100%',
            padding: '12px 16px 12px 42px',
            border: '1px solid var(--border-light)',
            borderRadius: 8,
            fontSize: 16,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)'
          }}
        />
        <span style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)'
        }}>
          🔍
        </span>
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 18
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Список книг */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayed.map(book => (
          <Link
            key={book.id}
            to={`/book/${book.id}`}
            style={{
              display: 'block',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: 20,
              textDecoration: 'none',
              color: 'var(--text-primary)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              margin: '0 0 8px 0',
              color: 'var(--text-primary)' 
            }}>
              {book.title}
            </h3>
            <p style={{ 
              color: 'var(--text-secondary)', 
              margin: '0 0 8px 0',
              fontSize: 15 
            }}>
              {book.author}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {book.genre && (
                <span style={{
                  background: 'var(--color-primary-50)',
                  color: 'var(--primary)',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  {book.genre}
                </span>
              )}
              {book.year && (
                <span style={{
                  background: 'var(--color-gray-500)',
                  color: 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12
                }}>
                  {book.year}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 8, 
          marginTop: 32,
          alignItems: 'center' 
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-light)',
              borderRadius: 6,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            ← Назад
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-light)',
              borderRadius: 6,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            Вперед →
          </button>
        </div>
      )}

      {/* Если ничего не найдено */}
      {displayed.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 48, 
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border-light)',
          borderRadius: 8,
          marginTop: 16
        }}>
          {search ? 'Книги не найдены' : 'В каталоге пока нет книг'}
        </div>
      )}
    </div>
  );
}