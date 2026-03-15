import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api module
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock socket module
vi.mock('@/lib/socket', () => ({
  useSocket: () => ({ socket: null, isConnected: false }),
}));

import api from '@/lib/api';
import { useProjects, useProject } from './use-projects';
import { useTasks, useMyTasks } from './use-tasks';
import {
  useNotifications,
  useUnreadCount,
} from './use-notifications';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch projects list', async () => {
    const projects = [
      { id: 'p1', name: 'Project A' },
      { id: 'p2', name: 'Project B' },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: projects });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(projects);
    expect(api.get).toHaveBeenCalledWith('/projects');
  });
});

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single project by id', async () => {
    const project = { id: 'p1', name: 'Project A', tasks: [] };
    vi.mocked(api.get).mockResolvedValue({ data: project });

    const { result } = renderHook(() => useProject('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(project);
    expect(api.get).toHaveBeenCalledWith('/projects/p1');
  });
});

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch tasks', async () => {
    const tasks = [{ id: 't1', title: 'Task 1' }];
    vi.mocked(api.get).mockResolvedValue({ data: tasks });

    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tasks);
  });

  it('should filter by projectId when provided', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTasks('p1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/tasks', {
      params: { projectId: 'p1' },
    });
  });
});

describe('useMyTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch tasks assigned to current user', async () => {
    const tasks = [{ id: 't1', title: 'My Task' }];
    vi.mocked(api.get).mockResolvedValue({ data: tasks });

    const { result } = renderHook(() => useMyTasks(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(tasks);
    expect(api.get).toHaveBeenCalledWith('/tasks/my');
  });
});

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications', async () => {
    const notifications = [
      { id: 'n1', title: 'New task', isRead: false },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: notifications });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(notifications);
    expect(api.get).toHaveBeenCalledWith('/notifications');
  });
});

describe('useUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch unread notification count', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: 5 });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
  });
});
