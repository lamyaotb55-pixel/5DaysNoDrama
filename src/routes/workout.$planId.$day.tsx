import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Trophy } from "lucide-react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { getDay, getPlan } from "@/lib/program";
import {
  finishSession,
  sessionKey,
  setCardio,
  setKey,
  setNotes,
  startSession,
  summarize,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/workout/$planId/$day")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const day = plan ? getDay(plan, Number(params.day)) : undefined;
    const title = day
      ? `Day ${day.day} ${day.title} — ${day.focus} | 5 Days No Drama`
      : "Workout | 5 Days No Drama";
    const description = day
      ? `Track sets, reps and weight for ${day.title.toLowerCase()} (${day.focus}) with rest timers and progressive overload targets.`
      : "Track sets, reps and weight with rest timers and progressive overload targets.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: WorkoutPage,
});

function WorkoutPage() {
  const { planId, day: dayParam } = Route.useParams();
  const plan = getPlan(planId);
  const day = plan ? getDay(plan, Number(dayParam)) : undefined;
  const state = useStore();
  const navigate = useNavigate();
  const [review, setReview] = useState(false);

  useEffect(() => {
    if (plan && day) startSession(plan.id, day.day);
  }, [plan?.id, day?.day]);

  if (!plan || !day) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-semibold">Workout not found</h1>
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

  const key = sessionKey(plan.id, day.day);
  const session = state.active[key];
  const summary = summarize(plan.id, day, session, state.prs);
  const total = day.exercises.length;
  const doneExercises = day.exercises.filter((ex, exIdx) =>
    Array.from({ length: ex.sets }).every((_, i) => session?.sets[setKey(exIdx, i)]?.done),
  ).length;
  const pct = Math.round((doneExercises / total) * 100);
  const restSeconds = plan.id === "build-muscle" ? 120 : plan.id === "tone-up" ? 90 : 60;

  if (review) {
    return (
      <main className="mx-auto max-w-md px-5 pb-16">
        <div className="surface mt-10 p-6 text-center">
          <Trophy className="mx-auto size-8 text-rose" aria-hidden />
          <h1 className="mt-3 text-2xl font-semibold uppercase">Workout Complete ✓</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Day {day.day} · {day.title} — {day.focus}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Stat label="Duration" value={`${summary.durationMin} min`} />
            <Stat label="Exercises" value={`${summary.exercises}/${total}`} />
            <Stat label="Sets completed" value={String(summary.sets)} />
            <Stat label="Training volume" value={`${summary.volume.toLocaleString()} kg`} />
          </dl>

          {summary.prs.length > 0 && (
            <div className="mt-4 rounded-xl bg-rose/10 p-3 text-left">
              <p className="eyebrow text-rose">Personal records</p>
              <ul className="mt-1 space-y-0.5 text-xs font-semibold">
                {summary.prs.map((pr) => (
                  <li key={pr}>🏆 {pr}</li>
                ))}
              </ul>
            </div>
          )}

          {day.finisher && (
            <label className="mt-4 flex items-center gap-2 rounded-xl bg-secondary p-3 text-left text-xs font-semibold">
              <input
                type="checkbox"
                checked={session?.cardio ?? false}
                onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
                className="size-4 accent-[var(--rose)]"
              />
              {day.finisher.label} completed — {day.finisher.detail}
            </label>
          )}

          <label className="mt-4 block text-left">
            <span className="eyebrow text-muted-foreground">Notes</span>
            <textarea
              rows={3}
              value={session?.notes ?? ""}
              onChange={(e) => setNotes(plan.id, day.day, e.target.value)}
              placeholder="How did it feel? Energy, form, anything to remember."
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            onClick={() => {
              finishSession(plan.id, day.day);
              navigate({ to: "/plan/$planId", params: { planId: plan.id } });
            }}
            className="mt-5 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Finish Workout
          </button>
          <button
            onClick={() => setReview(false)}
            className="mt-3 text-xs font-semibold text-muted-foreground"
          >
            ← Back to workout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28">
      <div className="pt-8">
        <Link
          to="/plan/$planId"
          params={{ planId: plan.id }}
          className="text-xs font-semibold text-muted-foreground"
        >
          ← {plan.name}
        </Link>
      </div>

      <header className="mt-3">
        <p className="eyebrow text-rose">Day {day.day}</p>
        <h1 className="mt-1 text-3xl font-semibold uppercase">{day.title}</h1>
        <p className="text-sm text-muted-foreground">{day.focus}</p>
        <div className="mt-4">
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {doneExercises} / {total} Exercises Completed
          </p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-rose transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {day.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={`${ex.name}-${exIdx}`}
            planId={plan.id}
            day={day.day}
            exIdx={exIdx}
            exercise={ex}
            state={state}
            restSeconds={restSeconds}
          />
        ))}
      </div>

      {day.circuit && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow text-rose">{day.circuit.rounds} rounds</p>
          <h2 className="mt-1 text-lg font-semibold">{day.circuit.name}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {day.circuit.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.reps}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {day.finisher && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow inline-flex items-center gap-1 text-rose">
            <Flame className="size-3" aria-hidden /> {day.finisher.label}
          </p>
          <p className="mt-1.5 text-sm font-medium">{day.finisher.detail}</p>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <input
              type="checkbox"
              checked={session?.cardio ?? false}
              onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
              className="size-4 accent-[var(--rose)]"
            />
            Mark as completed
          </label>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-muted-foreground">
              {summary.sets} sets · {summary.volume.toLocaleString()} kg volume
            </p>
          </div>
          <button
            onClick={() => setReview(true)}
            className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-lift)]"
          >
            <Check className="size-4" aria-hidden /> Complete Workout
          </button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold">{value}</dd>
    </div>
  );
}
