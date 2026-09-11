import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Create Your Account — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Register or sign in to 5 Days No Drama to keep your plan, progress and workout history in one place.",
      },
      { property: "og:title", content: "Create Your Account — 5 Days No Drama" },
      {
        property: "og:description",
        content: "Register in seconds and keep your plan, progress and history together.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/profile", replace: true });
  }, [loading, isAuthenticated, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Check your inbox and tap the confirmation link to finish signing up.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in didn't work. Try again or use your email.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/profile" });
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase">
          <ArrowLeft className="size-3.5 text-spicy" aria-hidden /> Home
        </Link>
      </div>

      <header className="pt-8 pb-6">
        <p className="eyebrow text-spicy">No drama. Just reps.</p>
        <h1 className="mt-3 text-4xl leading-[0.9]">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground uppercase">
          Keep your plan, progress and history in one place.
        </p>
      </header>

      <div className="surface p-5">
        <div className="mb-5 flex gap-2 rounded-full bg-secondary p-1">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={
                "flex-1 rounded-full px-3 py-2.5 text-xs font-bold uppercase " +
                (mode === m ? "bg-spicy text-accent-foreground" : "text-ink")
              }
            >
              {m === "signup" ? "Register" : "Sign in"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === "signup" && (
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                className="input-field"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="input-field"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="input-field"
            />
          </Field>

          {error && <p className="text-xs font-bold text-spicy uppercase">{error}</p>}
          {info && (
            <p className="rounded-2xl bg-ice/40 px-4 py-3 text-xs font-bold text-ink uppercase">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-spicy px-5 py-3.5 text-sm font-bold tracking-wide text-accent-foreground uppercase disabled:opacity-60"
          >
            {busy ? "One sec…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          className="w-full rounded-full border border-border px-5 py-3.5 text-sm font-bold uppercase"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
