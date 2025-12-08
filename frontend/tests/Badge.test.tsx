import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../src/components/Badge';

describe('Badge Component', () => {
  it('should render children', () => {
    render(<Badge>Badge Text</Badge>);
    expect(screen.getByText('Badge Text')).toBeInTheDocument();
  });

  it('should render with default neutral variant', () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('should render with primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('should render with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render with error variant', () => {
    render(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should render with neutral variant', () => {
    render(<Badge variant="neutral">Neutral</Badge>);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('should render as inline element', () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
  });

  it('should render with numbers', () => {
    render(<Badge>5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render with multiple words', () => {
    render(<Badge>New Item</Badge>);
    expect(screen.getByText('New Item')).toBeInTheDocument();
  });
});

