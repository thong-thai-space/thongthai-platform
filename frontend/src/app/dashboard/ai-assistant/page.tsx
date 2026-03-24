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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

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
  { key: 'breakdown', icon: GitBranch, label: 'Tasks', color: 'text-purple-500' },
  { key: 'review', icon: Code, label: 'Review', color: 'text-green-500' },
  { key: 'estimate', icon: Calculator, label: 'Estimate', color: 'text-blue-500' },
  { key: 'report', icon: BarChart3, label: 'Report', color: 'text-rose-500' },
  { key: 'strategy', icon: Sparkles, label: 'Strategy', color: 'text-indigo-500' },
  { key: 'governance', icon: ShieldCheck, label: 'Gov', color: 'text-slate-600' },
];

export default function AiAssistantPage() {
  const searchParams = useSearchParams();
  const initialTool = searchParams.get('tool') as AiTool | null;
  const initialProjectId = searchParams.get('projectId') ?? undefined;

  const [activeTool, setActiveTool] = useState<AiTool>(
    initialTool && tools.some((tool) => tool.key === initialTool) ? initialTool : 'chat',
  );

  return (
    <>
      <DashboardHeader title="AI Assistant" />
      <main className="flex flex-1 overflow-hidden">
        {/* Tool sidebar */}
        <div className="flex w-20 flex-col items-center gap-1 border-r border-border bg-muted/30 py-3">
          {tools.map((tool) => (
            <button
              key={tool.key}
              onClick={() => setActiveTool(tool.key)}
              className={cn(
                'flex w-16 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[10px] transition-colors',
                activeTool === tool.key
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
              title={tool.label}
            >
              <tool.icon className={cn('h-5 w-5', activeTool === tool.key ? tool.color : '')} />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Content — keep all mounted, hide inactive to preserve state */}
        <div className="flex-1 overflow-hidden">
          <div className={activeTool === 'chat' ? 'h-full' : 'hidden'}><AiChat /></div>
          <div className={activeTool === 'proposal' ? 'h-full' : 'hidden'}><AiProposal initialProjectId={initialProjectId} /></div>
          <div className={activeTool === 'breakdown' ? 'h-full' : 'hidden'}><AiTaskBreakdown initialProjectId={initialProjectId} /></div>
          <div className={activeTool === 'review' ? 'h-full' : 'hidden'}><AiCodeReview /></div>
          <div className={activeTool === 'estimate' ? 'h-full' : 'hidden'}><AiEstimate initialProjectId={initialProjectId} /></div>
          <div className={activeTool === 'report' ? 'h-full' : 'hidden'}><AiProgressReport /></div>
          <div className={activeTool === 'strategy' ? 'h-full' : 'hidden'}><AiStrategicPlan /></div>
          <div className={activeTool === 'governance' ? 'h-full' : 'hidden'}><AiGovernance /></div>
        </div>
      </main>
    </>
  );
}
