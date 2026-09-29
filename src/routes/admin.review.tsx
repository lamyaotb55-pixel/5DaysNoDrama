import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { PlanPreview } from "@/components/PlanPreview";
import { useAuth } from "@/hooks/useAuth";
import {
  adminPlans,
  checkIsAdmin,
  errorText,
  goalName,
  pendingSubmissions,
  reviewSubmission,
  setHidden,
  type PublicPlan,
} from "@/lib/community";

export const Route = createFileRoute("/admin/review")({
  head: () => ({
    meta: [{ title: "Review — 5 Days No Drama" }, { name: "robots", content: "noindex" }],
  }),
  component: ReviewPage,
});

type Pending = Awaited<ReturnType<typeof pendingSubmissions>>[number];

function ReviewPage() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<Pending[]>([]);
  const [live, setLive] = useState<PublicPlan[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [q, l] = await Promise.all([pendingSubmissions(), adminPlans()]);
    setQueue(q);
    setLive(l);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setAdmin(false);
      return;
    }
    let alive = true;
    checkIsAdmin().then((ok) => {
      if (!alive) return;
      setAdmin(ok);
      if (ok) refresh().catch((e) => setMessage(errorText(e)));
    });
    return () => {
      alive = false;
    };
  }, [user, loading, refresh]);

  const act = async (key: string, fn: () => Promise<void>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      await refresh();
      setMessage(done);
      setOpen(null);
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  if (admin === null) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-24">
        <p className="surface p-5 text-sm text-muted-foreground">Checking access…</p>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">Team only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user
              ? "This account can't review plans."
              : "Sign in with the admin account to review plans."}
          </p>
          <Link
            to={user ? "/" : "/auth"}
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {user ? "Home" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-6 pr-14">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
      </div>
      <header className="pt-8 pb-6">
        <p className="eyebrow text-spicy">Admin</p>
        <h1 className="mt-2 text-4xl leading-[0.9]">Review</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Plans and edits wait here until you approve them. Nothing reaches Plans by You without
          your OK.
        </p>
      </header>

      {message && (
        <p role="status" className="mb-4 rounded-lg bg-secondary p-3 text-sm font-semibold">
          {message}
        </p>
      )}

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl">Waiting</h2>
          <span className="text-xs font-bold text-muted-foreground uppercase tabular-nums">
            {queue.length} to review
          </span>
        </div>
        {queue.length === 0 && (
          <p className="surface mt-3 p-5 text-sm text-muted-foreground">
            All clear. Nothing waiting.
          </p>
        )}
        <ul className="mt-3 space-y-3">
          {queue.map((s) => (
            <li key={s.id} className="surface p-5">
              <p className="eyebrow text-muted-foreground">
                {goalName(s.base)} · by {s.author} ·{" "}
                {s.liveVersion > 0 ? `update to live v${s.liveVersion}` : "new plan"} ·{" "}
                {new Date(s.createdAt).toLocaleDateString()}
              </p>
              <h3 className="mt-1 text-xl leading-tight break-words">{s.name}</h3>
              {s.description && (
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                  {s.description}
                </p>
              )}

              <button
                type="button"
                onClick={() => setOpen(open === s.id ? null : s.id)}
                className="mt-3 text-xs font-bold text-spicy uppercase"
              >
                {open === s.id ? "Hide plan" : "Review all 10 days"}
              </button>
              {open === s.id && s.content && (
                <div className="mt-4">
                  <PlanPreview content={s.content} />
                </div>
              )}

              <label className="mt-4 block">
                <span className="eyebrow text-muted-foreground">Note to author (optional)</span>
                <input
                  id={`note-${s.id}`}
                  value={notes[s.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                  placeholder="e.g. Please replace the Day 3 video"
                  maxLength={300}
                  className="mt-1.5 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    act(
                      s.id,
                      () => reviewSubmission(s.id, false, notes[s.id] ?? ""),
                      `Sent back: ${s.name}`,
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 py-3 text-xs font-bold uppercase disabled:opacity-50"
                >
                  <X className="size-4" aria-hidden /> Reject
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    act(
                      s.id,
                      () => reviewSubmission(s.id, true, notes[s.id] ?? ""),
                      `Approved: ${s.name} is live`,
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success px-4 py-3 text-xs font-bold text-ink uppercase disabled:opacity-50"
                >
                  <Check className="size-4" aria-hidden /> {busy === s.id ? "Saving…" : "Approve"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl">Published</h2>
        {live.length === 0 && (
          <p className="surface mt-3 p-5 text-sm text-muted-foreground">No approved plans yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {live.map((p) => {
            const hidden = p.status === "hidden";
            return (
              <li key={p.id} className="surface flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/plans-by-you/$planId"
                    params={{ planId: p.id }}
                    className="block truncate font-semibold"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">
                    by {p.author} · v{p.version} · {p.followers} followers
                    {hidden ? " · hidden" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    act(
                      p.id,
                      () => setHidden(p.id, !hidden),
                      hidden ? `${p.name} is visible again` : `${p.name} is hidden`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
                >
                  {hidden ? (
                    <>
                      <Eye className="size-3.5" aria-hidden /> Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-3.5" aria-hidden /> Hide
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
