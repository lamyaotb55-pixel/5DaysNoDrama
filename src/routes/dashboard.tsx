import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Flame, History, RotateCcw, Trophy } from "lucide-react";
import { ProgressChart } from "@/components/ProgressChart";
import { WEEKS, getPlan } from "@/lib/plans";
import { activeRun, dayKey, restartPlan, useTracker } from "@/lib/tracker";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Progress Dashboard — FitFlow" },
      {
        name: "description",
        content:
          "Week-by-week progress for your 8-week plan: completed days, training volume and past plan history.",
      },
      { property: "og:title", content: "Your Progress Dashboard — FitFlow" },
      {
        property: "og:description",
        content: "See completed days, weekly progress and your training history.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useTracker();
  const run = activeRun(state);
  const plan = run ? getPlan(run.planId) : undefined;
  const history = state.runs.filter((r) => r.id !== state.activeRunId);

  if (!run || !plan) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="surface max-w-sm p-8 text-center">
          <h1 className="text-2xl font-bold">No active plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a plan to start tracking your 8 weeks.
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

  const totalDays = WEEKS * 5;
  const doneCount = Object.keys(run.done).length;
  const pct = Math.round((doneCount / totalDays) * 100);
  const volume = Object.values(run.logs).reduce(
    (sum, l) => sum + l.reps * l.rounds * (l.weight || 0),
    0,
  );

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-pink">
            ← All plans
          </Link>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">
            {plan.emoji} {plan.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Started {new Date(run.startedAt).toLocaleDateString()} · 8-week track
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Start a fresh 8-week track? Your current progress is saved to history."))
              restartPlan(run.planId);
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:border-pink hover:text-pink"
        >
          <RotateCcw className="size-4" aria-hidden />
          Restart plan
        </button>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-xs font-semibold text-muted-foreground">Overall progress</p>
          <p className="mt-1 text-3xl font-extrabold gradient-text">{pct}%</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${pct}%`, background: "var(--gradient-hero)" }}
            />
          </div>
        </div>
        <div className="surface p-5">
          <p className="text-xs font-semibold text-muted-foreground">Days smashed</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-extrabold">
            <Flame className="size-6 text-pink" aria-hidden />
            {doneCount}
            <span className="text-base font-medium text-muted-foreground">/ {totalDays}</span>
          </p>
        </div>
        <div className="surface p-5">
          <p className="text-xs font-semibold text-muted-foreground">Weight lifted</p>
          <p className="mt-1 flex items-center gap-2 text-3xl font-extrabold">
            <Trophy className="size-6 text-sky" aria-hidden />
            {volume.toLocaleString()}
            <span className="text-base font-medium text-muted-foreground">kg</span>
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Weekly progress</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((week) => {
            const doneInWeek = plan.days.filter((_, d) => run.done[dayKey(week, d + 1)]).length;
            const weekPct = (doneInWeek / 5) * 100;
            return (
              <div key={week} className="surface p-5">
                <div className="flex items-center justify-between">
                  <p className="font-bold">Week {week}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{doneInWeek}/5 days</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${weekPct}%`,
                      background: weekPct === 100 ? "var(--pink)" : "var(--sky)",
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {plan.days.map((day, idx) => {
                    const done = Boolean(run.done[dayKey(week, idx + 1)]);
                    return (
                      <Link
                        key={day.title}
                        to="/day/$week/$day"
                        params={{ week: String(week), day: String(idx + 1) }}
                        className={
                          "flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-semibold transition-transform hover:-translate-y-0.5 " +
                          (done
                            ? "border-pink bg-pink text-accent-foreground"
                            : "border-border bg-secondary text-foreground")
                        }
                      >
                        {done ? <Check className="size-3.5" aria-hidden /> : <span>D{idx + 1}</span>}
                        <span className="truncate">{done ? "Done" : day.focus.split(" ")[0]}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <History className="size-5 text-muted-foreground" aria-hidden />
            History
          </h2>
          <ul className="mt-4 space-y-3">
            {history
              .slice()
              .reverse()
              .map((r) => {
                const p = getPlan(r.planId);
                const dc = Object.keys(r.done).length;
                return (
                  <li key={r.id} className="surface flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold">
                        {p?.emoji} {p?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.startedAt).toLocaleDateString()} →{" "}
                        {r.finishedAt ? new Date(r.finishedAt).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      {dc}/{totalDays}{" "}
                      <span className="font-medium text-muted-foreground">days</span>
                    </p>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </main>
  );
}
