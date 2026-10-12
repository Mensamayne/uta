import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TodoList } from './TodoList.tsx';

describe('TodoList', () => {
  it('renders task titles', () => {
    render(<TodoList todos={[{ id: 1, title: 'Ship UTA', completed: false }]} />);
    expect(screen.getByText('Ship UTA')).toBeInTheDocument();
  });

  it('shows an empty state', () => {
    render(<TodoList todos={[]} />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });
});
