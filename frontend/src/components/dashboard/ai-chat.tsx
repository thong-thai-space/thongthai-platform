'use client';

import { useAiChat } from '@/hooks/use-ai';
import { useSectionContent } from '@/hooks/use-content';
import { chatStore } from '@/stores/chat-store';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { parseAiUiContent } from '@/lib/ai-ui-content';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { useRef, useEffect, useSyncExternalStore, useState, useMemo } from 'react';

export function AiChat() {
  const state = useSyncExternalStore(
    chatStore.subscribe,
    chatStore.getState,
    chatStore.getState,
  );
  const [input, setInput] = useState('');
  const chatMutation = useAiChat();
  const { data: aiUiSection } = useSectionContent('ai-ui');
  const aiUi = useMemo(() => parseAiUiContent(aiUiSection?.data), [aiUiSection?.data]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    chatStore.addMessage({ role: 'user', content: trimmed });
    setInput('');

    chatMutation.mutate(
      { message: trimmed, conversationId: state.conversationId },
      {
        onSuccess: (data) => {
          chatStore.setConversationId(data.conversationId);
          chatStore.addMessage({ role: 'assistant', content: data.message });
        },
        onError: () => {
          chatStore.addMessage({
            role: 'assistant',
            content: 'Sorry, an error occurred. Please try again.',
          });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    chatStore.reset();
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">AI Chat</span>
          {state.conversationId && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {state.conversationId.slice(0, 8)}...
            </span>
          )}
        </div>
        <button
          onClick={handleNewChat}
          className="rounded-lg px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {state.messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {aiUi.dashboardAiChatEmptyState}
</p>
          </div>
        )}
        <div className="space-y-4">
          {state.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownContent content={msg.content} className="text-foreground" />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <User className="h-4 w-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl bg-muted px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={aiUi.dashboardAiChatInputPlaceholder}
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="rounded-lg bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
