import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Conversation, Message } from '@/types';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data),
  });
}

export function useConversation(userId: string) {
  return useQuery<Message[]>({
    queryKey: ['conversation', userId],
    queryFn: () =>
      api.get(`/messages/conversation/${userId}`).then((r) => r.data),
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useProjectConversation(projectId: string) {
  return useQuery<Message[]>({
    queryKey: ['project-conversation', projectId],
    queryFn: () =>
      api.get(`/messages/project/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
    refetchInterval: 10000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string;
      receiverId: string;
      projectId?: string;
    }) => api.post('/messages', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({
        queryKey: ['conversation', variables.receiverId],
      });
      if (variables.projectId) {
        qc.invalidateQueries({
          queryKey: ['project-conversation', variables.projectId],
        });
      }
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) =>
      api.patch(`/messages/read-all/${otherUserId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
