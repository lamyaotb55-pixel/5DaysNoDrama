import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Dumbbell, LineChart, Pencil } from "lucide-react";
import { estimateMinutes, getPlan } from "@/lib/program";
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
  const plan = getPlan(planId);
  const state = useStore();

  if (!plan) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-semibold">Plan not found</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Choose a plan
          </Link>
        </div>
      </main>
    );
  }

  const doneCount = plan.days.filter((d) => state.completed[sessionKey(plan.id, d.day)]).length;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-8">
        <Link to="/" className="text-xs font-semibold text-muted-foreground">
          ← Plans
        </Link>
        <Link
          to="/progress"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
        >
          <LineChart className="size-3.5 text-rose" aria-hidden /> Progress
        </Link>
      </div>

      <header className="mt-4">
        <p className="eyebrow text-rose">{plan.label}</p>
        <h1 className="mt-1.5 text-3xl font-semibold uppercase sm:text-4xl">{plan.name}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{plan.slogan}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.goal}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-rose transition-[width] duration-500"
            style={{ width: `${(doneCount / plan.days.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
          {doneCount}/{plan.days.length} days completed
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
                <div>
                  <p className="eyebrow text-muted-foreground">Day {day.day}</p>
                  <h2 className="mt-1 text-xl font-semibold uppercase">{day.title}</h2>
                  <p className="text-sm text-muted-foreground">{day.focus}</p>
                  <p className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Dumbbell className="size-3" aria-hidden /> {count} Exercises
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" aria-hidden /> ~{estimateMinutes(day)} min
                    </span>
                  </p>
                </div>
                {completed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
                    <Check className="size-3" aria-hidden /> Done
                  </span>
                ) : inProgress ? (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                    In progress
                  </span>
                ) : null}
              </div>
              <Link
                to="/workout/$planId/$day"
                params={{ planId: plan.id, day: String(day.day) }}
                onClick={() => choosePlan(plan.id)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-primary-foreground"
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
