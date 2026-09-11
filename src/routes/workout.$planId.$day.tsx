import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Trophy } from "lucide-react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { getDay, getPlan } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
  effectiveDay,
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
  const state = useStore();
  const rawDay = plan ? getDay(plan, Number(dayParam)) : undefined;
  const day = plan && rawDay ? effectiveDay(plan.id, rawDay, state.customDays) : undefined;
  const navigate = useNavigate();
  const [review, setReview] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const accent = planAccent(planId);

  useEffect(() => {
    if (plan && day) startSession(plan.id, day.day);
  }, [plan?.id, day?.day]);

  if (!plan || !day) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">Workout not found</h1>
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

  const key = sessionKey(plan.id, day.day);
  const session = state.active[key];
  const summary = summarize(plan.id, day, session, state.prs);
  const total = day.exercises.length;
  const doneExercises = day.exercises.filter((ex, exIdx) =>
    Array.from({ length: ex.sets }).every((_, i) => session?.sets[setKey(exIdx, i)]?.done),
  ).length;
  const pct = Math.round((doneExercises / total) * 100);
  const allDone = doneExercises === total;
  const restSeconds = plan.id === "build-muscle" ? 120 : plan.id === "tone-up" ? 90 : 60;

  if (cheer) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface overflow-hidden text-center">
          <div className="spicy-wash px-6 py-8">
            <p className="eyebrow opacity-85">Day {String(day.day).padStart(2, "0")} · {day.title}</p>
            <h1 className="mt-2 text-4xl leading-[0.9]">Done &amp; dusted.</h1>
          </div>
          <div className="px-6 py-6">
            <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[11px] font-bold text-ink uppercase">
              <Check className="size-3.5" aria-hidden /> ✓ Workout complete
            </span>
            <p className="mt-4 text-sm leading-relaxed font-semibold text-muted-foreground">{cheer}</p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate({ to: "/" })}
                className="w-full rounded-full bg-spicy px-6 py-4 text-xs font-bold text-accent-foreground uppercase"
              >
                Back to my plan
              </button>
              <button
                onClick={() => navigate({ to: "/progress" })}
                className="w-full rounded-full bg-secondary px-6 py-3.5 text-xs font-bold uppercase"
              >
                See my progress
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (review) {
    return (
      <main className="mx-auto max-w-md px-5 pb-16">
        <div className="surface mt-10 p-6 text-center">
          <Trophy className="mx-auto size-8 text-spicy" aria-hidden />
          <h1 className="mt-3 text-2xl">One more set? Nope — done.</h1>
          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
            Day {String(day.day).padStart(2, "0")} · {day.title} — {day.focus}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Stat label="Duration" value={`${summary.durationMin} min`} />
            <Stat label="Exercises" value={`${summary.exercises}/${total}`} />
            <Stat label="Sets completed" value={String(summary.sets)} />
            <Stat label="Volume" value={`${summary.volume.toLocaleString()} kg`} />
          </dl>

          {summary.prs.length > 0 && (
            <div className="pr-pop mt-4 rounded-lg bg-acid p-3 text-left">
              <p className="eyebrow text-ink">
                New PR <span className="pr-bolt">⚡</span>
              </p>
              <ul className="mt-1 space-y-0.5 text-xs font-bold text-ink uppercase">
                {summary.prs.map((pr) => (
                  <li key={pr}>{pr}</li>
                ))}
              </ul>
            </div>
          )}

          {day.finisher && (
            <label className="mt-4 flex items-center gap-2 rounded-lg bg-secondary p-3 text-left text-xs font-bold uppercase">
              <input
                type="checkbox"
                checked={session?.cardio ?? false}
                onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
                className="size-4 accent-[var(--success)]"
              />
              {day.finisher.label} done — {day.finisher.detail}
            </label>
          )}

          <label className="mt-4 block text-left">
            <span className="eyebrow text-muted-foreground">Notes</span>
            <textarea
              rows={3}
              value={session?.notes ?? ""}
              onChange={(e) => setNotes(plan.id, day.day, e.target.value)}
              placeholder="How did it feel? Energy, form, anything to remember."
              className="mt-1.5 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            onClick={() => {
              const message = finishSession(plan.id, day.day);
              setCheer(message ?? "Day done. Strong looks good on you.");
            }}
            className="spicy-wash mt-5 w-full rounded-full px-6 py-4 text-xs font-bold tracking-wide uppercase shadow-[var(--shadow-lift)]"
          >
            Finish Workout
          </button>
          <button
            onClick={() => setReview(false)}
            className="mt-3 text-[11px] font-bold text-muted-foreground uppercase"
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
          className="text-xs font-bold text-muted-foreground uppercase"
        >
          ← {plan.name}
        </Link>
      </div>

      <header className="mt-4 flex items-end gap-3">
        <span className={`day-number ${allDone ? "text-success" : accent.text}`}>
          {String(day.day).padStart(2, "0")}
        </span>
        <div className="min-w-0 pb-1">
          <h1 className="text-2xl leading-tight sm:text-3xl">{day.title}</h1>
          <p className="text-sm font-semibold text-muted-foreground">{day.focus}</p>
        </div>
      </header>

      <div className="mt-4">
        {allDone ? (
          <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[11px] font-bold text-ink uppercase">
            <Check className="size-3.5" aria-hidden /> ✓ Day complete
          </span>
        ) : (
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {doneExercises} / {total} exercises · one more set.
          </p>
        )}
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (allDone ? "bg-success" : "bg-spicy")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

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
          <p className="eyebrow text-pink">{day.circuit.rounds} rounds</p>
          <h2 className="mt-1 text-lg">{day.circuit.name}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {day.circuit.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-3 border-b border-border pb-2 last:border-0">
                <span className="font-semibold">{item.name}</span>
                <span className="font-semibold text-muted-foreground">{item.reps}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {day.finisher && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow inline-flex items-center gap-1 text-spicy">
            <Flame className="size-3" aria-hidden /> {day.finisher.label}
          </p>
          <p className="mt-1.5 text-sm font-semibold">{day.finisher.detail}</p>
          <label className="mt-3 flex items-center gap-2 text-xs font-bold uppercase">
            <input
              type="checkbox"
              checked={session?.cardio ?? false}
              onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
              className="size-4 accent-[var(--success)]"
            />
            Mark as complete
          </label>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-muted-foreground uppercase">
              {summary.sets} sets · {summary.volume.toLocaleString()} kg
            </p>
          </div>
          <button
            onClick={() => setReview(true)}
            className={
              "inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-xs font-bold tracking-wide uppercase shadow-[var(--shadow-lift)] " +
              (allDone ? "bg-success text-ink" : "bg-spicy text-accent-foreground")
            }
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
    <div className="rounded-lg bg-secondary p-3">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-lg">{value}</dd>
    </div>
  );
}
