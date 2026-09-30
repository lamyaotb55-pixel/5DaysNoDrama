import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Heart, Plus } from "lucide-react";
import { errorText, goalName, listPublicPlans, type PublicPlan } from "@/lib/community";
import { BUILTIN_IDS, type BuiltinPlanId } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const [sort, setSort] = useState<"followers" | "newest">("followers");
  const [goal, setGoal] = useState<BuiltinPlanId | "all">("all");
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    listPublicPlans(sort)
      .then((list) => alive && setPlans(list))
      .catch((e) => alive && setError(t.c(errorText(e))));
    return () => {
      alive = false;
    };
  }, [sort]);

  const shown = (plans ?? []).filter((p) => goal === "all" || p.base === goal);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-6 pe-40">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("common.home")}
        </Link>
        <Link
          to="/my-plans"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
        >
          <Plus className="size-3.5 text-spicy" aria-hidden /> {t("pby.shareYours")}
        </Link>
      </div>

      <header className="pt-8 pb-6">
        <p className="eyebrow text-pink">{t("pby.eyebrow")}</p>
        <h1 className="mt-2 text-4xl leading-[0.9]">{t("menu.plansByYou")}</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("pby.lede")}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("pby.filter")}>
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
              {g === "all" ? t("pby.allGoals") : t.c(goalName(g))}
            </button>
          ))}
        </div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase">
          {t("pby.sort")}{" "}
          <select
            id="pby-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as "followers" | "newest")}
            className="ms-1 rounded-full border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-ink uppercase"
          >
            <option value="followers">{t("pby.mostFollowed")}</option>
            <option value="newest">{t("pby.newest")}</option>
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-3">
        {error && <p className="surface p-5 text-sm font-semibold text-spicy">{error}</p>}
        {!error && plans === null && (
          <p className="surface p-5 text-sm text-muted-foreground">{t("pby.loading")}</p>
        )}
        {plans !== null && shown.length === 0 && (
          <div className="surface p-6 text-center">
            <p className="text-sm font-semibold">
              {plans.length === 0 ? t("pby.none") : t("pby.noneForGoal")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("pby.beFirst")}</p>
            <Link
              to="/my-plans"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-spicy px-4 py-2.5 text-xs font-bold text-accent-foreground uppercase"
            >
              {t("pby.goToMyPlans")}{" "}
              <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
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
                <p className="eyebrow opacity-80">
                  {t.c(goalName(p.base))} · {t("pby.shape")}
                </p>
                <h2 className="mt-1 text-2xl leading-tight break-words">{p.name}</h2>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase">
                    {t("common.byAuthor", { author: p.author })}
                  </p>
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
