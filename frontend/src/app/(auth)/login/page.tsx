"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { TurnstileWidget } from "@/components/security/turnstile-widget";

interface LoginForm {
  email: string;
  password: string;
}

const POST_AUTH_REDIRECT_KEY = "tts_post_auth_redirect";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || undefined;
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const isTurnstileEnabled = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();
  const emailValue = watch("email");
  const canResendVerification = error
    .toLowerCase()
    .includes("verify your email");

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      setResendMessage("");
      if (isTurnstileEnabled && !turnstileToken) {
        setError("Please complete the security challenge.");
        return;
      }

      await login(data.email, data.password, turnstileToken || undefined);
      const redirectTo = searchParams.get("redirectTo");
      const fallbackRedirect =
        typeof window !== "undefined"
          ? localStorage.getItem(POST_AUTH_REDIRECT_KEY)
          : null;
      const finalRedirect = redirectTo || fallbackRedirect || "/dashboard/projects";
      if (typeof window !== "undefined") {
        localStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      }
      router.push(finalRedirect);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Sign in failed. Please try again.";
      setError(message || "Sign in failed. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    if (!emailValue) {
      setResendMessage("Please enter your email first.");
      return;
    }

    try {
      setIsResending(true);
      setResendMessage("");
      const { data } = await api.post("/auth/resend-verification", {
        email: emailValue,
      });
      setResendMessage(
        data?.message || "If eligible, a new verification email has been sent.",
      );
    } catch {
      setResendMessage("Could not resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-2xl font-bold">
              Thong Thai<span className="text-primary"> Space</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <button
            type="button"
            onClick={() => loginWithGoogle(redirectTo)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                {...register("email", {
                  required: "Please enter your email",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="email@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  {...register("password", {
                    required: "Please enter your password",
                  })}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {canResendVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full rounded-lg border border-border py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isResending
                  ? "Sending verification email..."
                  : "Resend verification email"}
              </button>
            )}

            {resendMessage && (
              <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                {resendMessage}
              </div>
            )}

            <TurnstileWidget
              onTokenChange={setTurnstileToken}
              className="flex justify-center"
            />

            <button
              type="submit"
              disabled={isSubmitting || (isTurnstileEnabled && !turnstileToken)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={
                searchParams.get("redirectTo")
                  ? `/register?redirectTo=${encodeURIComponent(searchParams.get("redirectTo") || "")}`
                  : "/register"
              }
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up now
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link
              href="/terms-and-conditions"
              className="underline hover:text-foreground"
            >
              Terms and Conditions
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="underline hover:text-foreground"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
