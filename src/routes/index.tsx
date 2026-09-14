import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Pencil, RotateCcw, Shuffle, Zap } from "lucide-react";
import {
  PLANS,
  WEEKS,
  dayInWeek,
  estimateMinutes,
  getPlan,
  phaseInfo,
  phaseOf,
  weekGoal,
  weekOf,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
  choosePlan,
  clearPlan,
  completedWeeks,
  currentStreak,
  effectiveDay,
  nextWorkout,
  planProgress,
  restartPlan,
  useStore,
  weekProgress,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        name: "description",
        content:
          "No drama. Just reps. Pick Lose Weight, Tone Up or Build Muscle — five training days, every set tracked, progress you can see.",
      },
      { property: "og:title", content: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        property: "og:description",
        content: "Three plans. Five days. Every set tracked. No drama, just reps.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const state = useStore();
  const activePlan = getPlan(state.activePlanId ?? undefined);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-6 pr-14">
        <Link to="/theme" className="eyebrow text-spicy">
          5 Days No Drama
        </Link>
        <Link
          to="/progress"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
        >
          <LineChart className="size-3.5 text-spicy" aria-hidden /> Progress
        </Link>
      </div>

      <section className="pt-8 pb-7">
        <span className="eyebrow inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-ink">
          <Zap className="size-3 text-spicy" aria-hidden /> 3 plans · 8 weeks · 5 days a week
        </span>
        <h1 className="mt-5 text-5xl leading-[0.88] sm:text-6xl">
          5 Days
          <br />
          <span className="text-spicy">No Drama.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm font-semibold text-muted-foreground uppercase">
          No drama. Just reps. Pick your plan, open the day, log every set.
        </p>
      </section>

      {activePlan ? (
        <CurrentPlanCard planId={activePlan.id} state={state} />
      ) : (
        <div className="space-y-4">
          {PLANS.map((plan) => {
            const accent = planAccent(plan.id);
            return (
              <article key={plan.id} className="surface overflow-hidden">
                <div className={`${accent.bg} ${accent.on} px-5 py-6`}>
                  <p className="eyebrow opacity-80">{plan.label}</p>
                  <h2 className="mt-1.5 text-3xl">{plan.name}</h2>
                  <p className="mt-1.5 text-sm font-bold uppercase opacity-90">{plan.slogan}</p>
                </div>
                <div className="px-5 py-5">
                  <p className="text-xs leading-relaxed text-muted-foreground">{plan.style}</p>
                  <Link
                    to="/plan/$planId"
                    params={{ planId: plan.id }}
                    onClick={() => choosePlan(plan.id)}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full ${accent.bg} ${accent.on} px-5 py-3.5 text-sm font-bold tracking-wide uppercase`}
                  >
                    Start Plan
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function CurrentPlanCard({
  planId,
  state,
}: {
  planId: (typeof PLANS)[number]["id"];
  state: ReturnType<typeof useStore>;
}) {
  const plan = getPlan(planId)!;
  const [confirm, setConfirm] = useState<"restart" | "change" | null>(null);
  const accent = planAccent(plan.id);
  const progress = planProgress(plan, state.completed, state.walks);
  const next = effectiveDay(
    plan.id,
    nextWorkout(plan, state.completed, state.walks),
    state.customDays,
  );
  const streak = currentStreak(state.history);
  const round = state.rounds[plan.id] ?? 1;
  const planDone = progress.done >= progress.total;
  const weeksDone = completedWeeks(plan, state.completed, state.walks);
  const currentWeek = weekOf(next.day);
  const wp = weekProgress(plan, currentWeek, state.completed, state.walks);
  const phase = phaseInfo(phaseOf(currentWeek));
  const goal = weekGoal(currentWeek);
  const nextLocked = weekLocked(plan, weekOf(next.day), state);

  return (
    <>
      <article className="surface overflow-hidden">
        <div className={`${accent.bg} ${accent.on} px-5 py-6`}>
          <p className="eyebrow opacity-80">Current plan · Round {round}</p>
          <h2 className="mt-1.5 text-3xl">{plan.name}</h2>
          <p className="mt-1.5 text-sm font-bold uppercase opacity-90">{plan.slogan}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper/35">
            <div
              className={
                "h-full rounded-full transition-[width] duration-500 " +
                (planDone ? "bg-success" : "bg-paper")
              }
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase">
            <span>
              Week {currentWeek} of {WEEKS} · {weeksDone} weeks done
              {planDone ? " ✓ all 8 weeks" : ""}
            </span>
            <span className="rounded-full bg-paper/25 px-2 py-0.5">
              {wp.done}/{wp.total} this week
            </span>
            <span className="rounded-full bg-paper/25 px-2 py-0.5">
              Phase {phase.no} · {phase.name}
            </span>
            <span className="rounded-full bg-paper/25 px-2 py-0.5">Day 5, your call</span>
            {streak > 0 && (
              <span className="rounded-full bg-acid px-2 py-0.5 text-ink">
                ⚡ {streak} day streak
              </span>
            )}
          </p>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-xl bg-secondary px-4 py-3">
            <p className="eyebrow text-muted-foreground">This week</p>
            <p className="mt-0.5 font-display text-base uppercase">{goal.title}</p>
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{goal.copy}</p>
          </div>
          {nextLocked ? (
            <div className="mt-4">
              <p className="font-display text-xl uppercase">Phase 1 done. 🌶️</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Weeks 5–8 are waiting — new moves, more stimulus.
              </p>
              <Link
                to="/plan/$planId"
                params={{ planId: plan.id }}
                className="spicy-wash mt-3 inline-flex w-full items-center justify-center rounded-full px-5 py-4 text-xs font-bold uppercase"
              >
                Unlock phase 2
              </Link>
            </div>
          ) : (
          <>
          <p className="mt-4 eyebrow text-muted-foreground">Next up</p>
          <Link
            to="/workout/$planId/$day"
            params={{ planId: plan.id, day: String(next.day) }}
            className="mt-1.5 flex items-end gap-3"
          >
            <span className="day-number text-spicy">
              {String(dayInWeek(next.day)).padStart(2, "0")}
            </span>
            <span className="min-w-0 pb-1">
              <span className="block text-[11px] font-bold text-muted-foreground uppercase">
                Week {weekOf(next.day)} · Day {dayInWeek(next.day)}
              </span>
              <span className="block text-xl leading-tight font-display uppercase">
                {next.title}
              </span>
              <span className="block text-sm font-semibold text-muted-foreground">
                {next.focus}
              </span>
            </span>
          </Link>
          <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase">
            {next.exercises.length + (next.circuit ? 1 : 0)} exercises · ~{estimateMinutes(next)}{" "}
            min
          </p>

          <Link
            to="/workout/$planId/$day"
            params={{ planId: plan.id, day: String(next.day) }}
            className="spicy-wash mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-sm font-bold tracking-wide uppercase shadow-[var(--shadow-lift)]"
          >
            Start Workout <ArrowRight className="size-4" aria-hidden />
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/plan/$planId"
              params={{ planId: plan.id }}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-secondary px-4 py-3 text-xs font-bold uppercase"
            >
              8-week plan
            </Link>
            <Link
              to="/customize/$planId"
              params={{ planId: plan.id }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-3 text-xs font-bold uppercase"
            >
              <Pencil className="size-3.5 text-spicy" aria-hidden /> Plan details
            </Link>
          </div>
        </div>
      </article>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setConfirm("restart")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3.5 text-xs font-bold uppercase"
        >
          <RotateCcw className="size-4 text-spicy" aria-hidden /> Restart plan
        </button>
        <button
          type="button"
          onClick={() => setConfirm("change")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3.5 text-xs font-bold uppercase"
        >
          <Shuffle className="size-4 text-pink" aria-hidden /> Change plan
        </button>
      </div>

      {confirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            {confirm === "restart" ? (
              <RotateCcw className="mx-auto size-7 text-spicy" aria-hidden />
            ) : (
              <Shuffle className="mx-auto size-7 text-pink" aria-hidden />
            )}
            <h2 className="mt-2 text-xl leading-tight">
              {confirm === "restart" ? "Start this plan again?" : "Switch to another plan?"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {confirm === "restart"
                ? "Your day check-marks reset for a fresh round. Your history, records and progress are kept."
                : `You'll pick a new plan. ${plan.name} stays saved with all your history and records.`}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-xs font-bold uppercase"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm === "restart") restartPlan(plan.id);
                  else clearPlan();
                  setConfirm(null);
                }}
                className={
                  "flex-1 rounded-full px-4 py-3 text-xs font-bold uppercase " +
                  (confirm === "restart"
                    ? "bg-spicy text-accent-foreground"
                    : "border-2 border-pink text-pink")
                }
              >
                {confirm === "restart" ? "Yes, restart" : "Yes, change plan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
