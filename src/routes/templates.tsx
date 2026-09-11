import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { getPlan, type Exercise, type PlanId } from "@/lib/plans";
import {
  activeRun,
  effectivePlan,
  resetTemplate,
  saveTemplate,
  templateKey,
  useTracker,
} from "@/lib/tracker";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Customize Workout Templates — FitFlow" },
      {
        name: "description",
        content:
          "Build your own workout templates: choose exercises, rounds, rep targets and starting weight, then reuse them across all 8 weeks.",
      },
      { property: "og:title", content: "Customize Workout Templates — FitFlow" },
      {
        property: "og:description",
        content: "Edit the exercises and targets for each training day and reuse them every week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Templates,
});

function Templates() {
  const state = useTracker();
  const run = activeRun(state);
  const basePlan = run ? getPlan(run.planId) : undefined;

  if (!run || !basePlan) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="surface max-w-sm p-8 text-center">
          <h1 className="text-2xl font-bold">No active plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a plan first, then customize its training days.
          </p>
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

  const plan = effectivePlan(basePlan, state.templates);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/dashboard" className="text-xs font-semibold text-muted-foreground hover:text-pink">
        ← Dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
        Customize {plan.emoji} {plan.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Edit the movements, rounds, rep targets and starting weight for each day. Saved days are
        reused across all 8 weeks, with the weekly progression applied on top.
      </p>

      <div className="mt-8 space-y-6">
        {plan.days.map((day, i) => (
          <DayEditor
            key={day.title}
            planId={plan.id}
            dayNo={i + 1}
            title={`${day.title} · ${day.focus}`}
            exercises={day.exercises}
            customized={Boolean(state.templates?.[templateKey(plan.id, i + 1)])}
          />
        ))}
      </div>
    </main>
  );
}

function DayEditor({
  planId,
  dayNo,
  title,
  exercises,
  customized,
}: {
  planId: PlanId;
  dayNo: number;
  title: string;
  exercises: Exercise[];
  customized: boolean;
}) {
  const [draft, setDraft] = useState<Exercise[]>(exercises);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(exercises);
  }, [exercises]);

  const update = (idx: number, patch: Partial<Exercise>) =>
    setDraft((d) => d.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        {customized && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-sky">
            Custom template
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {draft.map((ex, idx) => (
          <div key={idx} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={ex.emoji}
                onChange={(e) => update(idx, { emoji: e.target.value.slice(0, 2) })}
                aria-label="Emoji"
                className="w-12 rounded-lg border border-input bg-card px-2 py-2 text-center text-sm outline-none focus:border-sky"
              />
              <input
                value={ex.name}
                onChange={(e) => update(idx, { name: e.target.value })}
                placeholder="Exercise name"
                aria-label="Exercise name"
                className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-sky"
              />
              <button
                onClick={() => setDraft((d) => d.filter((_, i) => i !== idx))}
                aria-label={`Remove ${ex.name}`}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:border-pink hover:text-pink"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
            <input
              value={ex.cue}
              onChange={(e) => update(idx, { cue: e.target.value })}
              placeholder="Form cue"
              aria-label="Form cue"
              className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-sky"
            />
            <div className="mt-2 grid grid-cols-3 gap-2">
              <NumberField
                label="Reps"
                value={ex.reps}
                onChange={(v) => update(idx, { reps: v })}
              />
              <NumberField
                label="Rounds"
                value={ex.rounds}
                onChange={(v) => update(idx, { rounds: v })}
              />
              <NumberField
                label="Weight (kg)"
                value={ex.weight}
                onChange={(v) => update(idx, { weight: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() =>
            setDraft((d) => [
              ...d,
              { name: "New exercise", cue: "", emoji: "🏋️", reps: 10, rounds: 3, weight: 0 },
            ])
          }
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:border-sky hover:text-sky"
        >
          <Plus className="size-4" aria-hidden /> Add exercise
        </button>
        <button
          onClick={() => {
            saveTemplate(planId, dayNo, draft.filter((ex) => ex.name.trim()));
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-pink px-4 py-2 text-sm font-bold text-accent-foreground"
        >
          <Save className="size-4" aria-hidden /> {saved ? "Saved!" : "Save template"}
        </button>
        {customized && (
          <button
            onClick={() => resetTemplate(planId, dayNo)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-pink hover:text-pink"
          >
            <RotateCcw className="size-4" aria-hidden /> Reset to default
          </button>
        )}
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-center text-sm font-bold outline-none focus:border-sky"
      />
    </label>
  );
}
