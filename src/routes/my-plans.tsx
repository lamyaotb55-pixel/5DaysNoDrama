import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Pencil, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import {
  errorText,
  getCommunityPlans,
  goalName,
  myLatestSubmissions,
  shareStatus,
  type PublicPlan,
  type Submission,
} from "@/lib/community";
import { PLANS, getPlan } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
  applyCommunityUpdate,
  choosePlan,
  createMyPlan,
  deleteMyPlan,
  useStore,
  type MyPlan,
} from "@/lib/store";

export const Route = createFileRoute("/my-plans")({
  head: () => ({
    meta: [
      { title: "My Plans — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Your own workout plans: copies you've customized, plans built from scratch and plans you follow.",
      },
    ],
  }),
  component: MyPlansPage,
});

const TONES = {
  muted: "bg-secondary text-muted-foreground",
  wait: "bg-ice/30 text-ink",
  live: "bg-success/20 text-ink",
  warn: "bg-spicy/10 text-spicy",
};

function MyPlansPage() {
  const state = useStore();
  const hydrated = useHydrated();
  const { user } = useAuth();
  const navigate = useNavigate();
  const plans = Object.values(state.myPlans ?? {}).sort((a, b) => b.updatedAt - a.updatedAt);
  const [community, setCommunity] = useState<Record<string, PublicPlan>>({});
  const [subs, setSubs] = useState<Record<string, Submission>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const linked = plans
    .map((p) => (p.origin.kind === "community" ? p.origin.communityId : p.communityId))
    .filter((x): x is string => Boolean(x));
  const linkedKey = linked.sort().join(",");
  const ownedKey = plans
    .map((p) => p.communityId)
    .filter(Boolean)
    .join(",");

  useEffect(() => {
    if (!linkedKey) return;
    let alive = true;
    getCommunityPlans(linkedKey.split(","))
      .then((list) => alive && setCommunity(Object.fromEntries(list.map((p) => [p.id, p]))))
      .catch((e) => alive && setLoadError(errorText(e)));
    return () => {
      alive = false;
    };
  }, [linkedKey, user?.id]);

  useEffect(() => {
    if (!ownedKey || !user) return;
    let alive = true;
    myLatestSubmissions(ownedKey.split(","))
      .then((s) => alive && setSubs(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ownedKey, user]);

  const start = (from: string | null) => {
    const id = createMyPlan(from);
    navigate({ to: "/customize/$planId", params: { planId: id } });
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-6 pr-14">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
        <Link
          to="/plans-by-you"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
        >
          <Users className="size-3.5 text-pink" aria-hidden /> Plans by You
        </Link>
      </div>

      <header className="pt-8 pb-6">
        <p className="eyebrow text-spicy">Your programs</p>
        <h1 className="mt-2 text-4xl leading-[0.9]">My Plans</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">
          Make a plan yours: copy one of ours or start blank, rename it, change every day. Share it
          on Plans by You when it's ready.
        </p>
      </header>

      {hydrated && plans.length > 0 && (
        <ul className="space-y-3">
          {plans.map((p) => {
            const accent = planAccent(p.base);
            const followedId = p.origin.kind === "community" ? p.origin.communityId : null;
            const followed = followedId ? community[followedId] : undefined;
            const updateReady =
              p.origin.kind === "community" &&
              followed?.status === "approved" &&
              followed.content &&
              followed.version > p.origin.version;
            const status = shareStatus(
              p,
              p.communityId ? community[p.communityId] : undefined,
              p.communityId ? subs[p.communityId] : undefined,
            );
            return (
              <li key={p.id} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`eyebrow ${accent.text}`}>
                      {goalName(p.base)} ·{" "}
                      {p.origin.kind === "community"
                        ? `by ${p.origin.author}`
                        : p.origin.kind === "blank"
                          ? "built from scratch"
                          : `from ${getPlan(p.origin.planId)?.name ?? "a plan"}`}
                    </p>
                    <h2 className="mt-1 text-2xl leading-tight break-words">{p.name}</h2>
                    {p.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                {(status || updateReady) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {status && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${TONES[status.tone]}`}
                      >
                        {status.label}
                      </span>
                    )}
                    {updateReady && (
                      <span className="rounded-full bg-acid px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                        Update available
                      </span>
                    )}
                  </div>
                )}
                {status?.note && (
                  <p className="mt-2 rounded-lg bg-secondary p-2.5 text-xs">
                    <b>Review note:</b> {status.note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/plan/$planId"
                    params={{ planId: p.id }}
                    onClick={() => choosePlan(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full ${accent.bg} ${accent.on} px-4 py-2.5 text-xs font-bold uppercase`}
                  >
                    Train <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <Link
                    to="/customize/$planId"
                    params={{ planId: p.id }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-bold uppercase"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    {p.origin.kind === "community" ? "View & edit" : "Edit & share"}
                  </Link>
                  {updateReady && followed?.content && (
                    <button
                      type="button"
                      onClick={() =>
                        applyCommunityUpdate(p.id, {
                          name: followed.name,
                          description: followed.description,
                          base: followed.base,
                          version: followed.version,
                          content: followed.content!,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-paper uppercase"
                    >
                      <Sparkles className="size-3.5" aria-hidden /> Get the update
                    </button>
                  )}
                  {confirmDelete === p.id ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-spicy/10 px-3 py-1.5 text-xs font-bold">
                      Delete this plan?
                      <button
                        type="button"
                        onClick={() => {
                          deleteMyPlan(p.id);
                          setConfirmDelete(null);
                        }}
                        className="rounded-full bg-spicy px-3 py-1 text-paper uppercase"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="uppercase text-muted-foreground"
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => setConfirmDelete(p.id)}
                      className="ml-auto grid size-10 place-items-center rounded-full border border-border text-spicy"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {loadError && <p className="mt-3 text-xs font-semibold text-spicy">{loadError}</p>}

      <section className="mt-8">
        <h2 className="text-xl">Start a new plan</h2>
        <p className="mt-1 text-xs font-semibold text-muted-foreground uppercase">
          Copy one of ours, or build from scratch
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PLANS.map((plan) => {
            const accent = planAccent(plan.id);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => start(plan.id)}
                className={`rounded-2xl ${accent.bg} ${accent.on} p-4 text-left`}
              >
                <span className="eyebrow opacity-80">Copy</span>
                <span className="mt-1 block font-display text-lg leading-tight uppercase">
                  {plan.name}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => start(null)}
            className="rounded-2xl border-2 border-dashed border-border bg-card p-4 text-left"
          >
            <span className="eyebrow inline-flex items-center gap-1 text-muted-foreground">
              <Plus className="size-3" aria-hidden /> Blank
            </span>
            <span className="mt-1 block font-display text-lg leading-tight uppercase">
              From scratch
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}
