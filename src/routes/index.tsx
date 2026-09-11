import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarDays, Dumbbell, LineChart, Play } from "lucide-react";
import { PLANS, WEEKS, getPlan } from "@/lib/plans";
import { activeRun, dayKey, startPlan, useTracker } from "@/lib/tracker";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitFlow — 8-Week Workout Plans & Progress Tracker" },
      {
        name: "description",
        content:
          "Pick a plan — Lose Weight, Tone Up or Build Muscle — and track reps, rounds and weight across 8 weeks with a weekly progress dashboard.",
      },
      { property: "og:title", content: "FitFlow — 8-Week Workout Plans & Progress Tracker" },
      {
        property: "og:description",
        content: "Choose your 8-week plan, log every set and watch your weekly progress grow.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const state = useTracker();
  const run = activeRun(state);
  const navigate = useNavigate();
  const current = run ? getPlan(run.planId) : undefined;
  const [picking, setPicking] = useState(false);

  const doneCount = run ? Object.keys(run.done).length : 0;
  const totalDays = WEEKS * 5;
  const pct = Math.round((doneCount / totalDays) * 100);

  let nextWeek = 1;
  let nextDay = 1;
  if (run) {
    outer: for (let w = 1; w <= WEEKS; w++) {
      for (let d = 1; d <= 5; d++) {
        if (!run.done[dayKey(w, d)]) {
          nextWeek = w;
          nextDay = d;
          break outer;
        }
      }
    }
  }
  const allDone = doneCount >= totalDays;
  const showActive = Boolean(run && current) && !picking;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden px-5 pt-14 pb-10 sm:pt-20">
        <div className="absolute inset-0 grid-fade" aria-hidden />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
            <Dumbbell className="size-3.5 text-pink" aria-hidden />
            {WEEKS} weeks · 5 training days each
          </span>
          <h1 className="mt-5 text-4xl leading-tight font-extrabold sm:text-6xl">
            {showActive ? (
              <>
                Keep going.
                <br />
                <span className="gradient-text">One day at a time.</span>
              </>
            ) : (
              <>
                Choose your plan.
                <br />
                <span className="gradient-text">Track every rep.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            {showActive
              ? "Your active plan and next workout are right here. The full progress dashboard lives on its own page."
              : "Three focused programs, weekly progression built in, and a dashboard that shows exactly how far you have come."}
          </p>
        </div>
      </section>

      {showActive && run && current ? (
        <section className="mx-auto max-w-2xl px-5 pb-20">
          <article className="surface p-7 text-center">
            <span className="text-4xl" aria-hidden>
              {current.emoji}
            </span>
            <h2 className="mt-3 text-2xl font-bold">{current.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{current.tagline}</p>

            <div className="mt-6">
              <div className="flex items-end justify-between text-xs font-semibold text-muted-foreground">
                <span>
                  {doneCount}/{totalDays} days done
                </span>
                <span className="gradient-text text-lg font-extrabold">{pct}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: "var(--gradient-hero)" }}
                />
              </div>
            </div>

            {!allDone ? (
              <>
                <p className="mt-6 text-sm font-semibold">
                  Up next · Week {nextWeek} · {current.days[nextDay - 1]?.title} —{" "}
                  <span className="text-muted-foreground">{current.days[nextDay - 1]?.focus}</span>
                </p>
                <Link
                  to="/day/$week/$day"
                  params={{ week: String(nextWeek), day: String(nextDay) }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5"
                >
                  <Play className="size-4" aria-hidden />
                  Start Workout
                </Link>
              </>
            ) : (
              <p className="mt-6 text-sm font-semibold text-pink">
                All 8 weeks complete — legend. 🏆
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-sky hover:text-sky"
              >
                <LineChart className="size-4" aria-hidden />
                View dashboard
              </Link>
              <button
                onClick={() => setPicking(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-pink hover:text-pink"
              >
                Switch plan
              </button>
            </div>
          </article>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl px-5 pb-20">
          {run && current && (
            <div className="mb-5 text-center">
              <button
                onClick={() => setPicking(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-pink"
              >
                ← Back to my active plan
              </button>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className="surface flex flex-col p-6 transition-transform hover:-translate-y-1"
              >
                <span className="text-3xl" aria-hidden>
                  {plan.emoji}
                </span>
                <h2 className="mt-3 text-xl font-bold">{plan.name}</h2>
                <p className="mt-2 grow text-sm text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {plan.days.map((d) => (
                    <li key={d.title} className="flex items-center gap-2">
                      <CalendarDays className="size-3.5 text-sky" aria-hidden />
                      <span className="font-medium text-foreground">{d.title}</span> {d.focus}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    startPlan(plan.id);
                    setPicking(false);
                    navigate({ to: "/" });
                  }}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-sky px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Start this plan
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

