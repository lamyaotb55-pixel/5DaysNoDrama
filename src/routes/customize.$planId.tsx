import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { MediaBox } from "@/components/MediaBox";
import { ExerciseName } from "@/components/ExerciseName";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useHydrated } from "@/hooks/useHydrated";
import {
  errorText,
  getCommunityPlans,
  goalName,
  myLatestSubmissions,
  shareStatus,
  submitPlan,
  unpublishPlan,
  type PublicPlan,
  type Submission,
} from "@/lib/community";
import {
  BUILTIN_IDS,
  PLANS,
  PHASES,
  WEEKS_PER_PHASE,
  absDay,
  dayInWeek,
  getPlan,
  isUserPlanId,
  phaseDays,
  type BuiltinPlanId,
  type Exercise,
  type PhaseNo,
} from "@/lib/program";
import {
  createMyPlan,
  effectiveDay,
  linkCommunityPlan,
  updateMyPlan,
  updateMyPlanDay,
  type MyPlan,
  resetDayExercises,
  saveDayExercises,
  templateKey,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/customize/$planId")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const title = plan
      ? `${plan.name} Plan Details — Edit Workouts | 5 Days No Drama`
      : "Plan Details | 5 Days No Drama";
    const description = plan
      ? `Edit the five days of ${plan.name}: rename workouts, change sets and reps, add a demo image or remove exercises.`
      : "Edit your plan: rename workouts, change sets and reps, add demo media or remove exercises.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CustomizePage,
});

type Draft = Exercise & { index: number };

