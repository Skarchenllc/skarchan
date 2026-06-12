'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, CheckSquare } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.pm_tasks.list();
      const tasksArray = Array.isArray(data) ? data : (data.tasks || data.data || []);
      setTasks(tasksArray);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (task.task_name && task.task_name.toLowerCase().includes(search)) ||
      (task.task_code && task.task_code.toLowerCase().includes(search)) ||
      (task.assigned_to && task.assigned_to.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Tasks</h1>
        </div>
        <Link href="/tasks/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Task
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks by name, code, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="card">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No tasks found</p>
            <Link href="/tasks/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Task Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Assigned To</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Progress</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{task.task_code}</td>
                    <td className="py-3 px-4 text-black">{task.task_name}</td>
                    <td className="py-3 px-4 text-gray-600">{task.assigned_to || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center capitalize">{task.priority || '-'}</td>
                    <td className="py-3 px-4 text-center">{task.progress_percentage || 0}%</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
