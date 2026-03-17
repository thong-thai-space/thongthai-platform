'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useProject, useAcceptProjectRequest, useUpdateProject } from '@/hooks/use-projects';
import {
  useProjectConversation,
  useSendMessage,
  useMarkProjectConversationRead,
} from '@/hooks/use-messages';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { useTasks, useCreateTask } from '@/hooks/use-tasks';
import { useTeam } from '@/hooks/use-team';
import { useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  DollarSign,
  Users,
  Globe,
  CheckCircle,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
import type { TaskStatus, TaskPriority, ProjectStatus, Message } from '@/types';

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  ON_HOLD: { label: 'On Hold', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  REVIEW: { label: 'Review', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'To Do', color: 'border-t-gray-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-amber-400' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'border-t-purple-400' },
  { status: 'DONE', label: 'Done', color: 'border-t-green-400' },
];

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-amber-100 text-amber-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: loadingProject } = useProject(id);
  const { data: tasks = [] } = useTasks(id);
  const acceptRequest = useAcceptProjectRequest();
  const updateProject = useUpdateProject();

  if (loadingProject) {
    return (
      <>
        <DashboardHeader title="Project Details" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <DashboardHeader title="Project Details" />
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Project not found
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader title={project.name} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Project status */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <select
            value={project.status}
            onChange={(e) =>
              updateProject.mutate({ id: project.id, status: e.target.value as ProjectStatus })
            }
            disabled={updateProject.isPending}
            className={`rounded-lg border border-border px-3 py-1.5 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${projectStatusConfig[project.status as ProjectStatus]?.color || ''}`}
          >
            {Object.entries(projectStatusConfig).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {updateProject.isPending && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>

        {/* Client request banner */}
        {project.status === 'DRAFT' && project.clientId && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Project request from client
              </h3>
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                {project.client?.name || 'Client'} has sent a request. Accept to start implementation.
              </p>
            </div>
            <button
              onClick={() => acceptRequest.mutate(project.id)}
              disabled={acceptRequest.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {acceptRequest.isPending ? 'Processing...' : 'Accept'}
            </button>
          </div>
        )}

        {/* Info cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.deadline && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Deadline</div>
                <div className="text-sm font-medium">{formatDate(project.deadline)}</div>
              </div>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="text-sm font-medium">{formatCurrency(Number(project.budget), project.currency)}</div>
              </div>
            </div>
          )}
          {project.client && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Client</div>
                <div className="text-sm font-medium">{project.client.name}</div>
              </div>
            </div>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted"
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Live URL</div>
                <div className="truncate text-sm font-medium text-primary">{project.liveUrl}</div>
              </div>
            </a>
          )}
        </div>

        {project.description && (
          <div className="mt-6 rounded-lg border border-border bg-background p-5">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
          </div>
        )}

        {/* Kanban Board */}
        <div className="mt-8 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Tasks ({tasks.length})
          </h3>
          <AddTaskButton projectId={id} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={`rounded-lg border border-border border-t-4 ${col.color} bg-muted/30 p-3`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{col.label}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border bg-background p-3 transition-shadow hover:shadow-sm"
                    >
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.assignee && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary" title={task.assignee.name}>
                            {task.assignee.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Chat */}
        {project.clientId && (
          <DashboardProjectChat projectId={id} clientId={project.clientId} />
        )}
      </main>
    </>
  );
}

function AddTaskButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const createTask = useCreateTask();
  const { data: team = [] } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      projectId,
      priority,
      assigneeId: assigneeId || undefined,
      dueDate: dueDate || undefined,
    });
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssigneeId('');
    setDueDate('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-2 lg:grid-cols-6">
      <div className="sm:col-span-2 lg:col-span-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task name"
          required
          autoFocus
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Detailed task description for assignee"
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as TaskPriority)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm lg:col-span-1"
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm lg:col-span-1"
      >
        <option value="">Unassigned</option>
        {team
          .filter((m) => m.role !== 'CLIENT')
          .map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm lg:col-span-1"
      />
      <div className="flex items-center gap-2 lg:col-span-1">
        <button
          type="submit"
          disabled={!title.trim() || createTask.isPending}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createTask.isPending ? 'Creating...' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function DashboardProjectChat({ projectId, clientId }: { projectId: string; clientId: string }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const { data: messages } = useProjectConversation(projectId);
  const sendMessage = useSendMessage();
  const markProjectRead = useMarkProjectConversationRead();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => {
      if (msg.projectId === projectId) {
        qc.invalidateQueries({ queryKey: ['project-conversation', projectId] });
      }
    };
    socket.on('new-message', handler);
    return () => { socket.off('new-message', handler); };
  }, [socket, qc, projectId]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      markProjectRead.mutate(projectId);
    }
  }, [open, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !clientId) return;
    await sendMessage.mutateAsync({
      content: input.trim(),
      receiverId: clientId,
      projectId,
    });
    setInput('');
  };

  return (
    <section className="mt-6 rounded-lg border border-border bg-background">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Messages with client</h3>
          {messages && messages.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{messages.length}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {open && (
        <div className="border-t border-border">
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {(!messages || messages.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Start a conversation with the client!
              </p>
            )}
            {messages?.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                    isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {!isMe && (
                      <p className="mb-0.5 text-[10px] font-medium opacity-70">
                        {msg.sender?.name}
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
