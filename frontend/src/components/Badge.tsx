interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'success' | 'error' | 'warning' | 'neutral';
  }
  
  export function Badge({ children, variant = 'neutral' }: BadgeProps) {
    const styles = {
      primary: {
        background: 'var(--color-primary-50)',
        color: 'var(--color-primary-700)',
        border: '1px solid var(--color-primary-200)'
      },
      success: {
        background: 'var(--color-success)',
        color: 'white',
        border: 'none'
      },
      error: {
        background: 'var(--color-error)',
        color: 'white',
        border: 'none'
      },
      warning: {
        background: 'var(--color-warning)',
        color: 'white',
        border: 'none'
      },
      neutral: {
        background: 'var(--color-gray-100)',
        color: 'var(--color-gray-700)',
        border: '1px solid var(--color-gray-200)'
      }
    };
  
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        lineHeight: '1',
        ...styles[variant]
      }}>
        {children}
      </span>
    );
  }