'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { AiChat } from '@/components/dashboard/ai-chat';
import { AiProposal } from '@/components/dashboard/ai-proposal';
import { AiTaskBreakdown } from '@/components/dashboard/ai-task-breakdown';
import { AiCodeReview } from '@/components/dashboard/ai-code-review';
import { AiEstimate } from '@/components/dashboard/ai-estimate';
import { AiProgressReport } from '@/components/dashboard/ai-progress-report';
import { AiStrategicPlan } from '@/components/dashboard/ai-strategic-plan';
import { AiGovernance } from '@/components/dashboard/ai-governance';
import {
  Bot,
  FileText,
  GitBranch,
  Code,
  Calculator,
  BarChart3,
  Sparkles,
  ShieldCheck,
  ArrowUp,
  Plus,
  ChevronsUpDown,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useAiChat } from '@/hooks/use-ai';
import { chatStore } from '@/stores/chat-store';
import { motion } from 'framer-motion';

type AiTool =
  | 'chat'
  | 'proposal'
  | 'breakdown'
  | 'review'
  | 'estimate'
  | 'report'
  | 'strategy'
  | 'governance';

const tools: { key: AiTool; icon: typeof Bot; label: string; color: string }[] = [
  { key: 'chat', icon: Bot, label: 'Chat', color: 'text-primary' },
  { key: 'proposal', icon: FileText, label: 'Proposal', color: 'text-amber-500' },
  { key: 'breakdown', icon: GitBranch, label: 'Task', color: 'text-purple-500' },
  { key: 'review', icon: Code, label: 'Review code', color: 'text-green-500' },
  { key: 'estimate', icon: Calculator, label: 'Estimate', color: 'text-blue-500' },
  { key: 'report', icon: BarChart3, label: 'Report', color: 'text-rose-500' },
  { key: 'strategy', icon: Sparkles, label: 'Strategy', color: 'text-indigo-500' },
  { key: 'governance', icon: ShieldCheck, label: 'Gov', color: 'text-slate-600' },
];

const modelOptions = [
  { value: 'claude-sonnet-4-20250514', label: 'Sonnet 4' },
  { value: 'claude-3-7-sonnet-20250219', label: 'Sonnet 3.7' },
  { value: 'claude-opus-4-20250514', label: 'Opus 4' },
] as const;

const MODEL_STORAGE_KEY = 'tts.ai.selectedModel';

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<AiTool>('chat');
  const [quickPrompt, setQuickPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<(typeof modelOptions)[number]['value']>(
    modelOptions[0].value,
  );
  const chatMutation = useAiChat();

  const selectedModelLabel = useMemo(
    () => modelOptions.find((option) => option.value === selectedModel)?.label || 'Unknown model',
    [selectedModel],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (!saved) return;
    const isValid = modelOptions.some((option) => option.value === saved);
    if (isValid) {
      setSelectedModel(saved as (typeof modelOptions)[number]['value']);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  const handleQuickSend = () => {
    const trimmed = quickPrompt.trim();
    if (!trimmed || chatMutation.isPending) return;

    setActiveTool('chat');
    chatStore.addMessage({ role: 'user', content: trimmed });
    setQuickPrompt('');

    chatMutation.mutate(
      {
        message: trimmed,
        conversationId: chatStore.getState().conversationId,
        model: selectedModel,
      },
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

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickSend();
    }
  };

  return (
    <>
      <DashboardHeader title="AI Assistant" />
      <main className="flex-1 overflow-y-auto p-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-3xl border border-zinc-700/60 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 text-zinc-100 shadow-xl"
        >
          <div className="mx-auto max-w-5xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              <span className="mr-3 text-orange-400">*</span>
              Hey there, {user?.name || 'there'}
            </h1>

            <div className="mt-6 rounded-3xl border border-zinc-700/80 bg-zinc-900/70 p-4 sm:p-6">
              <textarea
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                onKeyDown={handlePromptKeyDown}
                rows={4}
                placeholder="How can I help you today?"
                className="w-full resize-none bg-transparent text-lg text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
              />

              <div className="mt-4 flex items-center justify-between border-t border-zinc-700/80 pt-4">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                  aria-label="Attach content"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as (typeof modelOptions)[number]['value'])}
                      className="appearance-none rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 pr-8 text-sm text-zinc-200 outline-none transition-colors hover:border-zinc-500"
                      aria-label="Choose AI model"
                    >
                      {modelOptions.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  </div>

                  <button
                    onClick={handleQuickSend}
                    disabled={!quickPrompt.trim() || chatMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUp className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
              }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {tools.map((tool) => (
                <motion.button
                  key={`quick-${tool.key}`}
                  onClick={() => setActiveTool(tool.key)}
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                    activeTool === tool.key
                      ? 'border-orange-400/70 bg-orange-500/10 text-orange-200'
                      : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100',
                  )}
                >
                  <tool.icon className="h-4 w-4" />
                  {tool.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: 0.1 }}
          className="mt-6"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            {tools.map((tool) => (
              <button
                key={tool.key}
                onClick={() => setActiveTool(tool.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  activeTool === tool.key
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
                title={tool.label}
              >
                <tool.icon className={cn('h-4 w-4', activeTool === tool.key ? tool.color : '')} />
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          <div className="h-[68vh] min-h-140 overflow-hidden rounded-2xl border border-border bg-background">
            {/* Keep all mounted to preserve each tool state while switching tabs */}
            <div className={activeTool === 'chat' ? 'h-full' : 'hidden'}><AiChat model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'proposal' ? 'h-full' : 'hidden'}><AiProposal model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'breakdown' ? 'h-full' : 'hidden'}><AiTaskBreakdown model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'review' ? 'h-full' : 'hidden'}><AiCodeReview model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'estimate' ? 'h-full' : 'hidden'}><AiEstimate model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'report' ? 'h-full' : 'hidden'}><AiProgressReport model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'strategy' ? 'h-full' : 'hidden'}><AiStrategicPlan model={selectedModel} modelLabel={selectedModelLabel} /></div>
            <div className={activeTool === 'governance' ? 'h-full' : 'hidden'}><AiGovernance /></div>
          </div>
        </motion.section>
      </main>
    </>
  );
}
