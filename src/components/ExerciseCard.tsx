import { Check } from "lucide-react";
import { MediaBox } from "./MediaBox";
import { RestTimer } from "./RestTimer";
import type { Exercise } from "@/lib/program";
import { setKey, suggestion, updateSet, type SetLog, type State } from "@/lib/store";

export function ExerciseCard({
  planId,
  day,
  exIdx,
  exercise,
  state,
  restSeconds,
}: {
  planId: string;
  day: number;
  exIdx: number;
  exercise: Exercise;
  state: State;
  restSeconds: number;
}) {
  const session = state.active[`${planId}|${day}`];
  const hint = suggestion(planId, exercise.name, exercise.reps, state.lastSets);
  const doneSets = Array.from({ length: exercise.sets }).filter(
    (_, i) => session?.sets[setKey(exIdx, i)]?.done,
  ).length;
  const complete = doneSets === exercise.sets;

  return (
    <article
      className={
        "surface p-4 transition-colors sm:p-5 " + (complete ? "border-success" : "")
      }
    >
      <div className="flex gap-3">
        <div className="w-20 shrink-0 sm:w-24">
          <MediaBox name={exercise.name} compact src={exercise.media} />
        </div>
        <div className="min-w-0 flex-1">
          {exercise.superset && (
            <span className="eyebrow text-pink">{exercise.superset}</span>
          )}
          <h2 className="text-lg leading-tight">{exercise.name}</h2>
          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
            {exercise.sets} sets × {exercise.reps}
            {exercise.perSide ? " per side" : ""}
          </p>
          <span
            key={complete ? "done" : "todo"}
            className={
              "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase " +
              (complete ? "bg-success text-ink check-pop" : "bg-secondary text-ink")
            }
          >
            {complete && <Check className="size-3" aria-hidden />}
            {complete ? "✓ Exercise complete" : `${doneSets}/${exercise.sets} sets`}
          </span>
        </div>
      </div>

      {hint && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-secondary p-3 text-xs">
          <div>
            <p className="eyebrow text-muted-foreground">Last time</p>
            <p className="mt-0.5 font-bold uppercase">
              {hint.lastBest.weight ? `${hint.lastBest.weight} kg × ${hint.lastBest.reps}` : `${hint.lastBest.reps} reps`}
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Today</p>
            <p className={"mt-0.5 font-bold uppercase " + (hint.progress ? "text-spicy" : "")}>
              {hint.target ? `${hint.target} kg × ${hint.range}` : `${hint.range} reps`}
            </p>
          </div>
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
          const log: SetLog = session?.sets[setKey(exIdx, i)] ?? { weight: 0, reps: 0, done: false };
          const prev = hint?.last[i];
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
                  placeholder={prev ? String(prev.weight) : "kg"}
                  aria-label={`Set ${i + 1} weight in kg`}
                  onChange={(e) =>
                    updateSet(planId, day, exIdx, i, { weight: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg bg-secondary px-2 py-3 text-center text-base font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                {prev && (
                  <span className="mt-0.5 text-center text-[10px] font-semibold text-muted-foreground">
                    prev {prev.weight} kg
                  </span>
                )}
              </label>
              <label className="flex flex-col">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={log.reps || ""}
                  placeholder={prev ? String(prev.reps) : "reps"}
                  aria-label={`Set ${i + 1} reps completed`}
                  onChange={(e) =>
                    updateSet(planId, day, exIdx, i, { reps: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg bg-secondary px-2 py-3 text-center text-base font-bold outline-none focus:ring-2 focus:ring-ring"
                />
                {prev && (
                  <span className="mt-0.5 text-center text-[10px] font-semibold text-muted-foreground">
                    prev × {prev.reps}
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
