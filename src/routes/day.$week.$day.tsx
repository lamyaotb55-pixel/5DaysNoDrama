import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Lock, PartyPopper, Pencil, RotateCcw } from "lucide-react";
import { MediaBox } from "@/components/MediaBox";
import { buildEncouragement, WEEKS, getPlan, progress } from "@/lib/plans";
import { activeRun, dayKey, logKey, saveLog, toggleDayDone, useTracker } from "@/lib/tracker";

export const Route = createFileRoute("/day/$week/$day")({
  head: () => ({
    meta: [
      { title: "Today's Workout — FitFlow" },
      {
        name: "description",
        content:
          "Work through today's movements with reps, rounds and a weight tracker, then mark the day as smashed.",
      },
      { property: "og:title", content: "Today's Workout — FitFlow" },
      {
        property: "og:description",
        content: "Log reps, rounds and weight for every movement, then finish strong.",
      },
    ],
  }),
  component: DayPage,
});

function DayPage() {
  const { week: weekParam, day: dayParam } = Route.useParams();
  const week = Math.max(1, Math.min(WEEKS, Number(weekParam) || 1));
  const dayNo = Math.max(1, Math.min(5, Number(dayParam) || 1));
  const state = useTracker();
  const run = activeRun(state);
  const plan = run ? getPlan(run.planId) : undefined;
  const [cheer, setCheer] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (!run || !plan) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="surface max-w-sm p-8 text-center">
          <h1 className="text-2xl font-bold">No active plan</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-sky px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Choose a plan
          </Link>
        </div>
      </main>
    );
  }

  const day = plan.days[dayNo - 1]!;
  const isDone = Boolean(run.done[dayKey(week, dayNo)]);
  const locked = isDone && !editing;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-pink">
        ← Dashboard
      </Link>
      <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wide text-sky uppercase">
            Week {week} · {plan.name}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
            {day.title}: {day.focus}
          </h1>
        </div>
        {isDone && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink px-3 py-1.5 text-xs font-bold text-accent-foreground">
              <Check className="size-3.5" aria-hidden /> Smashed
            </span>
            <button
              onClick={() => setEditing((v) => !v)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors " +
                (editing
                  ? "border-sky bg-sky text-primary-foreground"
                  : "border-border bg-card hover:border-sky")
              }
            >
              {editing ? (
                <>
                  <Lock className="size-3.5" aria-hidden /> Done editing
                </>
              ) : (
                <>
                  <Pencil className="size-3.5" aria-hidden /> Edit numbers
                </>
              )}
            </button>
          </div>
        )}
      </header>

      {locked && (
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          This day is completed and locked. Tap “Edit numbers” to update your reps, rounds or weight.
        </p>
      )}


      <div className="mt-6 space-y-5">
        {day.exercises.map((ex, idx) => {
          const target = progress(ex, week);
          const saved = run.logs[logKey(week, dayNo, idx)];
          const value = saved ?? target;
          const set = (patch: Partial<typeof value>) =>
            saveLog(week, dayNo, idx, { ...value, ...patch });

          return (
            <article key={ex.name} className="surface p-5 sm:flex sm:gap-5">
              <div className="sm:w-48 sm:shrink-0">
                <MediaBox name={ex.name} emoji={ex.emoji} cue={ex.cue} />
              </div>
              <div className="mt-4 flex-1 sm:mt-0">
                <h2 className="text-lg font-bold">{ex.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{ex.cue}</p>
                <p className="mt-2 text-xs font-semibold text-sky">
                  Target: {target.rounds} rounds × {target.reps} reps
                  {target.weight ? ` @ ${target.weight} kg` : " · bodyweight"}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Field
                    label="Reps"
                    value={value.reps}
                    locked={locked}
                    onChange={(v) => set({ reps: v })}
                  />
                  <Field
                    label="Rounds"
                    value={value.rounds}
                    locked={locked}
                    onChange={(v) => set({ rounds: v })}
                  />
                  <Field
                    label="Weight (kg)"
                    value={value.weight}
                    step={2.5}
                    locked={locked}
                    onChange={(v) => set({ weight: v })}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="surface mt-8 p-6 text-center">
        {cheer && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold">
            <PartyPopper className="size-4 text-pink" aria-hidden />
            {cheer}
          </p>
        )}
        <button
          onClick={() => {
            toggleDayDone(week, dayNo);
            setEditing(false);
            setCheer(
              isDone
                ? null
                : buildEncouragement({
                    plan,
                    week,
                    dayNo,
                    focus: day.focus,
                    doneCount: Object.keys(run.done).length + 1,
                  }),
            );
          }}
          className={
            "inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-bold transition-transform hover:-translate-y-0.5 sm:w-auto " +
            (isDone
              ? "border border-border bg-card text-foreground"
              : "bg-pink text-accent-foreground shadow-[var(--shadow-pop)]")
          }
        >
          {isDone ? (
            <>
              <RotateCcw className="size-4" aria-hidden /> Undo completion
            </>
          ) : (
            <>Finish — Smashed it! 💥</>
          )}
        </button>
        <div className="mt-5 flex justify-center gap-3 text-sm font-semibold">
          {dayNo > 1 && (
            <Link
              to="/day/$week/$day"
              params={{ week: String(week), day: String(dayNo - 1) }}
              className="text-muted-foreground hover:text-sky"
            >
              ← Day {dayNo - 1}
            </Link>
          )}
          {dayNo < 5 && (
            <Link
              to="/day/$week/$day"
              params={{ week: String(week), day: String(dayNo + 1) }}
              className="text-muted-foreground hover:text-sky"
            >
              Day {dayNo + 1} →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  locked?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div
        className={
          "mt-1 flex items-center rounded-xl border border-input " +
          (locked ? "bg-muted" : "bg-card")
        }
      >
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={locked}
          onClick={() => onChange(Math.max(0, value - step))}
          className="px-2.5 py-2 text-sm font-bold text-muted-foreground hover:text-pink disabled:opacity-40"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full min-w-0 bg-transparent py-2 text-center text-sm font-bold outline-none"
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={locked}
          onClick={() => onChange(value + step)}
          className="px-2.5 py-2 text-sm font-bold text-muted-foreground hover:text-pink disabled:opacity-40"
        >
          +
        </button>
      </div>
    </label>
  );
}
