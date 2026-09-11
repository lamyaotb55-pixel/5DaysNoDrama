import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, Dumbbell, Footprints, LineChart, Pencil, Undo2 } from "lucide-react";
import {
  WEEKS,
  dayInWeek,
  estimateMinutes,
  getPlan,
  weekDays,
  type Day,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
  canSkip,
  choosePlan,
  completedWeeks,
  effectiveDay,
  markWalkDone,
  planProgress,
  sessionKey,
  skipDay,
  skippedDayInWeek,
  unskipDay,
  useStore,
  weekProgress,
} from "@/lib/store";

export const Route = createFileRoute("/plan/$planId")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const title = plan ? `${plan.name} — 8 Week Plan | 5 Days No Drama` : "Plan | 5 Days No Drama";
    const description = plan
      ? `${plan.slogan} ${plan.goal} Eight weeks, five training days a week, every set tracked.`
      : "Eight weeks of five training days with set-by-set tracking.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PlanPage,
});

function PlanPage() {
  const { planId } = Route.useParams();
  const state = useStore();
  const basePlan = getPlan(planId);
  const accent = planAccent(planId);
  const [skipTarget, setSkipTarget] = useState<Day | null>(null);

  const firstOpenWeek = (() => {
    if (!basePlan) return 1;
    for (let w = 1; w <= WEEKS; w++) {
      const p = weekProgress(basePlan, w, state.completed, state.skips);
      if (p.done + p.skipped < p.total) return w;
    }
    return WEEKS;
  })();
  const [week, setWeek] = useState(firstOpenWeek);
  const shownWeek = Math.min(Math.max(week, 1), WEEKS);

  if (!basePlan) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">Plan not found</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            Choose a plan
          </Link>
        </div>
      </main>
    );
  }

  const plan = basePlan;
  const days = weekDays(plan, shownWeek).map((d) => effectiveDay(plan.id, d, state.customDays));
  const wp = weekProgress(plan, shownWeek, state.completed, state.skips);
  const overall = planProgress(plan, state.completed, state.skips);
  const weeksDone = completedWeeks(plan, state.completed, state.skips);
  const weekDone = wp.done + wp.skipped >= wp.total;
  const skippedThisWeek = skippedDayInWeek(plan.id, shownWeek, state.skips);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-8">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/customize/$planId"
            params={{ planId: plan.id }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <Pencil className="size-3.5 text-spicy" aria-hidden /> Plan details
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <LineChart className="size-3.5 text-spicy" aria-hidden /> Progress
          </Link>
        </div>
      </div>

      <header className="mt-5">
        <p className={`eyebrow ${accent.text}`}>{plan.label} · 8 weeks</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">{plan.name}</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">{plan.slogan}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.goal}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (overall.pct >= 100 ? "bg-success" : "bg-spicy")
            }
            style={{ width: `${overall.pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase">
          {overall.done}/{overall.total} days · {weeksDone}/{WEEKS} weeks done
        </p>
      </header>

      <nav aria-label="Weeks" className="-mx-5 mt-6 overflow-x-auto px-5">
        <ul className="flex gap-2 pb-1">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => {
            const p = weekProgress(plan, w, state.completed, state.skips);
            const full = p.done + p.skipped >= p.total;
            const isActive = w === shownWeek;
            return (
              <li key={w}>
                <button
                  type="button"
                  onClick={() => setWeek(w)}
                  aria-current={isActive ? "true" : undefined}
                  className={
                    "inline-flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-2 text-[10px] font-bold uppercase " +
                    (isActive
                      ? "border-transparent bg-spicy text-accent-foreground"
                      : full
                        ? "border-transparent bg-success text-ink"
                        : "border-border bg-card text-muted-foreground")
                  }
                >
                  <span className="font-display text-base leading-none">W{w}</span>
                  <span className="mt-1">
                    {full ? "✓ done" : `${p.done + p.skipped}/${p.total}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="surface mt-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">Week {shownWeek} of {WEEKS}</p>
            <p className="mt-1 text-xl">
              {wp.done + wp.skipped}/{wp.total} days {weekDone ? "✓ that's the week" : "done"}
            </p>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
              (skippedThisWeek ? "bg-ice text-ink" : "bg-secondary text-muted-foreground")
            }
          >
            {skippedThisWeek ? "Skip used" : "1 skip left"}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground uppercase">
          One skip per week — but you walk 10K steps instead. No drama.
        </p>
      </section>

      <div className="mt-5 space-y-3">
        {days.map((day) => {
          const key = sessionKey(plan.id, day.day);
          const completed = Boolean(state.completed[key]);
          const inProgress = Boolean(state.active[key]);
          const skipped = Boolean(state.skips[key]);
          const walked = Boolean(state.walks[key]);
          const count = day.exercises.length + (day.circuit ? 1 : 0);
          const skipAllowed = canSkip(plan.id, day.day, state);
          return (
            <article key={day.day} className={"surface p-5 " + (skipped ? "opacity-90" : "")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`day-number ${completed ? "text-success" : skipped ? "text-ice" : accent.text}`}
                  >
                    {String(dayInWeek(day.day)).padStart(2, "0")}
                  </span>
                  <div className="pt-1">
                    <h2 className="text-xl leading-tight">{day.title}</h2>
                    <p className="text-sm font-semibold text-muted-foreground">{day.focus}</p>
                    <p className="mt-2 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                      <span className="inline-flex items-center gap-1">
                        <Dumbbell className="size-3" aria-hidden /> {count} exercises
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden /> ~{estimateMinutes(day)} min
                      </span>
                    </p>
                  </div>
                </div>
                {completed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    <Check className="size-3" aria-hidden /> Complete
                  </span>
                ) : skipped ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    <Footprints className="size-3" aria-hidden /> Skipped
                  </span>
                ) : inProgress ? (
                  <span className="rounded-full bg-bubblegum px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    In progress
                  </span>
                ) : null}
              </div>

              {skipped ? (
                <div className="mt-4 rounded-2xl bg-ice/40 p-4">
                  <p className="text-xs font-bold text-ink uppercase">
                    Skipped — but you walk +10K steps!!
                  </p>
                  <label className="mt-2.5 flex items-center gap-2 text-xs font-bold uppercase">
                    <input
                      type="checkbox"
                      checked={walked}
                      onChange={(e) => markWalkDone(plan.id, day.day, e.target.checked)}
                      className="size-4 accent-[var(--success)]"
                    />
                    {walked ? "✓ 10K steps done" : "Mark 10K steps done"}
                  </label>
                  <button
                    type="button"
                    onClick={() => unskipDay(plan.id, day.day)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-[11px] font-bold uppercase"
                  >
                    <Undo2 className="size-3.5 text-spicy" aria-hidden /> Undo skip
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/workout/$planId/$day"
                    params={{ planId: plan.id, day: String(day.day) }}
                    onClick={() => choosePlan(plan.id)}
                    className={
                      "mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-xs font-bold tracking-wide uppercase " +
                      (completed ? "bg-secondary text-ink" : "bg-spicy text-accent-foreground")
                    }
                  >
                    {completed ? "Repeat Workout" : inProgress ? "Resume Workout" : "Start Workout"}
                  </Link>
                  {!completed && (
                    <button
                      type="button"
                      disabled={!skipAllowed}
                      onClick={() => setSkipTarget(day)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card px-5 py-3 text-[11px] font-bold uppercase disabled:opacity-40"
                    >
                      <Footprints className="size-3.5 text-ice-foreground" aria-hidden />
                      {skipAllowed ? "Skip But Will Walk +10K Steps!!" : "Skip already used this week"}
                    </button>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>

      {skipTarget && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            <Footprints className="mx-auto size-7 text-spicy" aria-hidden />
            <h2 className="mt-2 text-xl">Skip But Will Walk +10K Steps!!</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Week {weekOfSafe(skipTarget.day)}, Day {dayInWeek(skipTarget.day)} —{" "}
              {skipTarget.title}. This is your one skip this week, and the deal is 10,000 steps.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSkipTarget(null)}
                className="flex-1 rounded-full border border-border px-4 py-3 text-xs font-bold uppercase"
              >
                I'll train
              </button>
              <button
                type="button"
                onClick={() => {
                  skipDay(plan.id, skipTarget.day);
                  setSkipTarget(null);
                }}
                className="flex-1 rounded-full bg-spicy px-4 py-3 text-xs font-bold text-accent-foreground uppercase"
              >
                Deal — I'll walk
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function weekOfSafe(absDayNo: number) {
  return Math.ceil(absDayNo / 5);
}
