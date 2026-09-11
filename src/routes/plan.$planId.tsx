import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Dumbbell, LineChart, Pencil } from "lucide-react";
import { estimateMinutes, getPlan } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import { choosePlan, effectivePlan, sessionKey, useStore } from "@/lib/store";

export const Route = createFileRoute("/plan/$planId")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const title = plan ? `${plan.name} — 5 Day Split | 5 Days No Drama` : "Plan | 5 Days No Drama";
    const description = plan
      ? `${plan.slogan} ${plan.goal} Open any of the five days and track every set.`
      : "Five focused training days with set-by-set tracking.";
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
  const plan = basePlan ? effectivePlan(basePlan, state.customDays) : undefined;
  const accent = planAccent(planId);

  if (!plan) {
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

  const doneCount = plan.days.filter((d) => state.completed[sessionKey(plan.id, d.day)]).length;
  const allDone = doneCount === plan.days.length;

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
        <p className={`eyebrow ${accent.text}`}>{plan.label}</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">{plan.name}</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">{plan.slogan}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.goal}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (allDone ? "bg-success" : "bg-spicy")
            }
            style={{ width: `${(doneCount / plan.days.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase">
          {doneCount}/{plan.days.length} days {allDone ? "✓ that's the week" : "done"}
        </p>
      </header>

      <div className="mt-6 space-y-3">
        {plan.days.map((day) => {
          const completed = Boolean(state.completed[sessionKey(plan.id, day.day)]);
          const inProgress = Boolean(state.active[sessionKey(plan.id, day.day)]);
          const count = day.exercises.length + (day.circuit ? 1 : 0);
          return (
            <article key={day.day} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`day-number ${completed ? "text-success" : accent.text}`}>
                    {String(day.day).padStart(2, "0")}
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
                ) : inProgress ? (
                  <span className="rounded-full bg-bubblegum px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                    In progress
                  </span>
                ) : null}
              </div>
              <Link
                to="/workout/$planId/$day"
                params={{ planId: plan.id, day: String(day.day) }}
                onClick={() => choosePlan(plan.id)}
                className={
                  "mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-xs font-bold tracking-wide uppercase " +
                  (completed
                    ? "bg-secondary text-ink"
                    : "bg-spicy text-accent-foreground")
                }
              >
                {completed ? "Repeat Workout" : inProgress ? "Resume Workout" : "Start Workout"}
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
