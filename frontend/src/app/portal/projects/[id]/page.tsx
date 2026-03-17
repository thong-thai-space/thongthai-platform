'use client';

import { PortalHeader } from '@/components/portal/header';
import { useProject } from '@/hooks/use-projects';
import {
  useProjectConversation,
  useSendMessage,
  useMarkProjectConversationRead,
} from '@/hooks/use-messages';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  ExternalLink,
  CheckCircle,
  Circle,
  Clock,
  Pencil,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PROPOSAL_SENT: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  REVIEW: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PROPOSAL_SENT: 'Proposal Sent',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const taskStatusLabels: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const taskStatusColors: Record<string, string> = {
  TODO: 'text-gray-400',
  IN_PROGRESS: 'text-blue-500',
  IN_REVIEW: 'text-orange-500',
  DONE: 'text-green-500',
  BLOCKED: 'text-red-500',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function PortalProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <>
        <PortalHeader title="Project Details" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PortalHeader title="Project Details" />
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <p>Project not found.</p>
          <Link href="/portal/projects" className="mt-2 text-accent hover:underline">
            Back to list
          </Link>
        </div>
      </>
    );
  }

  const totalTasks = project.tasks?.length || 0;
  const doneTasks = project.tasks?.filter((t) => t.status === 'DONE').length || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <>
      <PortalHeader title={project.name} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Back */}
        <Link
          href="/portal/projects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Project header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[project.status]}`}
              >
                {statusLabels[project.status]}
              </span>
            </div>
            {project.description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.status === 'DRAFT' && (
              <Link
                href={`/portal/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <ExternalLink className="h-4 w-4" />
                View Website
              </a>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            label="Deadline"
            value={project.deadline ? formatDate(project.deadline) : 'Not set'}
          />
          <InfoCard
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            label="Budget"
            value={
              project.budget
                ? formatCurrency(project.budget, project.currency)
                : 'Not set'
            }
          />
          <InfoCard
            icon={<CheckCircle className="h-5 w-5 text-purple-600" />}
            label="Progress"
            value={`${doneTasks}/${totalTasks} tasks (${progress}%)`}
          />
          <InfoCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            label="Last Updated"
            value={formatDate(project.updatedAt)}
          />
        </div>

        {/* Overall progress bar */}
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold text-accent">{progress}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Milestones */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-base font-semibold">Milestones</h3>
            {!project.milestones || project.milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
            ) : (
              <div className="space-y-3">
                {project.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    {m.isCompleted ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium ${m.isCompleted ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {m.title}
                      </div>
                      {m.description && (
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      )}
                      {m.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {formatDate(m.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-base font-semibold">
              Task List ({totalTasks})
            </h3>
            {!project.tasks || project.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <div className="space-y-2">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <TaskStatusIcon status={task.status} />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-medium ${task.status === 'DONE' ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{taskStatusLabels[task.status]}</span>
                        {task.assignee && <span>• {task.assignee.name}</span>}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority]}`}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-base font-semibold">Technologies Used</h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}
        {/* Project Chat */}
        <ProjectChat projectId={id} />
      </main>
    </>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  const colorClass = taskStatusColors[status] || 'text-gray-400';
  if (status === 'DONE') {
    return <CheckCircle className={`h-5 w-5 shrink-0 ${colorClass}`} />;
  }
  return <Circle className={`h-5 w-5 shrink-0 ${colorClass}`} />;
}

function ProjectChat({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const { data: project } = useProject(projectId);
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

  // Determine who to send messages to (project owner if client, client if admin)
  const receiverId = project?.owner?.id !== user?.id
    ? project?.owner?.id
    : project?.client?.id;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !receiverId) return;
    await sendMessage.mutateAsync({
      content: input.trim(),
      receiverId,
      projectId,
    });
    setInput('');
  };

  return (
    <section className="mt-6 rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold">Project Messages</h3>
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
                No messages yet. Start a conversation!
              </p>
            )}
            {messages?.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                    isMe ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {!isMe && (
                      <p className="mb-0.5 text-[10px] font-medium opacity-70">
                        {msg.sender?.name}
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p className={`mt-1 text-[10px] ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {receiverId ? (
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={!input.trim() || sendMessage.isPending}
                className="rounded-lg bg-accent p-2 text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
              Cannot send messages — no recipient found.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
