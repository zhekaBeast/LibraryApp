interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
  }
  
  export function Card({ children, className = '', hover = true }: CardProps) {
    return (
      <div 
        className={className}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--spacing-lg)',
          boxShadow: 'var(--shadow)',
          transition: 'all 0.2s',
          ...(hover && {
            '&:hover': {
              boxShadow: 'var(--shadow-md)',
              transform: 'translateY(-2px)'
            }
          })
        }}
      >
        {children}
      </div>
    );
  }