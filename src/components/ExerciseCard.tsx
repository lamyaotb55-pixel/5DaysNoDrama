import { Check } from "lucide-react";
import { MediaBox } from "./MediaBox";
import { RestTimer } from "./RestTimer";
import { repRange, weekGoal, type Exercise } from "@/lib/program";
import {
  anchorHistory,
  previousWeekSets,
  setKey,
  suggestion,
  updateSet,
  type SetLog,
  type State,
} from "@/lib/store";

export function ExerciseCard({
  planId,
  day,
  week,
  exIdx,
  exercise,
  state,
  restSeconds,
}: {
  planId: string;
  day: number;
  week: number;
  exIdx: number;
  exercise: Exercise;
  state: State;
  restSeconds: number;
}) {
  const session = state.active[`${planId}|${day}`];
  const hint = suggestion(planId, exercise.name, exercise.reps, state.lastSets);
  const prev = previousWeekSets(planId, week, exercise.name, state);
  const prevBest = prev?.sets.reduce((a, b) => (b.weight > a.weight ? b : a));
  const range = repRange(exercise.reps);
  const goal = weekGoal(week);
  const doneSets = Array.from({ length: exercise.sets }).filter(
    (_, i) => session?.sets[setKey(exIdx, i)]?.done,
  ).length;
  const complete = doneSets === exercise.sets;
  // Progression lifts keep a week-by-week record across both phases.
  const anchor = exercise.anchor ? anchorHistory(planId, exercise.name, state) : null;
  // Only nudge up in the "add a little" week, and only when the top of the
  // range was hit on every set last time.
  const suggestMore = goal.nudge === "load" && Boolean(hint?.progress);
  const today = suggestMore
    ? `${hint?.target} kg × ${range.min}${range.max !== range.min ? `–${range.max}` : ""}`
    : prevBest?.weight
      ? `${prevBest.weight} kg × ${range.min}${range.max !== range.min ? `–${range.max}` : ""}`
      : `${range.min}${range.max !== range.min ? `–${range.max}` : ""} reps`;

  return (
    <article
      className={"surface p-4 transition-colors sm:p-5 " + (complete ? "border-success" : "")}
    >
      <MediaBox name={exercise.name} wide src={exercise.media} />
      <div className="mt-3 flex gap-3">
        <div className="min-w-0 flex-1">
          {exercise.superset && <span className="eyebrow text-pink">{exercise.superset}</span>}
          <h2 className="text-lg leading-tight">{exercise.name}</h2>
          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
            {exercise.sets} sets × {exercise.reps}
            {exercise.perSide ? " per side" : ""}
          </p>
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              key={complete ? "done" : "todo"}
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
                (complete ? "bg-success text-ink check-pop" : "bg-secondary text-ink")
              }
            >
              {complete && <Check className="size-3" aria-hidden />}
              {complete ? "✓ Exercise complete" : `${doneSets}/${exercise.sets} sets`}
            </span>
            {exercise.anchor && (
              <span className="inline-flex items-center rounded-full border border-ice bg-ice/40 px-2 py-0.5 text-[10px] font-bold text-ink uppercase">
                Progression lift
              </span>
            )}
          </span>
        </div>
      </div>

      {prev && prevBest && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-secondary p-3 text-xs">
          <div>
            <p className="eyebrow text-muted-foreground">
              {prev.week === week - 1 ? "Last week" : prev.week ? `Week ${prev.week}` : "Last time"}
            </p>
            <p className="mt-0.5 font-bold uppercase">
              {prevBest.weight
                ? `${prevBest.weight} kg × ${prevBest.reps}`
                : `${prevBest.reps} reps`}
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Today</p>
            <p className={"mt-0.5 font-bold uppercase " + (suggestMore ? "text-spicy" : "")}>
              {today}
            </p>
            {suggestMore && (
              <p className="mt-0.5 text-[10px] font-bold text-spicy uppercase">Add a little 🌶️</p>
            )}
          </div>
        </div>
      )}

      {anchor && anchor.points.length > 0 && (
        <div className="mt-3 rounded-lg border border-ice bg-ice/25 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="eyebrow text-ink/70">Progression lift · week by week</p>
            {anchor.gain > 0 && (
              <span className="text-[10px] font-bold text-ink uppercase">+{anchor.gain} kg</span>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {anchor.points.map((p) => (
              <li
                key={p.week}
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums uppercase " +
                  (p.week === anchor.best?.week ? "bg-acid text-ink" : "bg-card text-ink")
                }
              >
                W{p.week}
                <span className="text-ink/60"> P{p.phase}</span> ·{" "}
                {p.weight ? `${p.weight}kg ` : ""}×{p.reps}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[2.6rem_1fr_1fr_2.5rem] items-center gap-2 px-1">
          <span className="eyebrow text-muted-foreground">Set</span>
          <span className="eyebrow text-muted-foreground">Weight</span>
          <span className="eyebrow text-muted-foreground">Reps</span>
          <span className="sr-only">Complete</span>
        </div>
        {Array.from({ length: exercise.sets }).map((_, i) => {
          const log: SetLog = session?.sets[setKey(exIdx, i)] ?? {
            weight: 0,
            reps: 0,
            done: false,
          };
          const prevSet = prev?.sets[i];
          return (
            <div
              key={`${i}-${log.done ? "done" : "todo"}`}
              className={
                "grid grid-cols-[2.6rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg border px-1.5 py-2 transition-colors " +
                (log.done ? "border-success bg-success/10 success-flash" : "border-border bg-card")
              }
            >
              <span className="text-center text-xs font-bold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <label className="flex flex-col">
                <input
                  type="number"
                  inputMode="decimal"
                  step={2.5}
                  min={0}
                  value={log.weight || ""}
                  placeholder={prevSet ? String(prevSet.weight) : "kg"}
                  aria-label={`Set ${i + 1} weight in kg`}
                  onChange={(e) =>
                    updateSet(planId, day, exIdx, i, { weight: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg bg-secondary px-2 py-3 text-center text-base font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                {prevSet && (
                  <span className="mt-0.5 text-center text-[10px] font-semibold text-muted-foreground">
                    prev {prevSet.weight} kg
                  </span>
                )}
              </label>
              <label className="flex flex-col">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={log.reps || ""}
                  placeholder={prevSet ? String(prevSet.reps) : "reps"}
                  aria-label={`Set ${i + 1} reps completed`}
                  onChange={(e) =>
                    updateSet(planId, day, exIdx, i, { reps: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg bg-secondary px-2 py-3 text-center text-base font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                {prevSet && (
                  <span className="mt-0.5 text-center text-[10px] font-semibold text-muted-foreground">
                    prev × {prevSet.reps}
                  </span>
                )}
              </label>
              <button
                type="button"
                aria-label={`Mark set ${i + 1} complete`}
                aria-pressed={log.done}
                onClick={() => updateSet(planId, day, exIdx, i, { done: !log.done })}
                className={
                  "grid size-10 place-items-center rounded-full border transition-colors " +
                  (log.done
                    ? "border-success bg-success text-ink"
                    : "border-input bg-card text-muted-foreground")
                }
              >
                <Check
                  key={log.done ? "done" : "todo"}
                  className={"size-4 " + (log.done ? "check-pop" : "")}
                  aria-hidden
                />
              </button>
            </div>
          );
        })}
      </div>

      <RestTimer seconds={restSeconds} />
    </article>
  );
}