function CustomizePage() {
  const { planId } = Route.useParams();
  const basePlan = getPlan(planId);
  const state = useStore();
  const [draft, setDraft] = useState<{ day: number; ex: Draft } | null>(null);
  const [pending, setPending] = useState<{ day: number; index: number; name: string } | null>(null);
  const [undo, setUndo] = useState<{ day: number; name: string; list: Exercise[] } | null>(null);
  const [phase, setPhase] = useState<PhaseNo>(1);
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const t = useT();
  const mine = state.myPlans?.[planId];

  if (isUserPlanId(planId) && !hydrated) return null;

  if (!basePlan) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl font-semibold">{t("plan.notFound")}</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold uppercase text-accent-foreground"
          >
            {t("common.choosePlan")}
          </Link>
        </div>
      </main>
    );
  }

  const week = phase === 1 ? 1 : WEEKS_PER_PHASE + 1;
  const days = phaseDays(basePlan, phase)
    .map((d) => ({ ...d, day: absDay(week, d.day) }))
    .map((d) => effectiveDay(basePlan.id, d, state.customDays));

  const commit = (dayNo: number, list: Exercise[]) => saveDayExercises(basePlan.id, dayNo, list);
  const move = (dayNo: number, list: Exercise[], from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    commit(dayNo, next);
  };

  const confirmRemove = () => {
    if (!pending) return;
    const day = days.find((d) => d.day === pending.day)!;
    const before = day.exercises;
    commit(
      pending.day,
      before.filter((_, i) => i !== pending.index),
    );
    setUndo({ day: pending.day, name: pending.name, list: before });
    setPending(null);
  };

  const saveDraft = () => {
    if (!draft) return;
    const day = days.find((d) => d.day === draft.day)!;
    const { index, ...ex } = draft.ex;
    const list = [...day.exercises];
    if (index >= list.length) list.push(ex);
    else list[index] = ex;
    commit(draft.day, list);
    setDraft(null);
  };

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-8">
        <Link to="/" className="text-xs font-semibold text-muted-foreground">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("common.home")}
        </Link>
      </div>

      <header className="mt-3">
        <p className="eyebrow text-spicy">
          {mine ? t("edit.eyebrowMine") : t("common.planDetails")}
        </p>
        <h1 className="mt-1 text-3xl font-semibold uppercase break-words sm:text-4xl">
          {mine ? basePlan.name : t.c(basePlan.name)}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mine ? t("edit.ledeMine") : t("edit.ledeBuiltin")}
        </p>
      </header>

      {mine ? (
        <>
          <PlanSettings plan={mine} />
          {mine.origin.kind === "community" ? (
            <p className="mt-4 rounded-2xl bg-secondary p-4 text-xs font-semibold">
              {t("edit.followNote", { author: mine.origin.author })}
            </p>
          ) : (
            <SharePanel plan={mine} />
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            const id = createMyPlan(basePlan.id);
            navigate({ to: "/customize/$planId", params: { planId: id } });
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-4 text-start"
        >
          <Copy className="size-5 shrink-0 text-spicy" aria-hidden />
          <span>
            <span className="block text-sm font-bold uppercase">{t("edit.makeItMine")}</span>
            <span className="block text-xs text-muted-foreground">{t("edit.makeItMineBody")}</span>
          </span>
        </button>
      )}

      <div className="mt-5 flex gap-2" role="tablist" aria-label={t("plan.phases")}>
        {PHASES.map((ph) => (
          <button
            key={ph.no}
            type="button"
            role="tab"
            aria-selected={phase === ph.no}
            onClick={() => setPhase(ph.no)}
            className={
              "flex-1 rounded-full px-3 py-2.5 text-[11px] font-bold uppercase " +
              (phase === ph.no
                ? "bg-spicy text-accent-foreground"
                : "border border-border bg-card text-muted-foreground")
            }
          >
            {t("common.phaseN", { n: ph.no })} · {t.c(ph.name)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">
        {t("edit.phaseNote", { n: phase, weeks: phase === 1 ? "1–4" : "5–8" })}
      </p>

      <div className="mt-6 space-y-4">
        {days.map((day) => {
          const edited = Boolean(state.customDays[templateKey(basePlan.id, day.day)]);
          return (
            <section key={day.day} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                {mine ? (
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="eyebrow text-muted-foreground">
                      {t("common.dayN", { n: dayInWeek(day.day) })}
                    </p>
                    <input
                      id={`title-${day.day}`}
                      aria-label={t("edit.dayName", { n: dayInWeek(day.day) })}
                      value={day.title}
                      maxLength={40}
                      onChange={(e) => updateMyPlanDay(mine.id, day.day, { title: e.target.value })}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 font-display text-lg uppercase outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      id={`focus-${day.day}`}
                      aria-label={t("edit.dayFocus", { n: dayInWeek(day.day) })}
                      value={day.focus}
                      maxLength={60}
                      placeholder={t("edit.focusPlaceholder")}
                      onChange={(e) => updateMyPlanDay(mine.id, day.day, { focus: e.target.value })}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="eyebrow text-muted-foreground">
                      {t("common.dayN", { n: dayInWeek(day.day) })}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold uppercase">{t.c(day.title)}</h2>
                    <p className="text-sm text-muted-foreground">{t.c(day.focus)}</p>
                  </div>
                )}
                {edited && !mine && (
                  <button
                    type="button"
                    onClick={() => resetDayExercises(basePlan.id, day.day)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
                  >
                    <RotateCcw className="size-3" aria-hidden /> {t("edit.resetDay")}
                  </button>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {day.exercises.map((ex, i) => (
                  <li
                    key={`${ex.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                  >
                    <div className="w-12 shrink-0">
                      <MediaBox name={ex.name} compact src={ex.media} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        <ExerciseName name={ex.name} />
                      </p>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        <bdi>
                          {ex.sets} × {ex.reps}
                        </bdi>
                        {ex.perSide ? ` ${t("ex.perSide")}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label={t("edit.moveUp", { name: t.c(ex.name) })}
                        disabled={i === 0}
                        onClick={() => move(day.day, day.exercises, i, i - 1)}
                        className="grid size-6 place-items-center text-muted-foreground disabled:opacity-25"
                      >
                        <ArrowUp className="size-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label={t("edit.moveDown", { name: t.c(ex.name) })}
                        disabled={i === day.exercises.length - 1}
                        onClick={() => move(day.day, day.exercises, i, i + 1)}
                        className="grid size-6 place-items-center text-muted-foreground disabled:opacity-25"
                      >
                        <ArrowDown className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={t("edit.editEx", { name: t.c(ex.name) })}
                      onClick={() => setDraft({ day: day.day, ex: { ...ex, index: i } })}
                      className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={t("edit.removeEx", { name: t.c(ex.name) })}
                      onClick={() => setPending({ day: day.day, index: i, name: ex.name })}
                      className="grid size-9 place-items-center rounded-full border border-border text-spicy"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  setDraft({
                    day: day.day,
                    ex: { name: "", sets: 3, reps: "10–12", index: day.exercises.length },
                  })
                }
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"
              >
                <Plus className="size-3.5 text-spicy" aria-hidden /> {t("edit.addExercise")}
              </button>
            </section>
          );
        })}
      </div>

      {draft && (
        <div className="fixed inset-0 z-20 grid place-items-end bg-ink/50 p-0 sm:place-items-center sm:p-5">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
            <h2 className="text-lg font-semibold">
              {draft.ex.name ? t("edit.editExercise") : t("edit.newExercise")}
            </h2>
            <div className="mt-4 space-y-3">
              <Field label={t("edit.workoutName")}>
                <input
                  value={draft.ex.name}
                  onChange={(e) =>
                    setDraft({ ...draft, ex: { ...draft.ex, name: e.target.value } })
                  }
                  placeholder="Hip Thrust"
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("edit.sets")}>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={draft.ex.sets}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ex: { ...draft.ex, sets: Math.max(1, Number(e.target.value) || 1) },
                      })
                    }
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
                <Field label={t("common.reps")}>
                  <input
                    value={draft.ex.reps}
                    onChange={(e) =>
                      setDraft({ ...draft, ex: { ...draft.ex, reps: e.target.value } })
                    }
                    placeholder="8–10"
                    className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </Field>
              </div>
              <Field label={t("edit.demoLink")}>
                <input
                  value={draft.ex.media ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, ex: { ...draft.ex, media: e.target.value || undefined } })
                  }
                  placeholder="https://…"
                  className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </Field>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.ex.perSide ?? false}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ex: { ...draft.ex, perSide: e.target.checked || undefined },
                    })
                  }
                  className="size-4 accent-[var(--spicy)]"
                />
                {t("edit.perSideCheck")}
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={!draft.ex.name.trim()}
                onClick={saveDraft}
                className="flex-1 rounded-full bg-ink px-4 py-3 text-xs font-bold uppercase text-paper disabled:opacity-40"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            <h2 className="text-lg font-semibold">{t("edit.removeQ")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("edit.removeBody", { name: t.c(pending.name), n: dayInWeek(pending.day) })}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold"
              >
                {t("edit.keepIt")}
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                className="flex-1 rounded-full bg-spicy px-4 py-3 text-sm font-semibold text-accent-foreground"
              >
                {t("edit.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {undo && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-5">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-full border border-border bg-card px-4 py-3 shadow-[var(--shadow-lift)]">
            <p className="min-w-0 flex-1 truncate text-xs font-semibold">
              {t("edit.removed", { name: t.c(undo.name) })}
            </p>
            <button
              type="button"
              onClick={() => {
                commit(undo.day, undo.list);
                setUndo(null);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold uppercase text-paper"
            >
              <Undo2 className="size-3.5" aria-hidden /> {t("edit.undo")}
            </button>
            <button
              type="button"
              aria-label={t("edit.dismiss")}
              onClick={() => setUndo(null)}
              className="text-xs font-semibold text-muted-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const DEFAULT_NAMES = new Set(["my new plan", ...PLANS.map((p) => p.name.toLowerCase())]);

/** Publishing unlocks once the plan has a name of its own. */
function hasOwnName(plan: MyPlan) {
  const name = plan.name.trim().toLowerCase();
  return (
    name.length >= 3 &&
    !DEFAULT_NAMES.has(name) &&
    !PLANS.some((p) => name === `my ${p.name.toLowerCase()}`)
  );
}

function PlanSettings({ plan }: { plan: MyPlan }) {
  const t = useT();
  return (
    <section className="surface mt-5 space-y-3 p-5">
      <Field label={t("edit.planName")}>
        <input
          id="plan-name"
          value={plan.name}
          maxLength={60}
          onChange={(e) => updateMyPlan(plan.id, { name: e.target.value })}
          className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <Field label={t("edit.description")}>
        <textarea
          id="plan-description"
          rows={3}
          maxLength={500}
          value={plan.description}
          placeholder={t("edit.descriptionPlaceholder")}
          onChange={(e) => updateMyPlan(plan.id, { description: e.target.value })}
          className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </Field>
      <Field label={t("edit.goal")}>
        <select
          id="plan-goal"
          value={plan.base}
          onChange={(e) => updateMyPlan(plan.id, { base: e.target.value as BuiltinPlanId })}
          className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
        >
          {BUILTIN_IDS.map((id) => (
            <option key={id} value={id}>
              {t.c(goalName(id))}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          id="plan-day5"
          type="checkbox"
          checked={plan.day5Alt}
          onChange={(e) => updateMyPlan(plan.id, { day5Alt: e.target.checked })}
          className="mt-0.5 size-4 accent-[var(--spicy)]"
        />
        <span>
          <span className="block font-semibold">{t("edit.day5Offer")}</span>
          <span className="block text-xs text-muted-foreground">
            {t("edit.day5Body", {
              option: t.c(plan.base === "build-muscle" ? "I'll Mini" : "I'll Walk"),
            })}
          </span>
        </span>
      </label>
    </section>
  );
}

function SharePanel({ plan }: { plan: MyPlan }) {
  const { user, loading } = useAuth();
  const t = useT();
  const [live, setLive] = useState<PublicPlan | undefined>();
  const [sub, setSub] = useState<Submission | undefined>();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!plan.communityId || !user) return;
    let alive = true;
    Promise.all([getCommunityPlans([plan.communityId]), myLatestSubmissions([plan.communityId])])
      .then(([plans, subs]) => {
        if (!alive) return;
        setLive(plans[0]);
        setSub(subs[plan.communityId!]);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [plan.communityId, user, tick]);

  const status = shareStatus(plan, live, sub);
  const named = hasOwnName(plan);
  const exerciseCount = [...plan.days, ...plan.phase2].reduce((n, d) => n + d.exercises.length, 0);
  const ready = named && exerciseCount > 0;
  const isLive = live?.status === "approved";
  const canUnpublish = Boolean(plan.communityId) && (isLive || sub?.status === "pending");

  const send = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const id = await submitPlan(plan);
      if (!plan.communityId) linkCommunityPlan(plan.id, id);
      setConfirming(false);
      setMessage(t("share.sent"));
      setTick((t) => t + 1);
    } catch (e) {
      setMessage(t.c(errorText(e)));
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!plan.communityId) return;
    setBusy(true);
    setMessage(null);
    try {
      await unpublishPlan(plan.communityId);
      setMessage(t("share.unpublished"));
      setTick((t) => t + 1);
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5">
      <p className="eyebrow inline-flex items-center gap-1.5 text-pink">
        <Send className="size-3" aria-hidden /> {t("menu.plansByYou")}
      </p>

      {status && (
        <p className="mt-2 text-sm font-bold">
          {t("share.status")} <span className="uppercase">{t.c(status.label)}</span>
        </p>
      )}
      {status?.note && (
        <p className="mt-2 rounded-lg bg-secondary p-2.5 text-xs">
          <b>{t("share.reviewNote")}</b> {status.note}
        </p>
      )}

      {!loading && !user ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">{t("share.signInToShare")}</p>
          <Link
            to="/auth"
            className="mt-3 inline-flex rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-paper uppercase"
          >
            {t("common.signIn")}
          </Link>
        </>
      ) : !ready ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {!named ? t("share.needName") : t("share.needExercise")}
        </p>
      ) : confirming ? (
        <div className="mt-2">
          <p className="text-sm">
            {plan.communityId ? t("share.confirmUpdate") : t("share.confirmNew")}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-full border border-border px-4 py-2.5 text-xs font-bold uppercase"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={send}
              className="flex-1 rounded-full bg-spicy px-4 py-2.5 text-xs font-bold text-accent-foreground uppercase disabled:opacity-50"
            >
              {busy ? t("share.sending") : t("share.sendForReview")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            {plan.communityId ? t("share.madeChanges") : t("share.shareIntro")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-spicy px-4 py-2.5 text-xs font-bold text-accent-foreground uppercase"
            >
              <Send className="size-3.5" aria-hidden />
              {plan.communityId ? t("share.sendUpdate") : t("share.publish")}
            </button>
            {canUnpublish && (
              <button
                type="button"
                disabled={busy}
                onClick={unpublish}
                className="rounded-full border border-border px-4 py-2.5 text-xs font-bold uppercase disabled:opacity-50"
              >
                {t("share.unpublish")}
              </button>
            )}
          </div>
        </>
      )}
      {message && (
        <p role="status" className="mt-3 text-xs font-semibold">
          {message}
        </p>
      )}
    </section>
  );
}
