import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Pencil, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { PLANS, estimateMinutes, getPlan } from "@/lib/program";
import {
  choosePlan,
  clearPlan,
  currentStreak,
  effectiveDay,
  nextWorkout,
  planProgress,
  restartPlan,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        name: "description",
        content:
          "Choose Lose Weight, Tone Up or Build Muscle. Five focused training days, set-by-set tracking and clear progress — no drama.",
      },
      { property: "og:title", content: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        property: "og:description",
        content: "Three plans, five training days, every set tracked. Strong, simple, premium.",
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
      <div className="flex items-center justify-between gap-3 pt-6">
        <span className="eyebrow text-rose">5 Days No Drama</span>
        <Link
          to="/progress"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold"
        >
          <LineChart className="size-3.5 text-rose" aria-hidden /> Progress
        </Link>
      </div>

      <section className="pt-6 pb-6 text-center">
        <span className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
          <Sparkles className="size-3 text-rose" aria-hidden /> 3 plans · 5 training days
        </span>
        <h1 className="mt-5 text-4xl leading-[1.05] font-semibold sm:text-5xl">
          5 Days
          <br />
          <span className="text-rose italic">No Drama</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
          Pick your plan, open the day, log every set. Strong training without the noise.
        </p>
      </section>

      {activePlan ? (
        <CurrentPlanCard planId={activePlan.id} state={state} />
      ) : (
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <article key={plan.id} className="surface overflow-hidden">
              <div className="warm-wash px-5 py-6">
                <p className="eyebrow text-ink/60">{plan.label}</p>
                <h2 className="mt-1.5 text-2xl font-semibold uppercase">{plan.name}</h2>
                <p className="mt-1 text-sm font-medium text-ink/70">{plan.slogan}</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs leading-relaxed text-muted-foreground">{plan.style}</p>
                <Link
                  to="/plan/$planId"
                  params={{ planId: plan.id }}
                  onClick={() => choosePlan(plan.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  Start Plan
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
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
  const progress = planProgress(plan, state.completed);
  const next = effectiveDay(plan.id, nextWorkout(plan, state.completed), state.customDays);
  const streak = currentStreak(state.history);
  const round = state.rounds[plan.id] ?? 1;

  return (
    <>
      <article className="surface overflow-hidden">
        <div className="warm-wash px-5 py-6">
          <p className="eyebrow text-ink/60">Current plan · Round {round}</p>
          <h2 className="mt-1.5 text-2xl font-semibold uppercase">{plan.name}</h2>
          <p className="mt-1 text-sm font-medium text-ink/70">{plan.slogan}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-rose transition-[width] duration-500"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink/60">
            <span>
              {progress.done}/{progress.total} days completed
            </span>
            {streak > 0 && (
              <span className="rounded-full bg-butter px-2 py-0.5 text-ink">
                🔥 {streak} day streak
              </span>
            )}
          </p>
        </div>

        <div className="px-5 py-5">
          <p className="eyebrow text-muted-foreground">Next workout</p>
          <Link
            to="/workout/$planId/$day"
            params={{ planId: plan.id, day: String(next.day) }}
            className="mt-1 block"
          >
            <h3 className="text-xl font-semibold uppercase underline decoration-rose decoration-2 underline-offset-4">
              Day {next.day} — {next.title}
            </h3>
            <p className="text-sm text-muted-foreground">{next.focus}</p>
          </Link>
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            {next.exercises.length + (next.circuit ? 1 : 0)} exercises · ~{estimateMinutes(next)} min
          </p>

          <Link
            to="/workout/$planId/$day"
            params={{ planId: plan.id, day: String(next.day) }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Start Workout <ArrowRight className="size-4" aria-hidden />
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/plan/$planId"
              params={{ planId: plan.id }}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold"
            >
              View 5-day split
            </Link>
            <Link
              to="/customize/$planId"
              params={{ planId: plan.id }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold"
            >
              <Pencil className="size-3.5 text-rose" aria-hidden /> Plan details
            </Link>
          </div>
        </div>
      </article>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Restart this plan? Your day check-marks reset and your history, records and progress are kept.",
              )
            )
              restartPlan(plan.id);
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold"
        >
          <RotateCcw className="size-4 text-rose" aria-hidden /> Restart plan
        </button>
        <button
          type="button"
          onClick={() => clearPlan()}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold"
        >
          <Shuffle className="size-4 text-rose" aria-hidden /> Change plan
        </button>
      </div>
    </>
  );
}
