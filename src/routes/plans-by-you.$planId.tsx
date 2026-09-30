import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Heart } from "lucide-react";
import { PlanPreview } from "@/components/PlanPreview";
import { useAuth } from "@/hooks/useAuth";
import { errorText, getCommunityPlan, goalName, setFollow, type PublicPlan } from "@/lib/community";
import { planAccent } from "@/lib/plan-theme";
import { useT } from "@/lib/i18n";
import { choosePlan, followIntoMyPlans, useStore } from "@/lib/store";

export const Route = createFileRoute("/plans-by-you/$planId")({
  head: () => ({
    meta: [
      { title: "Plan preview — Plans by You | 5 Days No Drama" },
      {
        name: "description",
        content: "Preview every day of a community workout plan and follow it.",
      },
    ],
  }),
  component: CommunityPlanPage,
});

function CommunityPlanPage() {
  const { planId } = Route.useParams();
  const state = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [plan, setPlan] = useState<PublicPlan | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getCommunityPlan(planId)
      .then((p) => alive && setPlan(p))
      .catch((e) => {
        if (!alive) return;
        setPlan(null);
        setError(t.c(errorText(e)));
      });
    return () => {
      alive = false;
    };
  }, [planId, user?.id]);

  const myCopy = Object.values(state.myPlans ?? {}).find(
    (p) => p.origin.kind === "community" && p.origin.communityId === planId,
  );
  const isAuthor = Boolean(user && plan && plan.authorId === user.id);

  if (plan === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-24">
        <p className="surface p-5 text-sm text-muted-foreground">{t("pby.loadingOne")}</p>
      </main>
    );
  }

  if (!plan || !plan.content || (plan.status !== "approved" && !isAuthor)) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">{t("pby.notAvailable")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? t("pby.notAvailableBody")}</p>
          <Link
            to="/plans-by-you"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {t("pby.browse")}
          </Link>
        </div>
      </main>
    );
  }

  const accent = planAccent(plan.base);
  const content = plan.content;

  const follow = async () => {
    setBusy(true);
    setError(null);
    try {
      if (user) {
        const count = await setFollow(plan.id, true);
        setPlan({ ...plan, followers: count });
      }
      const id = followIntoMyPlans({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        base: plan.base,
        version: plan.version,
        author: plan.author,
        content,
      });
      choosePlan(id);
      navigate({ to: "/plan/$planId", params: { planId: id } });
    } catch (e) {
      setError(t.c(errorText(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28">
      <div className="pt-6 pe-40">
        <Link to="/plans-by-you" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("menu.plansByYou")}
        </Link>
      </div>

      <header className={`surface mt-5 overflow-hidden`}>
        <div className={`${accent.bg} ${accent.on} px-5 py-6`}>
          <p className="eyebrow opacity-80">
            {t.c(goalName(plan.base))} · {t("pby.shapeLong")}
          </p>
          <h1 className="mt-1.5 text-3xl leading-tight break-words">{plan.name}</h1>
          <p className="mt-1.5 text-sm font-bold uppercase opacity-90">
            {t("common.byAuthor", { author: plan.author })}
          </p>
        </div>
        <div className="px-5 py-4">
          {plan.description && <p className="text-sm whitespace-pre-line">{plan.description}</p>}
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase">
            <Heart className="size-3.5 text-pink" aria-hidden />{" "}
            {t.plural("pby.followers", plan.followers)}
          </p>
          {plan.status !== "approved" && (
            <p className="mt-2 rounded-lg bg-secondary p-2.5 text-xs font-semibold">
              {t("pby.onlyYou")}
            </p>
          )}
        </div>
      </header>

      <section className="mt-6">
        <PlanPreview content={content} />
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className="min-w-0 flex-1 text-[11px] font-bold text-muted-foreground uppercase">
            {error ??
              (isAuthor
                ? t("pby.yourPlan")
                : myCopy
                  ? t("pby.youFollow")
                  : user
                    ? t("pby.copiesInto")
                    : t("pby.signInCount"))}
          </p>
          {myCopy ? (
            <Link
              to="/plan/$planId"
              params={{ planId: myCopy.id }}
              onClick={() => choosePlan(myCopy.id)}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-xs font-bold text-paper uppercase"
            >
              <Check className="size-4" aria-hidden /> {t("pby.openCopy")}
            </Link>
          ) : isAuthor ? (
            <Link
              to="/my-plans"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-xs font-bold text-paper uppercase"
            >
              {t("menu.myPlans")} <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              disabled={busy || plan.status !== "approved"}
              onClick={follow}
              className="inline-flex items-center gap-2 rounded-full bg-spicy px-5 py-3.5 text-xs font-bold text-accent-foreground uppercase shadow-[var(--shadow-lift)] disabled:opacity-50"
            >
              <Heart className="size-4" aria-hidden /> {busy ? t("pby.following") : t("pby.follow")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
