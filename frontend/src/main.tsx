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
import { Protected } from './auth/Protected'
import AdminPanel from './pages/AdminPanel.tsx'
import AboutPage from './pages/About'
import './theme.css';
import './styles/utilities.css';
import LibrarianPanel from './pages/LibrarianPanel.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, 
        element: (
          <Protected>
            <CatalogPage />
          </Protected>
        ), 
      },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { 
        path: 'book/:id', 
        element: (
          <Protected>
            <BookDetailsPage />
          </Protected>
        ), 
      },
      { 
        path: 'dashboard', 
        element: (
          <Protected>
            <DashboardPage />
          </Protected>
        ), 
      },
      { 
        path: 'admin', 
        element: (
          <Protected>
            <AdminPanel />
          </Protected>
        ), 
      },
      { 
        path: 'librarian', 
        element: (
          <Protected>
            <LibrarianPanel />
          </Protected>
        ), 
      },
      { path: 'about', element: <AboutPage /> },
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
