export default function AboutPage() {
  return (
    <div
      style={{
        padding: 'var(--spacing-2xl) var(--spacing)',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: 'var(--spacing)',
          color: 'var(--text-primary)',
        }}
      >
        О проекте
      </h1>
      <p
        style={{
          fontSize: '16px',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}
      >
        Это учебное приложение «Библиотека» для работы с каталогом книг, бронирования и
        управления фондами. Интерфейс адаптирован под разные роли пользователей:
        читатель, библиотекарь и администратор.
      </p>
    </div>
  );
}



