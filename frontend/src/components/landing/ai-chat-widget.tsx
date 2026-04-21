'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { usePublicAiChat } from '@/hooks/use-ai';
import { useSectionContent } from '@/hooks/use-content';
import { parseAiUiContent } from '@/lib/ai-ui-content';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { ChatFaceAvatar } from '@/components/landing/chat-face-avatar';

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

export function PublicAiChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openPosition, setOpenPosition] = useState<{ x: number; y: number } | null>(null);
  const [launcherPosition, setLauncherPosition] = useState<{ x: number; y: number } | null>(null);
  const [showWelcomeNudge, setShowWelcomeNudge] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const chatMutation = usePublicAiChat();
  const { data: aiUiSection } = useSectionContent('ai-ui');
  const aiUi = parseAiUiContent(aiUiSection?.data);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openWindowRef = useRef<HTMLDivElement>(null);
  const launcherWrapperRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
  });
  const launcherDragRef = useRef({
    isDragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    didDrag: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const estimatedWidth = Math.min(360, window.innerWidth - margin * 2);
    const estimatedHeight = Math.min(480, window.innerHeight - margin * 2);

    setOpenPosition({
      x: Math.max(margin, window.innerWidth - estimatedWidth - 24),
      y: Math.max(margin, window.innerHeight - estimatedHeight - 24),
    });
  }, [isOpen, openPosition]);

  useEffect(() => {
    if (launcherPosition) return;
    const size = 80;
    const margin = 24;
    setLauncherPosition({
      x: Math.max(8, window.innerWidth - size - margin),
      y: Math.max(8, window.innerHeight - size - margin),
    });
  }, [launcherPosition]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (dragStateRef.current.isDragging && openWindowRef.current) {
        const rect = openWindowRef.current.getBoundingClientRect();
        const margin = 8;
        const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxY = Math.max(margin, window.innerHeight - rect.height - margin);

        setOpenPosition({
          x: Math.min(maxX, Math.max(margin, event.clientX - dragStateRef.current.offsetX)),
          y: Math.min(maxY, Math.max(margin, event.clientY - dragStateRef.current.offsetY)),
        });
        return;
      }

      if (launcherDragRef.current.isDragging && launcherWrapperRef.current) {
        const rect = launcherWrapperRef.current.getBoundingClientRect();
        const margin = 8;
        const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
        const maxY = Math.max(margin, window.innerHeight - rect.height - margin);

        const diffX = Math.abs(event.clientX - launcherDragRef.current.startX);
        const diffY = Math.abs(event.clientY - launcherDragRef.current.startY);
        if (diffX > 4 || diffY > 4) {
          launcherDragRef.current.didDrag = true;
        }

        setLauncherPosition({
          x: Math.min(maxX, Math.max(margin, event.clientX - launcherDragRef.current.offsetX)),
          y: Math.min(maxY, Math.max(margin, event.clientY - launcherDragRef.current.offsetY)),
        });
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current.isDragging = false;
      dragStateRef.current.pointerId = -1;

      launcherDragRef.current.isDragging = false;
      launcherDragRef.current.pointerId = -1;

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

  const startDraggingLauncher = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!launcherWrapperRef.current) return;

    const rect = launcherWrapperRef.current.getBoundingClientRect();
    launcherDragRef.current = {
      isDragging: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      didDrag: false,
    };

    document.body.style.userSelect = 'none';
  };

  const handleOpenByLauncher = () => {
    if (launcherDragRef.current.didDrag) {
      launcherDragRef.current.didDrag = false;
      return;
    }

    setIsOpen(true);
    setShowWelcomeNudge(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    try {
      const result = await chatMutation.mutateAsync({ message: userMessage });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.message },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again later.',
        },
      ]);
    }
  };

  const content = (
    <>
      <AnimatePresence>
        {!isOpen && (
          <div
            ref={launcherWrapperRef}
            className="fixed z-50 flex flex-col items-end gap-2"
            style={launcherPosition ? { left: launcherPosition.x, top: launcherPosition.y } : { right: 24, bottom: 24 }}
          >
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
                  className="max-w-60 rounded-2xl border border-primary/20 bg-background px-3 py-2 text-left text-xs shadow-lg"
                >
                  <p className="font-medium text-foreground">{aiUi.publicChatOnlineTitle}</p>
                  <p className="mt-0.5 text-muted-foreground">{aiUi.publicChatOnlineSubtitle}</p>
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              key="chat-trigger"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onPointerDown={startDraggingLauncher}
              onClick={handleOpenByLauncher}
              className="relative flex h-20 w-20 items-end justify-center bg-transparent text-primary-foreground transition-transform hover:scale-105"
            >
              {showWelcomeNudge && (
                <span className="absolute bottom-2 left-1/2 -z-10 h-5 w-14 -translate-x-1/2 rounded-full bg-primary/25 blur-md animate-pulse" />
              )}
              <ChatFaceAvatar
                size={82}
                variant="fullbody"
                renderMode="image"
                className="pointer-events-none drop-shadow-[0_12px_18px_rgba(37,99,235,0.28)]"
              />
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
            className="fixed z-50 flex h-120 w-[min(22.5rem,calc(100vw-1.25rem))] flex-col rounded-2xl border border-border bg-background shadow-2xl"
            style={openPosition ? { left: openPosition.x, top: openPosition.y } : undefined}
          >
            <div
              onPointerDown={startDraggingOpenWindow}
              className="absolute inset-x-0 top-0 z-0 h-10 cursor-grab touch-none active:cursor-grabbing"
              aria-hidden="true"
            />
            <div className="absolute right-3 top-3 z-10 flex gap-1">
              <button onClick={() => setIsOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-muted">
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMessages([]);
                }}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 pt-11 space-y-3">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3 text-center text-sm text-muted-foreground"
                >
                  <div className="mx-auto w-fit">
                    <ChatFaceAvatar size={54} variant="fullbody" renderMode="image" />
                  </div>
                  <p className="font-medium">{aiUi.publicChatWelcomeTitle}</p>
                  <p>{aiUi.publicChatWelcomeBody}</p>
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
                        ? 'bg-primary text-primary-foreground'
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
                placeholder={aiUi.publicChatInputPlaceholder}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
