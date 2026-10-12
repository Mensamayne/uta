import { TodoList } from './features/todos/TodoList.tsx';

export function App() {
  return (
    <main>
      <h1>UTA sample</h1>
      <TodoList todos={[{ id: 1, title: 'Write tests', completed: false }]} />
    </main>
  );
}
