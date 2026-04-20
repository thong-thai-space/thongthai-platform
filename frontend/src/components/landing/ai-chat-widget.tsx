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
  const [showWelcomeNudge, setShowWelcomeNudge] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const chatMutation = usePublicAiChat();
  const { data: aiUiSection } = useSectionContent('ai-ui');
  const aiUi = parseAiUiContent(aiUiSection?.data);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
              onClick={() => {
                setIsOpen(true);
                setShowWelcomeNudge(false);
              }}
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
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex h-120 w-[min(22.5rem,calc(100vw-1.25rem))] flex-col rounded-2xl border border-border bg-background shadow-2xl"
          >
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
