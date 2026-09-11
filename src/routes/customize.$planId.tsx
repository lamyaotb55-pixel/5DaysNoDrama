import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { MediaBox } from "@/components/MediaBox";
import { getPlan, type Exercise } from "@/lib/program";
import { effectiveDay, resetDayExercises, saveDayExercises, useStore } from "@/lib/store";

export const Route = createFileRoute("/customize/$planId")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const title = plan
      ? `${plan.name} Plan Details — Edit Workouts | 5 Days No Drama`
      : "Plan Details | 5 Days No Drama";
    const description = plan
      ? `Edit the five days of ${plan.name}: rename workouts, change sets and reps, add a demo image or remove exercises.`
      : "Edit your plan: rename workouts, change sets and reps, add demo media or remove exercises.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CustomizePage,
});

type Draft = Exercise & { index: number };

function CustomizePage() {
  const { planId } = Route.useParams();
  const basePlan = getPlan(planId);
  const state = useStore();
  const [draft, setDraft] = useState<{ day: number; ex: Draft } | null>(null);

  if (!basePlan) {
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

  const days = basePlan.days.map((d) => effectiveDay(basePlan.id, d, state.customDays));

  const commit = (dayNo: number, list: Exercise[]) => saveDayExercises(basePlan.id, dayNo, list);

  const removeExercise = (dayNo: number, index: number) => {
    const day = days.find((d) => d.day === dayNo)!;
    commit(
      dayNo,
      day.exercises.filter((_, i) => i !== index),
    );
  };

  const saveDraft = () => {
    if (!draft) return;
    const day = days.find((d) => d.day === draft.day)!;
    const { index, ...ex } = draft.ex;
    const list = [...day.exercises];
    if (index >= list.length) list.push(ex);
    else list[index] = ex;
    commit(draft.day, list);
    setDraft(null);
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-8">
        <Link to="/" className="text-xs font-semibold text-muted-foreground">
          ← Home
        </Link>
      </div>

      <header className="mt-3">
        <p className="eyebrow text-rose">Plan details</p>
        <h1 className="mt-1 text-3xl font-semibold uppercase sm:text-4xl">{basePlan.name}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Rename any workout, change sets and reps, add a demo image link or remove what you don't do.
        </p>
      </header>

      <div className="mt-6 space-y-4">
        {days.map((day) => {
          const edited = Boolean(state.customDays[`${basePlan.id}|${day.day}`]);
          return (
            <section key={day.day} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-muted-foreground">Day {day.day}</p>
                  <h2 className="mt-1 text-xl font-semibold uppercase">{day.title}</h2>
                  <p className="text-sm text-muted-foreground">{day.focus}</p>
                </div>
                {edited && (
                  <button
                    type="button"
                    onClick={() => resetDayExercises(basePlan.id, day.day)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
                  >
                    <RotateCcw className="size-3" aria-hidden /> Reset day
                  </button>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {day.exercises.map((ex, i) => (
                  <li
                    key={`${ex.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    <div className="w-12 shrink-0">
                      <MediaBox name={ex.name} compact src={ex.media} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ex.name}</p>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {ex.sets} × {ex.reps}
                        {ex.perSide ? " per side" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${ex.name}`}
                      onClick={() => setDraft({ day: day.day, ex: { ...ex, index: i } })}
                      className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${ex.name}`}
                      onClick={() => removeExercise(day.day, i)}
                      className="grid size-9 place-items-center rounded-full border border-border text-rose"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  setDraft({
                    day: day.day,
                    ex: { name: "", sets: 3, reps: "10–12", index: day.exercises.length },
                  })
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"
              >
                <Plus className="size-3.5 text-rose" aria-hidden /> Add exercise
              </button>
            </section>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-20 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-5">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
            <h2 className="text-lg font-semibold">
              {draft.ex.name ? "Edit exercise" : "New exercise"}
            </h2>
            <div className="mt-4 space-y-3">
              <Field label="Workout name">
                <input
                  value={draft.ex.name}
                  onChange={(e) => setDraft({ ...draft, ex: { ...draft.ex, name: e.target.value } })}
                  placeholder="Hip Thrust"
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sets">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draft.ex.sets}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ex: { ...draft.ex, sets: Math.max(1, Number(e.target.value) || 1) },
                      })
                    }
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label="Reps">
                  <input
                    value={draft.ex.reps}
                    onChange={(e) => setDraft({ ...draft, ex: { ...draft.ex, reps: e.target.value } })}
                    placeholder="8–10"
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
              </div>
              <Field label="Demo image or GIF link (optional)">
                <input
                  value={draft.ex.media ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, ex: { ...draft.ex, media: e.target.value || undefined } })
                  }
                  placeholder="https://…"
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.ex.perSide ?? false}
                  onChange={(e) =>
                    setDraft({ ...draft, ex: { ...draft.ex, perSide: e.target.checked || undefined } })
                  }
                  className="size-4 accent-[var(--rose)]"
                />
                Reps are per side
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!draft.ex.name.trim()}
                onClick={saveDraft}
                className="flex-1 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
