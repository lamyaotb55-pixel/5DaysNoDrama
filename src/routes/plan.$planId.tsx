import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import {
  Check,
  Dumbbell,
  Footprints,
  LineChart,
  Lock,
  Pencil,
  Sparkles,
  Trophy,
  CalendarClock,
} from "lucide-react";
import {
  PHASES,
  WEEKS,
  WEEKS_PER_PHASE,
  dayInWeek,
  dayOption,
  getPlan,
  phaseInfo,
  phaseOf,
  weekDays,
  weekGoal,
  type Day,
  isUserPlanId,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import { useT } from "@/lib/i18n";
import { WeekCounter } from "@/components/WeekCounter";
import { useWeights } from "@/lib/units";
import {
  weekArrived,
  planCalendar,
  altAllowed,
  chooseAlt,
  choosePlan,
  chooseTrain,
  completeAlt,
  completedWeeks,
  currentWeek,
  effectiveDay,
  isPhase2Unlocked,
  markProgramSeen,
  phase2Ready,
  phaseProgress,
  planProgress,
  programComplete,
  programSummary,
  restartPlan,
  sessionKey,
  unlockPhase2,
  useStore,
  weekLocked,
  weekProgress,
} from "@/lib/store";

export const Route = createFileRoute("/plan/$planId")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const title = plan
      ? `${plan.name} — 8 Week Program, 2 Phases | 5 Days No Drama`
      : "Plan | 5 Days No Drama";
    const description = plan
      ? `${plan.slogan} ${plan.goal} Eight weeks in two phases: Build The Base, then Level It Up.`
      : "Eight weeks in two phases, five training days a week, every set tracked.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PlanPage,
});

