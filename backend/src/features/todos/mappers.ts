import type { Todo } from './types.js';

export function toSummary(todo: Todo): string {
  return `${todo.completed ? '[x]' : '[ ]'} ${todo.title}`;
}
