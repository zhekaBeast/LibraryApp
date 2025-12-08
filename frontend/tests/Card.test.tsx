import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../src/components/Card';

describe('Card Component', () => {
  it('should render children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should render with default props', () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.querySelector('div');
    expect(card).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="custom-class">Test</Card>);
    const card = container.querySelector('div');
    expect(card).toHaveClass('custom-class');
  });

  it('should render with hover enabled by default', () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.querySelector('div');
    expect(card).toBeInTheDocument();
  });

  it('should render without hover when hover is false', () => {
    const { container } = render(<Card hover={false}>Test</Card>);
    const card = container.querySelector('div');
    expect(card).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <Card>
        <div>Child 1</div>
        <div>Child 2</div>
      </Card>
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });

  it('should render nested components', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});