function PlanPage() {
  const { planId } = Route.useParams();
  const state = useStore();
  const basePlan = getPlan(planId);
  const accent = planAccent(planId);
  const [altTarget, setAltTarget] = useState<Day | null>(null);
  const [unlockCard, setUnlockCard] = useState(false);
  const [wrapUp, setWrapUp] = useState(true);
  const hydrated = useHydrated();
  const t = useT();
  const w = useWeights();

  const openWeek = basePlan ? currentWeek(basePlan, state) : 1;
  const [week, setWeek] = useState(openWeek);
  const shownWeek = Math.min(Math.max(week, 1), WEEKS);

  // User plans live on this device; wait for it before saying "not found".
  if (isUserPlanId(planId) && !hydrated) return null;

  if (!basePlan) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">{t("plan.notFound")}</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {t("common.choosePlan")}
          </Link>
        </div>
      </main>
    );
  }

  const plan = basePlan;
  const phase2Open = isPhase2Unlocked(plan.id, state);
  const overall = planProgress(plan, state.completed, state.walks);
  const weeksDone = completedWeeks(plan, state.completed, state.walks);
  const finishedProgram = programComplete(plan, state);
  const readyToUnlock = phase2Ready(plan, state);
  const shownLocked = weekLocked(plan, shownWeek, state);
  const cal = planCalendar(plan.id, state);
  // Each week is 7 days: a future week opens on its first day.
  const notYet = (w: number) => !weekArrived(plan.id, w, state);
  const opensLabel = (w: number) =>
    cal.started
      ? t.date(cal.weekStartsAt(w), { weekday: "short", day: "numeric", month: "short" })
      : null;
  const shownNotYet = !shownLocked && notYet(shownWeek);
  const days = weekDays(plan, shownWeek).map((d) => effectiveDay(plan.id, d, state.customDays));
  const wp = weekProgress(plan, shownWeek, state.completed, state.walks);
  const weekDone = wp.done >= wp.total;
  const goal = weekGoal(shownWeek);
  const phase = phaseInfo(phaseOf(shownWeek));
  const altTargetOption = altTarget ? dayOption(plan.id, altTarget.day) : undefined;
  const summary = programSummary(plan, state);
  const showWrapUp = finishedProgram && wrapUp && !state.programSeen[plan.id];

  if (showWrapUp) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-16">
        <section className="surface mt-8 overflow-hidden">
          <div className="spicy-wash px-6 py-9 text-center">
            <Trophy className="mx-auto size-8" aria-hidden />
            <h1 className="mt-3 text-4xl leading-[0.9]">
              {t("wrap.line1")}
              <br />
              {t("wrap.line2")}
              <br />
              {t("wrap.line3")}
            </h1>
            <p className="mt-3 text-xs font-bold uppercase opacity-90">
              {t("wrap.completed", { plan: t.c(plan.name) })}
            </p>
          </div>
          <div className="px-6 py-6">
            <dl className="grid grid-cols-2 gap-3">
              <Cell label={t("wrap.workouts")} value={String(summary.workouts)} />
              <Cell label={t("wrap.challenges")} value={String(summary.challenges)} />
              <Cell label={t("wrap.consistency")} value={`${summary.consistency}%`} />
              <Cell label={t("wrap.prs")} value={String(summary.prCount)} tone="acid" />
            </dl>

            {summary.improvements.length > 0 && (
              <div className="mt-4 rounded-xl bg-ice p-4">
                <p className="eyebrow text-ink/70">{t("wrap.biggestJumps")}</p>
                <ul className="mt-1.5 space-y-1 text-xs font-bold text-ink uppercase">
                  {summary.improvements.map((i) => (
                    <li key={i.name}>
                      {t.c(i.name)} —{" "}
                      <bdi>
                        {w.show(i.from)} → {w.show(i.to)}
                      </bdi>{" "}
                      {w.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.topDays.length > 0 && (
              <div className="mt-3 rounded-xl bg-secondary p-4">
                <p className="eyebrow text-muted-foreground">{t("wrap.mostTrained")}</p>
                <ul className="mt-1.5 space-y-1 text-xs font-bold uppercase">
                  {summary.topDays.map(([title, n]) => (
                    <li key={title}>
                      {t.c(title)} — {n}×
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              to="/progress"
              onClick={() => markProgramSeen(plan.id)}
              className="spicy-wash mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-xs font-bold uppercase shadow-[var(--shadow-lift)]"
            >
              {t("common.seeProgress")}
            </Link>
            <button
              type="button"
              onClick={() => {
                markProgramSeen(plan.id);
                restartPlan(plan.id);
                setWeek(1);
                setWrapUp(false);
              }}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full border-2 border-pink px-6 py-3.5 text-xs font-bold text-pink uppercase"
            >
              {t("wrap.again")}
            </button>
            <button
              type="button"
              onClick={() => {
                markProgramSeen(plan.id);
                setWrapUp(false);
              }}
              className="mt-3 w-full text-[11px] font-bold text-muted-foreground uppercase"
            >
              {t("wrap.back")}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-8">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="rtl:hidden">←</span>
          <span className="ltr:hidden">→</span> {t("common.home")}
        </Link>
        <div className="flex items-center gap-3 pe-40">
          <Link
            to="/customize/$planId"
            params={{ planId: plan.id }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <Pencil className="size-3.5 text-spicy" aria-hidden />{" "}
            {plan.custom ? t("common.editPlan") : t("common.planDetails")}
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <LineChart className="size-3.5 text-spicy" aria-hidden /> {t("menu.progress")}
          </Link>
        </div>
      </div>

      <header className="mt-5">
        <p className={`eyebrow ${accent.text}`}>
          {t.c(plan.label)} · {t("plan.eightWeekProgram")}
        </p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] break-words sm:text-5xl">{t.c(plan.name)}</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">{t.c(plan.slogan)}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t.c(plan.goal)}</p>
        <div className="mt-4 rounded-xl bg-secondary px-4 py-3">
          <WeekCounter plan={plan} state={state} />
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase">
          <span className={phaseOf(openWeek) === 2 ? "text-pink" : "text-spicy"}>
            {t("common.phaseN", { n: phaseOf(openWeek) })} —{" "}
            {t.c(phaseInfo(phaseOf(openWeek)).name)}
          </span>
        </p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (overall.pct >= 100 ? "bg-success" : "bg-spicy")
            }
            style={{ width: `${overall.pct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase">
          {t("plan.overall", {
            pct: overall.pct,
            done: overall.done,
            total: overall.total,
            weeks: weeksDone,
            allWeeks: WEEKS,
          })}
        </p>
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        {PHASES.map((p) => {
          const pp = phaseProgress(plan, p.no, state.completed, state.walks);
          const isLocked = p.no === 2 && !phase2Open;
          const isCurrent = p.no === phaseOf(openWeek) && !isLocked;
          return (
            <article
              key={p.no}
              className={
                "rounded-2xl border p-4 " +
                (isCurrent
                  ? "border-spicy bg-card"
                  : isLocked
                    ? "border-border bg-secondary"
                    : "border-border bg-card")
              }
            >
              <p className="eyebrow text-muted-foreground">{t("common.phaseN", { n: p.no })}</p>
              <h2 className="mt-1 flex items-center gap-1.5 text-lg leading-tight">
                {isLocked && <Lock className="size-4 text-muted-foreground" aria-hidden />}
                {t.c(p.name)}
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-muted-foreground uppercase">
                {t("plan.phaseWeeks", {
                  from: p.firstWeek,
                  to: p.lastWeek,
                  done: pp.done,
                  total: pp.total,
                })}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{t.c(p.purpose)}</p>
            </article>
          );
        })}
      </section>

      {readyToUnlock && (
        <button
          type="button"
          onClick={() => setUnlockCard(true)}
          className="spicy-wash mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-xs font-bold uppercase shadow-[var(--shadow-lift)]"
        >
          <Sparkles className="size-4" aria-hidden /> {t("home.unlockPhase2")}
        </button>
      )}

      <nav aria-label={t("plan.weeks")} className="-mx-5 mt-6 overflow-x-auto px-5">
        <ul className="flex gap-2 pb-1">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => {
            const p = weekProgress(plan, w, state.completed, state.walks);
            const full = p.done >= p.total;
            const isActive = w === shownWeek;
            const isLocked = weekLocked(plan, w, state);
            const waiting = !isLocked && notYet(w);
            return (
              <li key={w}>
                <button
                  type="button"
                  onClick={() => (isLocked && readyToUnlock ? setUnlockCard(true) : setWeek(w))}
                  aria-current={isActive ? "true" : undefined}
                  className={
                    "inline-flex min-w-[74px] flex-col items-center rounded-2xl border px-3 py-2 text-[10px] font-bold uppercase " +
                    (isActive
                      ? "border-transparent bg-spicy text-accent-foreground"
                      : full
                        ? "border-transparent bg-success text-ink"
                        : isLocked || waiting
                          ? "border-border bg-secondary text-muted-foreground"
                          : "border-border bg-card text-muted-foreground")
                  }
                >
                  <span className="font-display text-base leading-none">
                    {isLocked ? "🔒" : waiting ? "⏳" : ""}
                    {t("ex.weekShort", { n: w })}
                  </span>
                  <span className="mt-1">
                    {isLocked
                      ? t("plan.locked")
                      : waiting
                        ? (opensLabel(w) ?? t("plan.locked"))
                        : full
                          ? t("plan.weekDone")
                          : `${p.done}/${p.total}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">
          {t("plan.phaseLegend", {
            a: WEEKS_PER_PHASE,
            b: WEEKS_PER_PHASE + 1,
            c: WEEKS,
          })}
        </p>
      </nav>

      <section className="surface mt-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">
              {t("home.weekOf", { week: shownWeek, total: WEEKS })} ·{" "}
              {t("common.phaseN", { n: phase.no })} — {t.c(phase.name)}
            </p>
            <p className="mt-1 font-display text-xl uppercase">{t.c(goal.title)}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.c(goal.copy)}</p>
          </div>
          {!shownLocked && (
            <span className="shrink-0 rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
              {t("home.day5Call")}
            </span>
          )}
        </div>
        {!shownLocked && (
          <p className="mt-3 text-sm font-bold uppercase">
            {t("plan.workoutsCount", { done: wp.trained, total: wp.total })}
            {wp.alt > 0 ? ` + ${t.plural("plan.challenges", wp.alt)}` : ""}
            {weekDone
              ? wp.trained >= wp.total
                ? ` — ${t("plan.fullWeek")}`
                : ` — ${t("plan.showedUp")}`
              : ""}
          </p>
        )}
      </section>

      {shownNotYet ? (
        <section className="surface mt-5 p-8 text-center">
          <CalendarClock className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <h2 className="mt-2 text-xl">
            {cal.started
              ? t("cal.weekOpensTitle", {
                  week: shownWeek,
                  date: t.date(cal.weekStartsAt(shownWeek), {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  }),
                })
              : t("cal.afterFirst")}
          </h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {t("cal.weekOpensBody")}
          </p>
        </section>
      ) : shownLocked ? (
        <section className="surface mt-5 p-8 text-center">
          <Lock className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <h2 className="mt-2 text-xl">{t("plan.phase2Locked")}</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {t("plan.finishWeeks", { n: WEEKS_PER_PHASE })}
          </p>
          {readyToUnlock && (
            <button
              type="button"
              onClick={() => setUnlockCard(true)}
              className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3.5 text-xs font-bold text-accent-foreground uppercase"
            >
              {t("home.unlockPhase2")} 🌶️
            </button>
          )}
        </section>
      ) : (
        <div className="mt-5 space-y-3">
          {days.map((day) => {
            const key = sessionKey(plan.id, day.day);
            const completed = Boolean(state.completed[key]);
            const inProgress = Boolean(state.active[key]);
            const option = dayOption(plan.id, day.day);
            const optionChosen = Boolean(state.skips[key]) && Boolean(option);
            const optionDone = Boolean(state.walks[key]) && Boolean(option);
            const count = day.exercises.length + (day.circuit ? 1 : 0);
            const showChoice =
              Boolean(option) && altAllowed(day.day) && !completed && !optionChosen;
            return (
              <article key={day.day} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`day-number ${completed || optionDone ? "text-success" : optionChosen ? "text-pink" : accent.text}`}
                    >
                      {String(dayInWeek(day.day)).padStart(2, "0")}
                    </span>
                    <div className="pt-1">
                      <h2 className="text-xl leading-tight">{t.c(day.title)}</h2>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {t.c(day.focus)}
                      </p>
                      <p className="mt-2 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="size-3" aria-hidden />{" "}
                          {t.plural("common.exercises", count)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {completed ? (
                    <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      <Check className="size-3" aria-hidden /> {t("plan.complete")}
                    </span>
                  ) : optionDone && option ? (
                    <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      <Check className="size-3" aria-hidden /> {t.c(option.doneLabel)}
                    </span>
                  ) : inProgress ? (
                    <span className="rounded-full bg-bubblegum px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      {t("plan.inProgress")}
                    </span>
                  ) : null}
                </div>

                {showChoice && option ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      {t("plan.whatsThePlan")}
                    </p>
                    <div className="mt-2.5 flex gap-2.5">
                      <Link
                        to="/workout/$planId/$day"
                        params={{ planId: plan.id, day: String(day.day) }}
                        onClick={() => choosePlan(plan.id)}
                        className="flex-1 rounded-full bg-spicy px-4 py-3.5 text-center text-xs font-bold tracking-wide text-accent-foreground uppercase"
                      >
                        {t("plan.illTrain")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setAltTarget(day)}
                        className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold tracking-wide text-pink uppercase"
                      >
                        {t.c(option.button)}
                      </button>
                    </div>
                  </div>
                ) : optionChosen && option ? (
                  <div className="mt-4 rounded-2xl bg-bubblegum/35 p-4">
                    <p className="font-display text-lg leading-tight">{t.c(option.headline)}</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
                      {t.c(option.goal)}
                    </p>
                    {option.items && (
                      <ul className="mt-3 space-y-1.5">
                        {option.items.map((it) => (
                          <li
                            key={it.name}
                            className="flex items-center justify-between gap-3 text-xs font-semibold"
                          >
                            <span>{t.c(it.name)}</span>
                            <span className="text-muted-foreground">{t.c(it.reps)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => completeAlt(plan.id, day.day, !optionDone)}
                      className={
                        "mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-3.5 text-xs font-bold uppercase " +
                        (optionDone ? "bg-success text-ink" : "bg-spicy text-accent-foreground")
                      }
                    >
                      {optionDone ? (
                        <>
                          <Check className="size-3.5" aria-hidden /> {t.c(option.doneLabel)}
                        </>
                      ) : (
                        <>
                          <Footprints className="size-3.5" aria-hidden /> {t("plan.markDone")}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseTrain(plan.id, day.day)}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-[11px] font-bold uppercase"
                    >
                      {t("plan.actuallyTrain")}
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/workout/$planId/$day"
                    params={{ planId: plan.id, day: String(day.day) }}
                    onClick={() => choosePlan(plan.id)}
                    className={
                      "mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-xs font-bold tracking-wide uppercase " +
                      (completed ? "bg-secondary text-ink" : "bg-spicy text-accent-foreground")
                    }
                  >
                    {completed
                      ? t("plan.repeatWorkout")
                      : inProgress
                        ? t("plan.resumeWorkout")
                        : t("common.viewWorkout")}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}

      {unlockCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-30 grid place-items-center bg-ink/60 p-5"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card text-center">
            <div className="spicy-wash px-6 py-8">
              <Sparkles className="mx-auto size-7" aria-hidden />
              <h2 className="mt-2 text-3xl leading-[0.95]">{t("plan.phase2Unlocked")}</h2>
              <p className="mt-3 text-xs font-bold uppercase opacity-90">
                {t("plan.sameGoal")}
                <br />
                {t("plan.newEnergy")}
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm font-bold text-muted-foreground uppercase">
                {t("plan.weeks58Ready")}
              </p>
              <button
                type="button"
                onClick={() => {
                  unlockPhase2(plan.id);
                  setWeek(WEEKS_PER_PHASE + 1);
                  setUnlockCard(false);
                }}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-spicy px-5 py-4 text-xs font-bold text-accent-foreground uppercase"
              >
                {t("plan.levelItUp")}
              </button>
              <button
                type="button"
                onClick={() => setUnlockCard(false)}
                className="mt-3 w-full text-[11px] font-bold text-muted-foreground uppercase"
              >
                {t("plan.notYet")}
              </button>
            </div>
          </div>
        </div>
      )}

      {altTarget && altTargetOption && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            <Footprints className="mx-auto size-7 text-pink" aria-hidden />
            <h2 className="mt-2 text-xl">{t.c(altTargetOption.headline)}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.c(altTargetOption.goal)}</p>
            <div className="mt-5 flex gap-3">
              <Link
                to="/workout/$planId/$day"
                params={{ planId: plan.id, day: String(altTarget.day) }}
                onClick={() => {
                  choosePlan(plan.id);
                  setAltTarget(null);
                }}
                className="flex-1 rounded-full bg-spicy px-4 py-3 text-xs font-bold text-accent-foreground uppercase"
              >
                {t("plan.illTrain")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  chooseAlt(plan.id, altTarget.day);
                  setAltTarget(null);
                }}
                className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold text-pink uppercase"
              >
                {t.c(altTargetOption.button)}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Cell({
  label,
  value,
  tone = "ice",
}: {
  label: string;
  value: string;
  tone?: "ice" | "acid";
}) {
  return (
    <div className={"rounded-xl p-4 " + (tone === "acid" ? "bg-acid" : "bg-ice")}>
      <dt className="eyebrow text-ink/70">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-ink">{value}</dd>
    </div>
  );
}
