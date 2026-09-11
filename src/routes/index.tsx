import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/program";
import { choosePlan, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        name: "description",
        content:
          "Choose Lose Weight, Tone Up or Build Muscle. Five focused training days, set-by-set tracking and clear progress — no drama.",
      },
      { property: "og:title", content: "5 Days No Drama — 5-Day Workout Plans & Tracker" },
      {
        property: "og:description",
        content: "Three plans, five training days, every set tracked. Strong, simple, premium.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const state = useStore();

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <section className="pt-12 pb-8 text-center">
        <span className="eyebrow inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
          <Sparkles className="size-3 text-rose" aria-hidden /> 3 plans · 5 training days
        </span>
        <h1 className="mt-5 text-4xl leading-[1.05] font-semibold sm:text-5xl">
          5 Days
          <br />
          <span className="text-rose italic">No Drama</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
          Pick your plan, open the day, log every set. Strong training without the noise.
        </p>
        {state.history.length > 0 && (
          <Link
            to="/progress"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"
          >
            <LineChart className="size-3.5 text-rose" aria-hidden /> View my progress
          </Link>
        )}
      </section>

      <div className="space-y-4">
        {PLANS.map((plan) => {
          const isActive = state.activePlanId === plan.id;
          return (
            <article key={plan.id} className="surface overflow-hidden">
              <div className="warm-wash px-5 py-6">
                <p className="eyebrow text-ink/60">{plan.label}</p>
                <h2 className="mt-1.5 text-2xl font-semibold uppercase">{plan.name}</h2>
                <p className="mt-1 text-sm font-medium text-ink/70">{plan.slogan}</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs leading-relaxed text-muted-foreground">{plan.style}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    to="/plan/$planId"
                    params={{ planId: plan.id }}
                    onClick={() => choosePlan(plan.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-primary-foreground"
                  >
                    {isActive ? "Continue Plan" : "Start Plan"}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  {isActive && (
                    <span className="rounded-full bg-rose px-3 py-1 text-[10px] font-bold text-accent-foreground">
                      Current plan
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
