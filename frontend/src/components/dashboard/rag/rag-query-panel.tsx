'use client';

import { useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { useQueryKnowledge, useReviewAnswer } from '@/hooks/use-rag';
import { extractApiErrorMessage } from '@/lib/api-error';
import type { RagAnswerDraft, RagAnswerStatus } from '@/types';

const STATUS_TONE: Record<RagAnswerStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  APPROVED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  REJECTED: 'bg-destructive/15 text-destructive',
};

/**
 * Pattern: Client Island + Human-in-the-loop — asks the knowledge base, shows
 * the AI's DRAFT answer with its cited sources, and lets a human approve or
 * reject it before it counts as delivered.
 */
export function RagQueryPanel({ clientId }: { clientId: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<RagAnswerDraft | null>(null);

  const query = useQueryKnowledge();
  const review = useReviewAnswer();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || query.isPending || question.trim().length < 3) return;
    query.mutate(
      { clientId, question: question.trim() },
      { onSuccess: (draft) => setAnswer(draft) },
    );
  };

  const handleReview = (decision: 'APPROVE' | 'REJECT') => {
    if (!answer || review.isPending) return;
    review.mutate(
      { answerId: answer.id, decision },
      { onSuccess: (updated) => setAnswer(updated) },
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <form onSubmit={handleAsk} className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Ask this client&apos;s knowledge base
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            placeholder="e.g. How do refunds work?"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!clientId || query.isPending || question.trim().length < 3}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {query.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Ask
          </button>
        </div>
      </form>

      {query.isError && (
        <p className="text-xs text-destructive">
          {extractApiErrorMessage(query.error)}
        </p>
      )}

      {answer && (
        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {answer.question}
            </span>
            <span
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[answer.status]}`}
            >
              {answer.status}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {answer.draftAnswer}
          </p>

          <p className="text-xs text-muted-foreground">
            {answer.citedChunkIds.length > 0
              ? `Grounded in ${answer.citedChunkIds.length} source${
                  answer.citedChunkIds.length === 1 ? '' : 's'
                }.`
              : 'No sources retrieved — answer is ungrounded; review carefully.'}
          </p>

          {review.isError && (
            <p className="text-xs text-destructive">
              {extractApiErrorMessage(review.error)}
            </p>
          )}

          {answer.status === 'DRAFT' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleReview('APPROVE')}
                disabled={review.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
              >
                <Check className="h-3 w-3" /> Approve
              </button>
              <button
                type="button"
                onClick={() => handleReview('REJECT')}
                disabled={review.isPending}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <X className="h-3 w-3" /> Reject
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Reviewed — this draft is now {answer.status.toLowerCase()}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
