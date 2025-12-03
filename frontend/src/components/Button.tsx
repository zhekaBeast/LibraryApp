interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: string;
  }
  
  export function Button({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    disabled,
    style,
    ...props 
  }: ButtonProps) {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      border: '1px solid transparent',
      borderRadius: 'var(--border-radius)',
      fontWeight: '500',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s',
      opacity: disabled || loading ? 0.6 : 1
    };
  
    const variants = {
      primary: {
        background: 'var(--primary)',
        color: 'white',
        borderColor: 'var(--primary)',
        '&:hover:not(:disabled)': {
          background: 'var(--primary-dark)',
          transform: 'translateY(-1px)',
          boxShadow: 'var(--shadow-md)'
        }
      },
      outline: {
        background: 'transparent',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-medium)',
        '&:hover:not(:disabled)': {
          background: 'var(--color-gray-50)',
          borderColor: 'var(--color-gray-400)'
        }
      },
      danger: {
        background: 'var(--color-error)',
        color: 'white',
        borderColor: 'var(--color-error)',
        '&:hover:not(:disabled)': {
          background: '#dc2626',
          transform: 'translateY(-1px)'
        }
      },
      success: {
        background: 'var(--color-success)',
        color: 'white',
        borderColor: 'var(--color-success)',
        '&:hover:not(:disabled)': {
          background: '#059669',
          transform: 'translateY(-1px)'
        }
      }
    };
  
    const sizes = {
      sm: { padding: '6px 12px', fontSize: '13px' },
      md: { padding: '10px 20px', fontSize: '14px' },
      lg: { padding: '14px 28px', fontSize: '16px' }
    };
  
    return (
      <button
        style={{
          ...baseStyle,
          ...variants[variant],
          ...sizes[size],
          ...style
        }}
        disabled={disabled || loading}
        {...props}
      >
        {icon && <span>{icon}</span>}
        {loading ? 'Загрузка...' : children}
      </button>
    );
  }