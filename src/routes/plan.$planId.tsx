import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, Dumbbell, Footprints, LineChart, Pencil } from "lucide-react";
import {
  WEEKS,
  dayInWeek,
  dayOption,
  estimateMinutes,
  getPlan,
  weekDays,
  type Day,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
  altAllowed,
  chooseAlt,
  choosePlan,
  chooseTrain,
  completeAlt,
  completedWeeks,
  effectiveDay,
  planProgress,
  sessionKey,
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
  const [altTarget, setAltTarget] = useState<Day | null>(null);

  const firstOpenWeek = (() => {
    if (!basePlan) return 1;
    for (let w = 1; w <= WEEKS; w++) {
      const p = weekProgress(basePlan, w, state.completed, state.walks);
      if (p.done < p.total) return w;
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
  const wp = weekProgress(plan, shownWeek, state.completed, state.walks);
  const overall = planProgress(plan, state.completed, state.walks);
  const weeksDone = completedWeeks(plan, state.completed, state.walks);
  const weekDone = wp.done >= wp.total;
  const altTargetOption = altTarget ? dayOption(plan.id, altTarget.day) : undefined;

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
            const p = weekProgress(plan, w, state.completed, state.walks);
            const full = p.done >= p.total;
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
                  <span className="mt-1">{full ? "✓ done" : `${p.done}/${p.total}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className="surface mt-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">
              Week {shownWeek} of {WEEKS}
            </p>
            <p className="mt-1 text-xl">
              {wp.done}/{wp.total} days {weekDone ? "✓ that's the week" : "done"}
            </p>
          </div>
          <span className="rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
            Day 5, your call
          </span>
        </div>
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground uppercase">
          On day 5 you choose how you show up. No drama.
        </p>
      </section>

      <div className="mt-5 space-y-3">
        {days.map((day) => {
          const key = sessionKey(plan.id, day.day);
          const completed = Boolean(state.completed[key]);
          const inProgress = Boolean(state.active[key]);
          const option = dayOption(plan.id, day.day);
          const optionChosen = Boolean(state.skips[key]) && Boolean(option);
          const optionDone = Boolean(state.walks[key]) && Boolean(option);
          const count = day.exercises.length + (day.circuit ? 1 : 0);
          const showChoice = Boolean(option) && altAllowed(day.day) && !completed && !optionChosen;
          return (
            <article key={day.day} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`day-number ${completed || optionDone ? "text-success" : optionChosen ? "text-pink" : accent.text}`}
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
                  <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    <Check className="size-3" aria-hidden /> Complete
                  </span>
                ) : optionDone && option ? (
                  <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    <Check className="size-3" aria-hidden /> {option.doneLabel}
                  </span>
                ) : inProgress ? (
                  <span className="rounded-full bg-bubblegum px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    In progress
                  </span>
                ) : null}
              </div>

              {showChoice && option ? (
                <div className="mt-4">
                  <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                    What's the plan today?
                  </p>
                  <div className="mt-2.5 flex gap-2.5">
                    <Link
                      to="/workout/$planId/$day"
                      params={{ planId: plan.id, day: String(day.day) }}
                      onClick={() => choosePlan(plan.id)}
                      className="flex-1 rounded-full bg-spicy px-4 py-3.5 text-center text-xs font-bold tracking-wide text-accent-foreground uppercase"
                    >
                      I'll Train
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAltTarget(day)}
                      className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold tracking-wide text-pink uppercase"
                    >
                      {option.button}
                    </button>
                  </div>
                </div>
              ) : optionChosen && option ? (
                <div className="mt-4 rounded-2xl bg-bubblegum/35 p-4">
                  <p className="font-display text-lg leading-tight">{option.headline}</p>
                  <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
                    {option.goal}
                  </p>
                  {option.items && (
                    <ul className="mt-3 space-y-1.5">
                      {option.items.map((it) => (
                        <li
                          key={it.name}
                          className="flex items-center justify-between gap-3 text-xs font-semibold"
                        >
                          <span>{it.name}</span>
                          <span className="text-muted-foreground">{it.reps}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => completeAlt(plan.id, day.day, !optionDone)}
                    className={
                      "mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-xs font-bold uppercase " +
                      (optionDone ? "bg-success text-ink" : "bg-spicy text-accent-foreground")
                    }
                  >
                    {optionDone ? (
                      <>
                        <Check className="size-3.5" aria-hidden /> {option.doneLabel}
                      </>
                    ) : (
                      <>
                        <Footprints className="size-3.5" aria-hidden /> Mark it done
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseTrain(plan.id, day.day)}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-[11px] font-bold uppercase"
                  >
                    Actually, I'll train
                  </button>
                </div>
              ) : (
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
              )}
            </article>
          );
        })}
      </div>

      {altTarget && altTargetOption && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            <Footprints className="mx-auto size-7 text-pink" aria-hidden />
            <h2 className="mt-2 text-xl">{altTargetOption.headline}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{altTargetOption.goal}</p>
            <div className="mt-5 flex gap-3">
              <Link
                to="/workout/$planId/$day"
                params={{ planId: plan.id, day: String(altTarget.day) }}
                onClick={() => {
                  choosePlan(plan.id);
                  setAltTarget(null);
                }}
                className="flex-1 rounded-full bg-spicy px-4 py-3 text-xs font-bold text-accent-foreground uppercase"
              >
                I'll Train
              </Link>
              <button
                type="button"
                onClick={() => {
                  chooseAlt(plan.id, altTarget.day);
                  setAltTarget(null);
                }}
                className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold text-pink uppercase"
              >
                {altTargetOption.button}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
