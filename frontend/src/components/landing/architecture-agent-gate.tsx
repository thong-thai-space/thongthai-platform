"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileUp, Lock, Sparkles } from "lucide-react";
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
      setError("Vui long nhap yeu cau du an truoc khi xem architecture.");
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
      setError("Ban can dang nhap hoac dang ky de su dung Architecture Agent.");
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
          : "Khong the generate architecture diagram. Vui long thu lai.";

      setError(messageFromApi || "Khong the generate architecture diagram. Vui long thu lai.");
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
    <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-6">
          <p className="mb-2 inline-flex items-center gap-2 text-sm text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Architecture Agent Preview
          </p>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Nhap yeu cau du an, AI se generate Architecture Diagram cho ban
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Sau khi generate, ban co the tai DOCX hoac import vao yeu cau du an,
            sau do di tiep den portal client.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <label className="mb-2 block text-sm font-medium">Yeu cau du an</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Mo ta muc tieu, tinh nang, deadline, ngan sach..."
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
            />

            <label className="mt-4 mb-2 block text-sm font-medium">File bo sung (tuy chon)</label>
            <input
              type="file"
              accept={ALLOWED_FILE_TYPES}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500/20 file:px-3 file:py-1 file:text-cyan-200"
            />
            {file?.name ? (
              <p className="mt-2 text-xs text-slate-400">Da chon file: {file.name}</p>
            ) : null}

            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

            {requiresAuth ? (
              <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                <p className="inline-flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Ban can login/register khi bam nut Xem de dung Architecture Agent.
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={architectureAgent.isPending}
                className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {architectureAgent.isPending ? "Dang generate..." : "Xem Architecture"}
              </button>

              {requiresAuth ? (
                <>
                  <button
                    type="button"
                    onClick={() => goToAuth("login")}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                  >
                    Dang nhap
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAuth("register")}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                  >
                    Dang ky
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="mb-3 text-lg font-semibold">Architecture Output</h3>

            {!result ? (
              <p className="text-sm text-slate-400">
                Ket qua se hien o day sau khi ban bam "Xem Architecture".
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
                  <p className="mb-2 text-sm font-medium text-cyan-300">Mo ta kien truc</p>
                  <p className="whitespace-pre-wrap text-sm text-slate-100">
                    {result.description}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white p-2">
                  {/* Render SVG as image data URI for safer display on landing */}
                  {svgPreviewUrl ? (
                    <img
                      src={svgPreviewUrl}
                      alt="Architecture diagram"
                      className="h-auto w-full rounded"
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/25"
                  >
                    <Download className="h-4 w-4" />
                    Tai DOCX
                  </button>

                  <button
                    type="button"
                    onClick={handleImportAndGoPortal}
                    className="inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/25"
                  >
                    <FileUp className="h-4 w-4" />
                    Import vao yeu cau du an va den portal client
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
