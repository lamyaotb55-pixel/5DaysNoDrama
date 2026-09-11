import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, History, LineChart, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { displayNameOf, initialsOf, useAuth } from "@/hooks/useAuth";
import { getPlan } from "@/lib/program";
import { currentStreak, totalVolume, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — 5 Days No Drama" },
      {
        name: "description",
        content: "Your account, your plan, your streak. Update your name and goal any time.",
      },
      { property: "og:title", content: "Your Profile — 5 Days No Drama" },
      { property: "og:description", content: "Your account, your plan and your streak." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const state = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = getPlan(state.activePlanId ?? undefined);
  const streak = currentStreak(state.history);
  const completedWeeks = Math.floor(state.history.length / 5);
  const prCount = Object.keys(state.prs).length;

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from("profiles")
      .select("display_name, goal")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        setName(data?.display_name ?? displayNameOf(user));
        setGoal(data?.goal ?? "");
      });
    return () => {
      alive = false;
    };
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: name.trim(), goal: goal.trim() || null });
    if (error) setError("Couldn't save just now. Try again.");
    else {
      await supabase.auth.updateUser({ data: { display_name: name.trim() } });
      setSaved(true);
    }
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase">
          <ArrowLeft className="size-3.5 text-spicy" aria-hidden /> Home
        </Link>
      </div>

      <header className="flex items-center gap-4 pt-8 pb-6">
        <span className="grid size-16 place-items-center rounded-full bg-spicy text-xl text-accent-foreground">
          {initialsOf(name || displayNameOf(user))}
        </span>
        <div>
          <p className="eyebrow text-spicy">Profile</p>
          <h1 className="mt-1 text-3xl leading-tight">{name || displayNameOf(user)}</h1>
          {user?.email && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase">{user.email}</p>
          )}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Workouts" value={String(state.history.length)} />
        <Stat label="Streak" value={`${streak}`} accent="bg-acid text-ink" />
        <Stat label="Volume" value={`${Math.round(totalVolume(state.history))}`} />
      </section>

      <section className="surface mt-5 p-5">
        <p className="eyebrow text-muted-foreground">Quick summary</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Mini label="Day streak" value={`${streak}`} />
          <Mini label="Weeks done" value={`${completedWeeks}`} />
          <Mini label="Records" value={`${prCount}`} />
        </div>
        <p className="mt-3 text-[11px] font-semibold text-muted-foreground uppercase">
          {streak > 0 ? "No drama. Just reps." : "Log a workout to start your streak."}
        </p>
      </section>

      <section className="surface mt-5 p-5">
        <p className="eyebrow text-muted-foreground">Current plan</p>
        <p className="mt-1.5 text-xl">{plan ? plan.name : "No plan picked yet"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/progress"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-bold uppercase"
          >
            <LineChart className="size-3.5 text-spicy" aria-hidden /> Progress
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-bold uppercase"
          >
            <History className="size-3.5 text-spicy" aria-hidden /> History
          </Link>
        </div>
      </section>

      <form onSubmit={save} className="surface mt-5 space-y-3.5 p-5">
        <p className="eyebrow text-muted-foreground">Your details</p>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field mt-1.5"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            Goal
          </span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="input-field mt-1.5"
            placeholder="e.g. 5 days a week, no drama"
          />
        </label>
        {error && <p className="text-xs font-bold text-spicy uppercase">{error}</p>}
        {saved && <p className="text-xs font-bold text-success uppercase">✓ Saved</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-spicy px-5 py-3.5 text-sm font-bold text-accent-foreground uppercase disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>

      <button
        type="button"
        onClick={signOut}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-3.5 text-xs font-bold uppercase"
      >
        <LogOut className="size-4" aria-hidden /> Sign out
      </button>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3 text-center">
      <p className="text-xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={"surface px-4 py-4 " + (accent ?? "")}>
      <p className="text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-bold tracking-wide uppercase opacity-70">{label}</p>
    </div>
  );
}
