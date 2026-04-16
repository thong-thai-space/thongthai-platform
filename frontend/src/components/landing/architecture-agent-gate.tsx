"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileUp, Lock, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  type ArchitectureAgentResponse,
  useArchitectureAgent,
} from "@/hooks/use-ai";
import { AiParticleFormation } from "./ai-particle-formation";
import api from "@/lib/api";

const ALLOWED_FILE_TYPES =
  "image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const DRAFT_STORAGE_KEY = "tts_architecture_agent_draft";
const IMPORT_STORAGE_KEY = "tts_project_request_import";
const POST_AUTH_REDIRECT_KEY = "tts_post_auth_redirect";
const GENERATING_STEPS = [
  "Analyzing project requirements...",
  "Designing system layers and data flow...",
  "Rendering architecture diagram...",
];

interface ArchitectureAgentGateProps {
  canRenderAgent: boolean;
}

export function ArchitectureAgentGate({
  canRenderAgent,
}: ArchitectureAgentGateProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const architectureAgent = useArchitectureAgent();

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ArchitectureAgentResponse | null>(null);
  const [showReviewFormation, setShowReviewFormation] = useState(false);
  const [reviewFxKey, setReviewFxKey] = useState(0);
  const [error, setError] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [generatingStepIndex, setGeneratingStepIndex] = useState(0);
  const [svgBlobUrl, setSvgBlobUrl] = useState("");
  const reviewFxTimerRef = useRef<number | null>(null);
  const shouldAutoResumeRef = useRef(false);
  const hasAutoResumedRef = useRef(false);

  const requiresAuth = !loading && !user;

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { message?: string; autoRun?: boolean };
      if (parsed.message && !message) {
        setMessage(parsed.message);
      }
      shouldAutoResumeRef.current = Boolean(parsed.autoRun);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [message]);

  useEffect(() => {
    if (!canRenderAgent) {
      setIsVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 40);

    return () => window.clearTimeout(timer);
  }, [canRenderAgent]);

  useEffect(() => {
    return () => {
      if (reviewFxTimerRef.current !== null) {
        window.clearTimeout(reviewFxTimerRef.current);
      }
    };
  }, []);

  const svgPreviewUrl = useMemo(() => svgBlobUrl, [svgBlobUrl]);

  useEffect(() => {
    if (!result?.svg) {
      setSvgBlobUrl("");
      return;
    }

    const blob = new Blob([result.svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setSvgBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [result?.svg]);

  useEffect(() => {
    if (!architectureAgent.isPending) {
      setGeneratingStepIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setGeneratingStepIndex((prev) => (prev + 1) % GENERATING_STEPS.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [architectureAgent.isPending]);

  const goToAuth = (mode: "login" | "register") => {
    const redirectPath = "/?openArchitectureAgent=1";
    localStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectPath);
    const redirectTo = encodeURIComponent(redirectPath);
    router.push(`/${mode}?redirectTo=${redirectTo}`);
  };

  const getWorkspacePathByRole = () => {
    if (!user) return "/";
    if (user.role === "CLIENT") return "/portal";
    if (user.role === "MEMBER") return "/member";
    return "/dashboard";
  };

  const generateArchitecture = async (requestMessage: string, attachedFile?: File) => {
    const payload = await architectureAgent.mutateAsync({
      message: requestMessage,
      file: attachedFile,
    });

    if (reviewFxTimerRef.current !== null) {
      window.clearTimeout(reviewFxTimerRef.current);
    }

    setShowReviewFormation(true);
    setReviewFxKey((prev) => prev + 1);
    reviewFxTimerRef.current = window.setTimeout(() => {
      setResult(payload);
      setShowReviewFormation(false);
      reviewFxTimerRef.current = null;
    }, 760);
  };

  const handleGenerate = async () => {
    setError("");
    setResult(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("Please enter your project requirements before viewing the architecture.");
      return;
    }

    if (requiresAuth) {
      try {
        await api.get('/auth/me');
        await generateArchitecture(trimmed, file ?? undefined);
        return;
      } catch {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            message: trimmed,
            fileName: file?.name,
            autoRun: true,
          }),
        );
        setShowAuthDialog(true);
        return;
      }
    }

    try {
      await generateArchitecture(trimmed, file ?? undefined);
    } catch (err: unknown) {
      const messageFromApi =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
            : "Could not generate architecture diagram. Please try again.";

          setError(messageFromApi || "Could not generate architecture diagram. Please try again.");
    }
  };

  useEffect(() => {
    if (loading || !user) return;
    if (!canRenderAgent) return;
    if (!shouldAutoResumeRef.current || hasAutoResumedRef.current) return;

    const trimmed = message.trim();
    if (!trimmed) return;

    hasAutoResumedRef.current = true;
    setError("");
    setResult(null);

    void generateArchitecture(trimmed).catch((err: unknown) => {
      const messageFromApi =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : "Could not generate architecture diagram. Please try again.";

      setError(messageFromApi || "Could not generate architecture diagram. Please try again.");
    });
  }, [loading, user, canRenderAgent, message]);

  const handleDownloadDocx = () => {
    if (!result?.docxBase64) return;

    const binary = atob(result.docxBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ThongThaiSpace_Architecture_Report.docx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAndGoPortal = () => {
    if (!result) return;

    const importedDescription = [
      "[Imported from Landing Architecture Agent]",
      result.description,
      "",
      `Layers: ${result.layers.join(" -> ")}`,
      "",
      "SVG:",
      result.svg,
    ].join("\n");

    localStorage.setItem(
      IMPORT_STORAGE_KEY,
      JSON.stringify({
        name: "Architecture-based Project Request",
        description: importedDescription,
        techStack: result.layers,
      }),
    );

    router.push("/portal/projects/new?import=architecture");
  };

  if (!canRenderAgent) {
    return null;
  }

  return (
    <>
      <div
        className={`mx-auto w-full max-w-5xl px-4 transform-gpu sm:px-6 lg:px-8 ${
          isVisible ? "ai-agent-enter opacity-100" : "-translate-y-5 scale-[0.985] opacity-0 blur-[6px]"
        }`}
      >
        <div className="ai-agent-shell rounded-3xl border border-sky-200/80 bg-white/86 p-4 text-slate-900 shadow-[0_18px_45px_rgba(2,6,23,0.14)] backdrop-blur-md sm:p-5 dark:border-white/20 dark:bg-slate-950/80 dark:text-white dark:shadow-2xl">
          <AiParticleFormation active={isVisible} className="mb-3" />

          <div className="mb-2 flex justify-center">
            <div className="ai-agent-badge inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-500/12 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Architecture Agent
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="How can I help your project today? Describe your requirements, upload a file, then click View Architecture..."
            className={`w-full resize-none rounded-2xl border border-slate-200 bg-white/74 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500 focus:border-cyan-500/60 focus:outline-none dark:border-white/15 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-cyan-400/70 ${
              isVisible ? "ai-agent-stagger-1" : ""
            }`}
          />

          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-3 text-sm ${
              isVisible ? "ai-agent-stagger-2" : ""
            }`}
          >
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300/80 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">
                <Plus className="h-4 w-4" />
                File
                <input
                  type="file"
                  accept={ALLOWED_FILE_TYPES}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {file?.name || "PNG, JPG, DOCX, XLSX, PPTX"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={() => router.push(getWorkspacePathByRole())}
                  className="rounded-xl border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                >
                  {user.role === "CLIENT" ? "Go to Client Portal" : "Go to Workspace"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={architectureAgent.isPending}
                className="rounded-xl bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {architectureAgent.isPending ? "Generating..." : "View Architecture"}
              </button>
            </div>
          </div>

          {error ? <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p> : null}

          {architectureAgent.isPending && !showReviewFormation ? (
            <div className="mt-3 rounded-2xl border border-cyan-300/40 bg-cyan-50/70 p-3 dark:border-cyan-400/25 dark:bg-slate-900/70">
              <p className="text-xs font-medium text-cyan-700 dark:text-cyan-200">
                {GENERATING_STEPS[generatingStepIndex]}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-100 dark:bg-slate-800">
                <div className="ai-agent-progress-bar h-full w-1/3 rounded-full bg-cyan-500" />
              </div>
            </div>
          ) : null}

          {showReviewFormation ? (
            <div className="mt-3 rounded-2xl border border-cyan-300/40 bg-white/70 p-3 dark:border-cyan-400/25 dark:bg-slate-900/75">
              <p className="mb-2 text-xs font-medium text-cyan-700 dark:text-cyan-200">
                Synthesizing architecture review...
              </p>
              <AiParticleFormation
                key={reviewFxKey}
                active={showReviewFormation}
                canvasClassName="h-20 w-full rounded-xl border border-cyan-300/35 bg-white/72 dark:border-cyan-400/20 dark:bg-slate-950/70"
              />
            </div>
          ) : null}

          {result ? (
            <div className="mt-3 rounded-2xl border border-sky-200/70 bg-white/74 p-3 dark:border-white/10 dark:bg-slate-900/70">
              <p className="line-clamp-2 text-xs text-slate-700 dark:text-slate-200">{result.description}</p>

              {svgPreviewUrl ? (
                <div className="mt-2 rounded-lg bg-white p-1">
                  <object
                    data={svgPreviewUrl}
                    type="image/svg+xml"
                    aria-label="Architecture diagram"
                    className="h-44 w-full rounded object-contain"
                  >
                    <p className="p-3 text-xs text-slate-500">
                      Diagram preview is not available in this browser.
                    </p>
                  </object>
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/18 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download DOCX
                </button>

                <button
                  type="button"
                  onClick={handleImportAndGoPortal}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/35 bg-violet-500/12 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-500/18 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  Import to Portal
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showAuthDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl dark:border-white/15 dark:bg-slate-950 dark:text-white">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-200">
              <Lock className="h-4 w-4" />
              Authentication required
            </p>
            <h3 className="mt-2 text-lg font-semibold">Sign in to continue</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              To generate an architecture diagram, please sign in or create an account.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAuthDialog(false)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => goToAuth("login")}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => goToAuth("register")}
                className="rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
