# LibraryApp

Монорепозиторий: frontend (Vite + React + TS) и backend (Express + TS + Prisma + SQLite)

## Запуск
- Frontend:
  cd frontend
  npm run dev

- Backend:
  cd backend
  npm run dev

## Структура
- frontend — клиентское приложение на React + Vite + TypeScript
- backend — API на Express + TypeScript, Prisma + SQLite

## Переменные окружения
Создайте файл `backend/.env` по образцу `backend/.env.example`. Для SQLite:
```
DATABASE_URL="file:./dev.db"
```