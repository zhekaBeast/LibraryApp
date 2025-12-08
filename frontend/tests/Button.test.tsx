import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should render with default variant', () => {
    const { container } = render(<Button>Test</Button>);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should render with primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });

  it('should render with danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByText('Danger')).toBeInTheDocument();
  });

  it('should render with success variant', () => {
    render(<Button variant="success">Success</Button>);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render with small size', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small')).toBeInTheDocument();
  });

  it('should render with medium size', () => {
    render(<Button size="md">Medium</Button>);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should render with large size', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Button</Button>);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Button</Button>);
    const button = screen.getByText('Загрузка...');
    expect(button).toBeDisabled();
  });

  it('should call onClick handler', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render with icon', () => {
    render(<Button icon="🔍">Search</Button>);
    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('should accept custom style', () => {
    const { container } = render(
      <Button style={{ backgroundColor: 'red' }}>Styled</Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveStyle({ backgroundColor: 'red' });
  });

  it('should accept other button props', () => {
    render(<Button type="submit" aria-label="Submit">Submit</Button>);
    const button = screen.getByLabelText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

