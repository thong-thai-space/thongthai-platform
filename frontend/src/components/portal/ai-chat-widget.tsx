'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2 } from 'lucide-react';
import { useAiChat } from '@/hooks/use-ai';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [conversationId, setConversationId] = useState<string>();
  const chatMutation = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const result = await chatMutation.mutateAsync({
        message: userMessage,
        conversationId,
      });
      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' },
      ]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-2xl border border-border bg-background shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-accent px-4 py-3 text-accent-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="text-sm font-semibold">AI Assistant</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsOpen(false)} className="rounded p-1 hover:bg-accent-foreground/10">
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setMessages([]);
              setConversationId(undefined);
            }}
            className="rounded p-1 hover:bg-accent-foreground/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            <p>Hello! I can help you ask about your projects.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!input.trim() || chatMutation.isPending}
          className="rounded-lg bg-accent p-2 text-accent-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
