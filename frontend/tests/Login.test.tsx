import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../src/pages/Login';

// Mock AuthContext
const mockLogin = vi.fn();
const mockAddToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

vi.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
  });

  it('should render login title', () => {
    renderLogin();
    expect(screen.getByText('Библиотека')).toBeInTheDocument();
    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
  });

  it('should update email input', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password input', async () => {
    const user = userEvent.setup();
    renderLogin();
    
    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call login on form submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({});
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Войти');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Войти');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText('Вход...')).toBeInTheDocument();
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValue(new Error(errorMessage));
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Войти');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('should navigate to home on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({});
    
    renderLogin();
    
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByText('Войти');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockAddToast).toHaveBeenCalledWith('Успешный вход в систему!', 'success');
    });
  });

  it('should have link to register page', () => {
    renderLogin();
    const registerLink = screen.getByText('Создать аккаунт');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should require email and password', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('your@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

