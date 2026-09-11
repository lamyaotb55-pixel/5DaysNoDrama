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
        "surface p-4 transition-opacity sm:p-5 " + (complete ? "border-rose/40 opacity-95" : "")
      }
    >
      <div className="flex gap-3">
        <div className="w-20 shrink-0 sm:w-24">
          <MediaBox name={exercise.name} compact />
        </div>
        <div className="min-w-0 flex-1">
          {exercise.superset && (
            <span className="eyebrow text-rose">{exercise.superset}</span>
          )}
          <h2 className="text-lg leading-tight font-semibold">{exercise.name}</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Target: {exercise.sets} × {exercise.reps}
            {exercise.perSide ? " per side" : ""}
          </p>
          <span
            className={
              "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold " +
              (complete ? "bg-rose text-accent-foreground" : "bg-secondary text-muted-foreground")
            }
          >
            {complete && <Check className="size-3" aria-hidden />}
            {doneSets}/{exercise.sets} sets
          </span>
        </div>
      </div>

      {hint && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/70 p-3 text-xs">
          <div>
            <p className="eyebrow text-muted-foreground">Last session</p>
            <p className="mt-0.5 font-bold">
              {hint.lastBest.weight ? `${hint.lastBest.weight} kg × ${hint.lastBest.reps}` : `${hint.lastBest.reps} reps`}
            </p>
          </div>
          <div>
            <p className="eyebrow text-muted-foreground">Today's target</p>
            <p className={"mt-0.5 font-bold " + (hint.progress ? "text-rose" : "")}>
              {hint.target ? `Try ${hint.target} kg × ${hint.range}` : `${hint.range} reps`}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[1.6rem_1fr_1fr_2rem] items-center gap-2 px-1">
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
              key={i}
              className="grid grid-cols-[1.6rem_1fr_1fr_2rem] items-center gap-2 rounded-xl border border-border bg-card px-1 py-1.5"
            >
              <span className="text-center text-sm font-bold">{i + 1}</span>
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
                  className="w-full rounded-lg bg-secondary/60 px-2 py-2 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                />
                {prev && (
                  <span className="mt-0.5 text-center text-[10px] text-muted-foreground">
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
                  className="w-full rounded-lg bg-secondary/60 px-2 py-2 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                />
                {prev && (
                  <span className="mt-0.5 text-center text-[10px] text-muted-foreground">
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
                  "grid size-8 place-items-center rounded-full border transition-colors " +
                  (log.done
                    ? "border-rose bg-rose text-accent-foreground"
                    : "border-input bg-card text-muted-foreground")
                }
              >
                <Check className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>

      <RestTimer seconds={restSeconds} />
    </article>
  );
}
