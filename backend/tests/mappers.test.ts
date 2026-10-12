import { describe, expect, it } from 'vitest';
import { toSummary } from '../src/features/todos/mappers.ts';

describe('toSummary', () => {
  it('formats open and completed tasks', () => {
    expect(toSummary({ id: 1, title: 'Ship', completed: false })).toBe('[ ] Ship');
    expect(toSummary({ id: 2, title: 'Done', completed: true })).toBe('[x] Done');
  });
});
