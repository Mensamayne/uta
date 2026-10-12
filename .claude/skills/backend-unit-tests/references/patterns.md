# Backend test patterns

## Validator with table-driven cases

```ts
import { describe, expect, it } from 'vitest';
import { titleSchema } from '../src/features/todos/validators.ts';

describe('titleSchema', () => {
  it('accepts a trimmed title', () => {
    expect(titleSchema.parse('  Ship  ')).toBe('Ship');
  });

  it.each(['', '  ', 'x'.repeat(121)])('rejects %j', (input) => {
    expect(titleSchema.safeParse(input).success).toBe(false);
  });
});
```

## Pure mapper

```ts
import { describe, expect, it } from 'vitest';
import { toSummary } from '../src/features/todos/mappers.ts';

describe('toSummary', () => {
  it('formats open and completed tasks', () => {
    expect(toSummary({ id: 1, title: 'Ship', completed: false })).toBe('[ ] Ship');
    expect(toSummary({ id: 2, title: 'Done', completed: true })).toBe('[x] Done');
  });
});
```

## Fake collaborator at the module boundary

```ts
import { beforeEach, expect, it, vi } from 'vitest';
import { createService } from '../src/features/todos/service.ts';

function setup() {
  const store = { get: vi.fn(), save: vi.fn() };
  return { store, service: createService(store) };
}

beforeEach(() => vi.clearAllMocks());

it('does not save when the task is missing', async () => {
  const { store, service } = setup();
  store.get.mockResolvedValue(null);
  await expect(service.rename(9, 'New')).rejects.toThrow(/not found/i);
  expect(store.save).not.toHaveBeenCalled();
});
```
