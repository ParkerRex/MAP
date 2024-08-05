import { Suspense } from 'react';
import TaskList from './TaskList';
import { getAllTags, getAllTasks } from './listActions';

export default async function ListsPage() {
  try {
    const initialTasks = await getAllTasks();
    const initialTags = await getAllTags();

    return (
      <div className="flex flex-col h-full">
        <h1 className="text-2xl font-bold mb-4">Tasks</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <TaskList initialTasks={initialTasks} initialTags={initialTags} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in ListsPage:', error);
    return <div>An error occurred. Please try again later.</div>;
  }
}
