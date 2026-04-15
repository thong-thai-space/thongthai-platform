"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileUp, Lock, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  type ArchitectureAgentResponse,
  useArchitectureAgent,
} from "@/hooks/use-ai";

const ALLOWED_FILE_TYPES =
  "image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation";

const DRAFT_STORAGE_KEY = "tts_architecture_agent_draft";
const IMPORT_STORAGE_KEY = "tts_project_request_import";

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
  const [error, setError] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const requiresAuth = !loading && !user;

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { message?: string };
      if (parsed.message && !message) {
        setMessage(parsed.message);
      }
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

  const svgPreviewUrl = useMemo(() => {
    if (!result?.svg) return "";
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}`;
  }, [result?.svg]);

  const goToAuth = (mode: "login" | "register") => {
    const redirectTo = encodeURIComponent("/?openArchitectureAgent=1");
    router.push(`/${mode}?redirectTo=${redirectTo}`);
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
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          message: trimmed,
          fileName: file?.name,
        }),
      );
      setShowAuthDialog(true);
      return;
    }

    try {
      const payload = await architectureAgent.mutateAsync({
        message: trimmed,
        file: file ?? undefined,
      });
      setResult(payload);
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
        className={`mx-auto w-full max-w-5xl px-4 transition-all duration-500 sm:px-6 lg:px-8 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"
        }`}
      >
        <div className="rounded-3xl border border-white/20 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-md sm:p-5">
          <div className="mb-2 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Architecture Agent
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="How can I help your project today? Describe your requirements, upload a file, then click View Architecture..."
            className="w-full resize-none rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400/70 focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 text-slate-300">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-3 py-1.5 transition hover:bg-white/10">
                <Plus className="h-4 w-4" />
                File
                <input
                  type="file"
                  accept={ALLOWED_FILE_TYPES}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-400">
                {file?.name || "PNG, JPG, DOCX, XLSX, PPTX"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

          {result ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
              <p className="line-clamp-2 text-xs text-slate-200">{result.description}</p>

              {svgPreviewUrl ? (
                <div className="mt-2 rounded-lg bg-white p-1">
                  <img
                    src={svgPreviewUrl}
                    alt="Architecture diagram"
                    className="h-28 w-full rounded object-contain"
                  />
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download DOCX
                </button>

                <button
                  type="button"
                  onClick={handleImportAndGoPortal}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/25"
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
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-5 text-white shadow-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-200">
              <Lock className="h-4 w-4" />
              Authentication required
            </p>
            <h3 className="mt-2 text-lg font-semibold">Sign in to continue</h3>
            <p className="mt-2 text-sm text-slate-300">
              To generate an architecture diagram, please sign in or create an account.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAuthDialog(false)}
                className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => goToAuth("login")}
                className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10"
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
