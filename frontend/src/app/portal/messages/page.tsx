'use client';

import { PortalHeader } from '@/components/portal/header';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/lib/socket';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useMarkConversationRead,
} from '@/hooks/use-messages';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { Message } from '@/types';

export default function PortalMessagesPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const qc = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { data: conversations, isLoading: loadingConvos } = useConversations();
  const { data: messages } = useConversation(selectedUserId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['conversation', msg.senderId] });
    };
    socket.on('new-message', handler);
    return () => { socket.off('new-message', handler); };
  }, [socket, qc]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when selecting a conversation
  useEffect(() => {
    if (selectedUserId) {
      markRead.mutate(selectedUserId);
    }
  }, [selectedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUserId) return;
    await sendMessage.mutateAsync({
      content: input.trim(),
      receiverId: selectedUserId,
    });
    setInput('');
  };

  const selectedUser = conversations?.find((c) => c.userId === selectedUserId)?.user;

  return (
    <>
      <PortalHeader title="Messages" />
      <main className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Conversations</h3>
          </div>
          {loadingConvos && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}
          {!loadingConvos && (!conversations || conversations.length === 0) && (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <MessageSquare className="mb-2 h-8 w-8" />
              <p className="text-sm">No messages yet.</p>
            </div>
          )}
          {conversations?.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => setSelectedUserId(conv.userId)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                selectedUserId === conv.userId ? 'bg-muted' : ''
              }`}
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                {conv.user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{conv.user?.name}</span>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 h-5 w-5 shrink-0 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastMessage?.content || ''}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Message area */}
        <div className="flex flex-1 flex-col">
          {!selectedUserId ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-3 h-12 w-12" />
                <p className="text-sm">Select a conversation to start</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent">
                  {selectedUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-sm font-semibold">{selectedUser?.name}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                          isMe
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`mt-1 text-[10px] ${isMe ? 'text-accent-foreground/60' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-border p-4"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sendMessage.isPending}
                  className="rounded-lg bg-accent p-2 text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
