'use client';

import { MemberHeader } from '@/components/member/header';
import { useMyTasks, useUpdateTask, useTask, useAddTaskComment } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { useState } from 'react';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '@/types';

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const statusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-600',
  IN_REVIEW: 'bg-purple-100 text-purple-600',
  DONE: 'bg-green-100 text-green-600',
  BLOCKED: 'bg-red-100 text-red-600',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-amber-100 text-amber-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function MemberTasksPage() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();
  const addTaskComment = useAddTaskComment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [newComment, setNewComment] = useState('');

  const { data: selectedTask } = useTask(selectedTaskId);

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ id: taskId, status });
  };

  const handleDropStatus = async (taskId: string, status: TaskStatus) => {
    const task = filtered.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    await updateTask.mutateAsync({ id: taskId, status });
  };

  return (
    <>
      <MemberHeader title="My Tasks" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All priorities</option>
              {Object.entries(priorityLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView('list')}
              className={`rounded-md p-1.5 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('board')}
              className={`rounded-md p-1.5 ${view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">No tasks found</div>
        ) : view === 'list' ? (
          /* List view */
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr
                    key={task.id}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.project?.name ?? projects.find((p) => p.id === task.projectId)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status]} border-0`}
                      >
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Board view */
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {Object.entries(statusLabels).map(([status, label]) => {
              const colTasks = filtered.filter((t) => t.status === status);
              return (
                <div
                  key={status}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const taskId = e.dataTransfer.getData('text/task-id');
                    if (taskId) void handleDropStatus(taskId, status as TaskStatus);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="cursor-pointer rounded-lg border border-border bg-background p-3"
                        onClick={() => setSelectedTaskId(task.id)}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)}
                      >
                        <div className="text-sm font-medium">{task.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.project?.name || projects.find((p) => p.id === task.projectId)?.name}
                        </div>
                        <div className="mt-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority as TaskPriority]}`}>
                            {priorityLabels[task.priority as TaskPriority]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl rounded-xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Task Detail</h3>
                <button onClick={() => setSelectedTaskId('')} className="rounded p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium">{selectedTask.title}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p>{selectedTask.project?.name || '—'}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Status</p>
                    <select
                      value={selectedTask.status}
                      onChange={(e) =>
                        updateTask.mutate({
                          id: selectedTask.id,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Priority</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[selectedTask.priority]}`}>
                      {priorityLabels[selectedTask.priority]}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p>{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en-US') : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p>{selectedTask.description || 'No description'}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Created: {new Date(selectedTask.createdAt).toLocaleString('en-US')}</li>
                    <li>Last updated: {new Date(selectedTask.updatedAt).toLocaleString('en-US')}</li>
                    <li>Current status: {statusLabels[selectedTask.status]}</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Comments</p>
                  <div className="max-h-44 space-y-2 overflow-y-auto">
                    {(selectedTask.comments || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    ) : (
                      (selectedTask.comments || []).map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                          <div className="text-xs font-medium text-foreground">{comment.author?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{comment.content}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString('en-US')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      onClick={async () => {
                        if (!newComment.trim()) return;
                        await addTaskComment.mutateAsync({ id: selectedTask.id, content: newComment.trim() });
                        setNewComment('');
                      }}
                      disabled={addTaskComment.isPending}
                      className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setSelectedTaskId('')} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
