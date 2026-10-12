# Frontend test patterns

## Leaf component

```tsx
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
```

## Mock a child module

```tsx
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { App } from './App.tsx';

vi.mock('./features/todos/TodoList.tsx', () => ({
  TodoList: ({ todos }: { todos: { title: string }[] }) => (
    <div data-testid="todos">{todos.map((t) => t.title).join(',')}</div>
  ),
}));

it('passes sample todos into the list', () => {
  render(<App />);
  expect(screen.getByTestId('todos')).toHaveTextContent('Write tests');
});
```

## Stub fetch

```ts
import { afterEach, expect, it, vi } from 'vitest';
import { fetchJson } from './http.ts';

afterEach(() => vi.unstubAllGlobals());

it('returns parsed JSON on success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })));
  await expect(fetchJson('/api/health')).resolves.toEqual({ ok: true });
});
```
