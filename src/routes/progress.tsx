import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { PrCelebration } from "@/components/PrCelebration";
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
  const week = weeklyHighlights(state.history);
  const prs = Object.entries(state.prs).sort((a, b) => b[1].weight - a[1].weight);
  const weekComplete = week.workouts >= 5;

  // PRs set during the most recent finished workout get the celebration treatment.
  const lastAt = state.history.length
    ? Math.max(...state.history.map((h) => h.at))
    : 0;
  const freshPrs = prs.filter(([, pr]) => lastAt > 0 && pr.at >= lastAt - 2000);
  const freshNames = freshPrs.map(([name]) => name);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!freshNames.length) return;
    const sig = `pr-cheered:${lastAt}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sig)) return;
    sessionStorage.setItem(sig, "1");
    setCelebrate(true);
  }, [lastAt, freshNames.length]);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      {celebrate && (
        <PrCelebration
          prs={freshPrs.map(([name, pr]) => `${name} · ${pr.weight} kg × ${pr.reps}`)}
          onDone={() => setCelebrate(false)}
        />
      )}
      <div className="flex items-center justify-between pt-8">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
        <Link
          to="/theme"
          className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold uppercase"
        >
          Palette
        </Link>
      </div>

      <header className="mt-4">
        <p className="eyebrow text-spicy">Progress</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">You showed up.</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">
          {plan ? (
            <>
              Current plan:{" "}
              <Link
                to="/plan/$planId"
                params={{ planId: plan.id }}
                className="text-ink underline decoration-spicy decoration-2 underline-offset-4"
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
        <Stat label="Workouts done" value={String(state.history.length)} />
        <Stat label="This week" value={`${consistency.thisWeek}/5 · ${consistency.pct}%`} />
        <Stat label="Total volume" value={`${volume.toLocaleString()} kg`} />
        <Stat label="Personal records" value={String(prs.length)} accent="acid" />
      </section>

      <section className="surface mt-4 p-5">
        <p className="eyebrow text-pink">This week</p>
        <h2 className="mt-1 text-xl">
          {weekComplete ? "5/5. That's the week ✓" : "Weekly highlights"}
        </h2>
        {week.workouts === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Nothing logged in the last 7 days yet — finish a day and it lands here.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className={"rounded-lg p-3 " + (weekComplete ? "bg-success" : "bg-ice")}>
                <p className="eyebrow text-ink/70">Workouts</p>
                <p className="mt-0.5 font-display text-xl text-ink">{week.workouts}/5</p>
              </div>
              <div className="rounded-lg bg-ice p-3">
                <p className="eyebrow text-ink/70">Volume</p>
                <p className="mt-0.5 font-display text-xl text-ink">
                  {week.volume.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-ice p-3">
                <p className="eyebrow text-ink/70">Sets</p>
                <p className="mt-0.5 font-display text-xl text-ink">{week.sets}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground uppercase">
              {week.minutes} min trained
              {week.bestDay ? ` · biggest day: ${week.bestDay.title}` : ""}
            </p>
            <div className="mt-3 rounded-lg bg-acid p-3">
              <p className="eyebrow text-ink">Records this week</p>
              {week.prs.length === 0 ? (
                <p className="mt-1 text-xs font-bold text-ink/70 uppercase">
                  No new PRs yet — add a little weight next session.
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-xs font-bold text-ink uppercase">
                  {week.prs.map((pr) => (
                    <li key={pr}>New PR ⚡ {pr}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">Weight progression</h2>
        <p className="mt-1 mb-4 text-xs font-semibold text-muted-foreground">
          Top set per session for each exercise — progressive overload made visible.
        </p>
        <WeightChart trend={state.trend} />
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">Personal records</h2>
        {prs.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Your heaviest set for each exercise shows up here after your first workout.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {prs.map(([name, pr]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"
              >
                <span className="inline-flex items-center gap-2 font-semibold">
                  <Trophy className="size-3.5 text-ink" aria-hidden />
                  {name}
                </span>
                <span className="rounded-full bg-acid px-2 py-0.5 text-xs font-bold whitespace-nowrap text-ink">
                  {pr.weight} kg × {pr.reps}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">Workout history</h2>
        {state.history.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">No workouts logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.history.map((h) => (
              <li key={`${h.planId}-${h.day}-${h.at}`} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold uppercase">
                    Day {String(h.day).padStart(2, "0")} · {h.title}
                  </p>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {new Date(h.at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
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

function Stat({
  label,
  value,
  accent = "ice",
}: {
  label: string;
  value: string;
  accent?: "ice" | "acid";
}) {
  return (
    <div className={"rounded-xl p-4 " + (accent === "acid" ? "bg-acid" : "bg-ice")}>
      <p className="eyebrow text-ink/70">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
