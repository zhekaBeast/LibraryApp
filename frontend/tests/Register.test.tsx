import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../src/pages/Register';

// Mock AuthContext
const mockRegister = vi.fn();
const mockAddToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister
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

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  it('should render register form', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Имя')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByText('Зарегистрироваться')).toBeInTheDocument();
  });

  it('should render register title', () => {
    renderRegister();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('should update email input', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    const emailInput = screen.getByPlaceholderText('Email');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update name input', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    const nameInput = screen.getByPlaceholderText('Имя');
    await user.type(nameInput, 'Test User');
    
    expect(nameInput).toHaveValue('Test User');
  });

  it('should update password input', async () => {
    const user = userEvent.setup();
    renderRegister();
    
    const passwordInput = screen.getByPlaceholderText('Пароль');
    await user.type(passwordInput, 'password123');
    
    expect(passwordInput).toHaveValue('password123');
  });

  it('should call register on form submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({});
    
    renderRegister();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const nameInput = screen.getByPlaceholderText('Имя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByText('Зарегистрироваться');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });
    });
  });

  it('should show loading state during registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderRegister();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const nameInput = screen.getByPlaceholderText('Имя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByText('Зарегистрироваться');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    expect(screen.getByText('Регистрация...')).toBeInTheDocument();
  });

  it('should handle registration error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Email already used';
    mockRegister.mockRejectedValue(new Error(errorMessage));
    
    renderRegister();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const nameInput = screen.getByPlaceholderText('Имя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByText('Зарегистрироваться');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockAddToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('should navigate to home on successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({});
    
    renderRegister();
    
    const emailInput = screen.getByPlaceholderText('Email');
    const nameInput = screen.getByPlaceholderText('Имя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByText('Зарегистрироваться');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockAddToast).toHaveBeenCalledWith('Регистрация прошла успешно!', 'success');
    });
  });

  it('should have link to login page', () => {
    renderRegister();
    const loginLink = screen.getByText('Войти');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should require all fields', () => {
    renderRegister();
    const emailInput = screen.getByPlaceholderText('Email');
    const nameInput = screen.getByPlaceholderText('Имя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    
    expect(emailInput).toBeRequired();
    expect(nameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

