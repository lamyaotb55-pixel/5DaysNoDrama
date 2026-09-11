import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { WeightChart } from "@/components/WeightChart";
import { getPlan } from "@/lib/program";
import { totalVolume, useStore, weeklyConsistency, weeklyHighlights } from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Workouts completed, weekly consistency, weight progression per exercise, personal records, training volume and full workout history.",
      },
      { property: "og:title", content: "My Progress — 5 Days No Drama" },
      {
        property: "og:description",
        content: "Consistency, personal records, volume and weight progression in one clean view.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const state = useStore();
  const plan = getPlan(state.activePlanId ?? undefined);
  const consistency = weeklyConsistency(state.history);
  const volume = totalVolume(state.history);
  const prs = Object.entries(state.prs).sort((a, b) => b[1].weight - a[1].weight);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-8">
        <Link to="/" className="text-xs font-semibold text-muted-foreground">
          ← Plans
        </Link>
      </div>

      <header className="mt-3">
        <p className="eyebrow text-rose">Progress</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Your numbers</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {plan ? (
            <>
              Current plan:{" "}
              <Link
                to="/plan/$planId"
                params={{ planId: plan.id }}
                className="font-semibold text-ink underline decoration-rose"
              >
                {plan.name}
              </Link>
            </>
          ) : (
            "No plan selected yet."
          )}
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Workouts completed" value={String(state.history.length)} />
        <Stat label="This week" value={`${consistency.thisWeek}/5 · ${consistency.pct}%`} />
        <Stat label="Total volume" value={`${volume.toLocaleString()} kg`} />
        <Stat label="Personal records" value={String(prs.length)} />
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-lg font-semibold">Weight progression</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          Top set per session for each exercise — progressive overload made visible.
        </p>
        <WeightChart trend={state.trend} />
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-lg font-semibold">Personal records</h2>
        {prs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your heaviest set for each exercise shows up here after your first workout.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {prs.map(([name, pr]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"
              >
                <span className="inline-flex items-center gap-2 font-medium">
                  <Trophy className="size-3.5 text-rose" aria-hidden />
                  {name}
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {pr.weight} kg × {pr.reps}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-lg font-semibold">Workout history</h2>
        {state.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No workouts logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.history.map((h) => (
              <li key={`${h.planId}-${h.day}-${h.at}`} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Day {h.day} · {h.title}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(h.at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {h.focus} · {h.sets} sets · {h.volume.toLocaleString()} kg · {h.durationMin} min
                  {h.cardio ? " · cardio ✓" : ""}
                </p>
                {h.notes && (
                  <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground italic">
                    “{h.notes}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
