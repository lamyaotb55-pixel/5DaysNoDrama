import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Plus } from "lucide-react";
import { errorText, goalName, listPublicPlans, type PublicPlan } from "@/lib/community";
import { BUILTIN_IDS, type BuiltinPlanId } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";

export const Route = createFileRoute("/plans-by-you/")({
  head: () => ({
    meta: [
      { title: "Plans by You — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Workout plans made by the 5 Days No Drama community. Browse, preview every day and follow one.",
      },
      { property: "og:title", content: "Plans by You — 5 Days No Drama" },
    ],
  }),
  component: PlansByYouPage,
});

function PlansByYouPage() {
  const [sort, setSort] = useState<"followers" | "newest">("followers");
  const [goal, setGoal] = useState<BuiltinPlanId | "all">("all");
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    listPublicPlans(sort)
      .then((list) => alive && setPlans(list))
      .catch((e) => alive && setError(errorText(e)));
    return () => {
      alive = false;
    };
  }, [sort]);

  const shown = (plans ?? []).filter((p) => goal === "all" || p.base === goal);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-6 pr-14">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
        <Link
          to="/my-plans"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
        >
          <Plus className="size-3.5 text-spicy" aria-hidden /> Share yours
        </Link>
      </div>

      <header className="pt-8 pb-6">
        <p className="eyebrow text-pink">Made by the community</p>
        <h1 className="mt-2 text-4xl leading-[0.9]">Plans by You</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          8-week plans built and shared by people who train with 5 Days No Drama. Every plan is
          reviewed before it appears here.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by goal">
          {(["all", ...BUILTIN_IDS] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={goal === g}
              onClick={() => setGoal(g)}
              className={
                "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase " +
                (goal === g ? "bg-ink text-paper" : "border border-border bg-card")
              }
            >
              {g === "all" ? "All goals" : goalName(g)}
            </button>
          ))}
        </div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase">
          Sort{" "}
          <select
            id="pby-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as "followers" | "newest")}
            className="ml-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-ink uppercase"
          >
            <option value="followers">Most followed</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {error && <p className="surface p-5 text-sm font-semibold text-spicy">{error}</p>}
        {!error && plans === null && (
          <p className="surface p-5 text-sm text-muted-foreground">Loading plans…</p>
        )}
        {plans !== null && shown.length === 0 && (
          <div className="surface p-6 text-center">
            <p className="text-sm font-semibold">
              {plans.length === 0 ? "No shared plans yet." : "No plans for this goal yet."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Build your own in My Plans and be the first to share one.
            </p>
            <Link
              to="/my-plans"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-spicy px-4 py-2.5 text-xs font-bold text-accent-foreground uppercase"
            >
              Go to My Plans <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        )}
        {shown.map((p) => {
          const accent = planAccent(p.base);
          return (
            <Link
              key={p.id}
              to="/plans-by-you/$planId"
              params={{ planId: p.id }}
              className="surface block overflow-hidden transition-transform hover:-translate-y-0.5"
            >
              <div className={`${accent.bg} ${accent.on} px-5 py-4`}>
                <p className="eyebrow opacity-80">{goalName(p.base)} · 8 weeks · 5 days</p>
                <h2 className="mt-1 text-2xl leading-tight break-words">{p.name}</h2>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase">by {p.author}</p>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums">
                  <Heart className="size-3.5 text-pink" aria-hidden /> {p.followers}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
