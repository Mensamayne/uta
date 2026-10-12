import type { Todo } from './types.ts';

type Props = {
  todos: Todo[];
};

export function TodoList({ todos }: Props) {
  if (todos.length === 0) return <p>No tasks</p>;
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id} data-completed={todo.completed}>
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
