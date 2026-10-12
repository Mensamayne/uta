import { describe, expect, it } from 'vitest';
import { createSchema, titleSchema } from '../src/features/todos/validators.ts';

describe('title validation', () => {
  it('accepts boundary length titles', () => {
    expect(titleSchema.parse('x'.repeat(120))).toHaveLength(120);
    expect(createSchema.parse({ title: '  Task  ' })).toEqual({ title: 'Task', completed: false });
  });

  it('rejects titles over 120 characters', () => {
    expect(titleSchema.safeParse('x'.repeat(121)).success).toBe(false);
  });
});
