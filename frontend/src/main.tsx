import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import CatalogPage from './pages/Catalog'
import BookDetailsPage from './pages/BookDetails'
import DashboardPage from './pages/Dashboard'
import LibrarianDashboardPage from './pages/LibrarianDashboard'
import LibrarianBooksPage from './pages/LibrarianBooks'
import LibrarianLoansPage from './pages/LibrarianLoans'
import { Protected } from './auth/Protected'
import AdminPanel from './pages/AdminPanel.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CatalogPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'admin', element: <AdminPanel /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'book/:id', element: <BookDetailsPage /> },
      { 
        path: 'dashboard', 
        element: <Protected><DashboardPage /></Protected> 
      },
      { 
        path: 'librarian', 
        element: <Protected roles={['LIBRARIAN', 'ADMIN']}><LibrarianDashboardPage /></Protected> 
      },
      { 
        path: 'librarian/books', 
        element: <Protected roles={['LIBRARIAN', 'ADMIN']}><LibrarianBooksPage /></Protected> 
      },
      { 
        path: 'librarian/loans', 
        element: <Protected roles={['LIBRARIAN', 'ADMIN']}><LibrarianLoansPage /></Protected> 
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
