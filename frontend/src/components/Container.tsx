interface ContainerProps {
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'full';
    className?: string;
  }
  
  export function Container({ children, size = 'full', className = '' }: ContainerProps) {
    const maxWidths = {
      sm: '640px',
      md: '768px',
      lg: '1200px',
      full: '100%'
    };
  
    return (
      <div 
        style={{
          width: '100%',
          maxWidth: maxWidths[size],
          margin: '0 auto',
          padding: '0 var(--spacing)'
        }}
        className={className}
      >
        {children}
      </div>
    );
  }