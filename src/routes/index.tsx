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
            Choose your plan.
            <br />
            <span className="gradient-text">Track every rep.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Three focused programs, weekly progression built in, and a dashboard that shows exactly
            how far you have come.
          </p>

          {current && run && (
            <div className="surface mx-auto mt-8 flex max-w-md flex-col items-center gap-3 p-5">
              <p className="text-sm text-muted-foreground">
                You have an active track: <strong className="text-foreground">{current.name}</strong>{" "}
                · {Object.keys(run.done).length}/{WEEKS * 5} days done
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-pink px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5"
              >
                <LineChart className="size-4" aria-hidden />
                Go to dashboard
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-5 pb-20 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <article key={plan.id} className="surface flex flex-col p-6 transition-transform hover:-translate-y-1">
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
                navigate({ to: "/dashboard" });
              }}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-sky px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start this plan
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
