'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAiChat } from '@/hooks/use-ai';
import { useSectionContent } from '@/hooks/use-content';
import { parseAiUiContent } from '@/lib/ai-ui-content';
import { MarkdownContent } from '@/components/ui/markdown-content';

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-xl bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: '0ms' }} />
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: '150ms' }} />
          <span className="typing-dot h-2 w-2 rounded-full bg-muted-foreground/60" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [openPosition, setOpenPosition] = useState<{ x: number; y: number } | null>(null);
  const [showWelcomeNudge, setShowWelcomeNudge] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [conversationId, setConversationId] = useState<string>();
  const chatMutation = useAiChat();
  const { data: aiUiSection } = useSectionContent('ai-ui');
  const aiUi = parseAiUiContent(aiUiSection?.data);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openWindowRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  useEffect(() => {
    if (isOpen) return;

    const showTimer = window.setTimeout(() => {
      setShowWelcomeNudge(true);
    }, 1000);

    const hideTimer = window.setTimeout(() => {
      setShowWelcomeNudge(false);
    }, 9000);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || openPosition) return;

    const margin = 12;
    const estimatedWidth = Math.min(380, window.innerWidth - margin * 2);
    const estimatedHeight = Math.min(500, window.innerHeight - margin * 2);

    setOpenPosition({
      x: Math.max(margin, window.innerWidth - estimatedWidth - 24),
      y: Math.max(margin, window.innerHeight - estimatedHeight - 24),
    });
  }, [isOpen, openPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.isDragging || !openWindowRef.current) return;

      const rect = openWindowRef.current.getBoundingClientRect();
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
      const maxY = Math.max(margin, window.innerHeight - rect.height - margin);

      setOpenPosition({
        x: Math.min(maxX, Math.max(margin, event.clientX - dragStateRef.current.offsetX)),
        y: Math.min(maxY, Math.max(margin, event.clientY - dragStateRef.current.offsetY)),
      });
    };

    const handlePointerUp = () => {
      if (!dragStateRef.current.isDragging) return;
      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = -1;
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !openPosition || !openWindowRef.current) return;

    const syncPositionWithinViewport = () => {
      if (!openWindowRef.current || !openPosition) return;
      const rect = openWindowRef.current.getBoundingClientRect();
      const margin = 8;
      const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
      const maxY = Math.max(margin, window.innerHeight - rect.height - margin);

      setOpenPosition((prev) => {
        if (!prev) return prev;
        return {
          x: Math.min(maxX, Math.max(margin, prev.x)),
          y: Math.min(maxY, Math.max(margin, prev.y)),
        };
      });
    };

    window.addEventListener('resize', syncPositionWithinViewport);
    return () => {
      window.removeEventListener('resize', syncPositionWithinViewport);
    };
  }, [isOpen, openPosition]);

  const startDraggingOpenWindow = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!openWindowRef.current) return;

    const rect = openWindowRef.current.getBoundingClientRect();
    dragStateRef.current = {
      isDragging: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    document.body.style.userSelect = 'none';
  };

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

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
              {showWelcomeNudge && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  onClick={() => {
                    setIsOpen(true);
                    setShowWelcomeNudge(false);
                  }}
                  className="max-w-60 rounded-2xl border border-accent/20 bg-background px-3 py-2 text-left text-xs shadow-lg"
                >
                  <p className="font-medium text-foreground">{aiUi.portalChatOnlineTitle}</p>
                  <p className="mt-0.5 text-muted-foreground">{aiUi.portalChatOnlineSubtitle}</p>
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              key="chat-trigger"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => {
                setIsOpen(true);
                setShowWelcomeNudge(false);
              }}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
            >
              {showWelcomeNudge && (
                <span className="absolute -inset-1 -z-10 rounded-full bg-accent/30 animate-ping" />
              )}
              <Bot className="h-6 w-6" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={openWindowRef}
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-50 flex h-125 w-95 flex-col rounded-2xl border border-border bg-background shadow-2xl"
            style={openPosition ? { left: openPosition.x, top: openPosition.y } : undefined}
          >
            {/* Header */}
            <div
              onPointerDown={startDraggingOpenWindow}
              className="flex cursor-grab touch-none items-center justify-between rounded-t-2xl bg-accent px-4 py-3 text-accent-foreground active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="text-sm font-semibold">{aiUi.portalChatHeaderTitle}</span>
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex h-full items-center justify-center text-center text-sm text-muted-foreground"
                >
                  <p>{aiUi.portalChatWelcomeBody}</p>
                </motion.div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} className="text-sm" />
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {chatMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={aiUi.portalChatInputPlaceholder}
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
