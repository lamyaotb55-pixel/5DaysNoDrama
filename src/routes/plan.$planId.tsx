import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Clock,
  Dumbbell,
  Footprints,
  LineChart,
  Lock,
  Pencil,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  PHASES,
  WEEKS,
  WEEKS_PER_PHASE,
  dayInWeek,
  dayOption,
  estimateMinutes,
  getPlan,
  phaseInfo,
  phaseOf,
  weekDays,
  weekGoal,
  type Day,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import {
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

  const openWeek = basePlan ? currentWeek(basePlan, state) : 1;
  const [week, setWeek] = useState(openWeek);
  const shownWeek = Math.min(Math.max(week, 1), WEEKS);

  if (!basePlan) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">Plan not found</h1>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            Choose a plan
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
  const phase1Done = phaseProgress(plan, 1, state.completed, state.walks).done >= WEEKS * 0 + 20;
  const readyToUnlock = phase1Done && !phase2Open;
  const shownLocked = weekLocked(plan, shownWeek, state);
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
              8 weeks.
              <br />
              No drama.
              <br />
              You did that. 🌶️
            </h1>
            <p className="mt-3 text-xs font-bold uppercase opacity-90">
              {plan.name} · program completed
            </p>
          </div>
          <div className="px-6 py-6">
            <dl className="grid grid-cols-2 gap-3">
              <Cell label="Workouts completed" value={String(summary.workouts)} />
              <Cell label="Challenges completed" value={String(summary.challenges)} />
              <Cell label="Consistency" value={`${summary.consistency}%`} />
              <Cell label="Personal records" value={String(summary.prCount)} tone="acid" />
            </dl>

            {summary.improvements.length > 0 && (
              <div className="mt-4 rounded-xl bg-ice p-4">
                <p className="eyebrow text-ink/70">Biggest jumps</p>
                <ul className="mt-1.5 space-y-1 text-xs font-bold text-ink uppercase">
                  {summary.improvements.map((i) => (
                    <li key={i.name}>
                      {i.name} — {i.from} → {i.to} kg
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.topDays.length > 0 && (
              <div className="mt-3 rounded-xl bg-secondary p-4">
                <p className="eyebrow text-muted-foreground">Most trained</p>
                <ul className="mt-1.5 space-y-1 text-xs font-bold uppercase">
                  {summary.topDays.map(([title, n]) => (
                    <li key={title}>
                      {title} — {n}×
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
              See my progress
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
              Do it again
            </button>
            <button
              type="button"
              onClick={() => {
                markProgramSeen(plan.id);
                setWrapUp(false);
              }}
              className="mt-3 w-full text-[11px] font-bold text-muted-foreground uppercase"
            >
              Back to my weeks
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
          ← Home
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/customize/$planId"
            params={{ planId: plan.id }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <Pencil className="size-3.5 text-spicy" aria-hidden /> Plan details
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink uppercase"
          >
            <LineChart className="size-3.5 text-spicy" aria-hidden /> Progress
          </Link>
        </div>
      </div>

      <header className="mt-5">
        <p className={`eyebrow ${accent.text}`}>{plan.label} · 8 week program</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">{plan.name}</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">{plan.slogan}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.goal}</p>
        <p className="mt-4 text-[11px] font-bold uppercase">
          Week {openWeek} of {WEEKS} ·{" "}
          <span className={phaseOf(openWeek) === 2 ? "text-pink" : "text-spicy"}>
            Phase {phaseOf(openWeek)} — {phaseInfo(phaseOf(openWeek)).name}
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
          {overall.pct}% complete · {overall.done}/{overall.total} days · {weeksDone}/{WEEKS} weeks
          done
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
              <p className="eyebrow text-muted-foreground">Phase {p.no}</p>
              <h2 className="mt-1 flex items-center gap-1.5 text-lg leading-tight">
                {isLocked && <Lock className="size-4 text-muted-foreground" aria-hidden />}
                {p.name}
              </h2>
              <p className="mt-0.5 text-[11px] font-bold text-muted-foreground uppercase">
                Weeks {p.firstWeek}–{p.lastWeek} · {pp.done}/{pp.total} days
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{p.purpose}</p>
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
          <Sparkles className="size-4" aria-hidden /> Unlock phase 2
        </button>
      )}

      <nav aria-label="Weeks" className="-mx-5 mt-6 overflow-x-auto px-5">
        <ul className="flex gap-2 pb-1">
          {Array.from({ length: WEEKS }, (_, i) => i + 1).map((w) => {
            const p = weekProgress(plan, w, state.completed, state.walks);
            const full = p.done >= p.total;
            const isActive = w === shownWeek;
            const isLocked = weekLocked(plan, w, state);
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
                        : isLocked
                          ? "border-border bg-secondary text-muted-foreground"
                          : "border-border bg-card text-muted-foreground")
                  }
                >
                  <span className="font-display text-base leading-none">
                    {isLocked ? "🔒" : ""}W{w}
                  </span>
                  <span className="mt-1">
                    {isLocked ? "locked" : full ? "✓ done" : `${p.done}/${p.total}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase">
          Phase 1: W1–W{WEEKS_PER_PHASE} · Phase 2: W{WEEKS_PER_PHASE + 1}–W{WEEKS}
        </p>
      </nav>

      <section className="surface mt-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-muted-foreground">
              Week {shownWeek} of {WEEKS} · Phase {phase.no} — {phase.name}
            </p>
            <p className="mt-1 font-display text-xl uppercase">{goal.title}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{goal.copy}</p>
          </div>
          {!shownLocked && (
            <span className="shrink-0 rounded-full bg-ice px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
              Day 5, your call
            </span>
          )}
        </div>
        {!shownLocked && (
          <p className="mt-3 text-sm font-bold uppercase">
            {wp.trained}/{wp.total} workouts
            {wp.alt > 0 ? ` + ${wp.alt} challenge${wp.alt > 1 ? "s" : ""}` : ""}
            {weekDone
              ? wp.trained >= wp.total
                ? " — 5/5. That's the week ✓"
                : " — still showed up. No drama. ✓"
              : ""}
          </p>
        )}
      </section>

      {shownLocked ? (
        <section className="surface mt-5 p-8 text-center">
          <Lock className="mx-auto size-7 text-muted-foreground" aria-hidden />
          <h2 className="mt-2 text-xl">Phase 2 is still locked</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            Finish weeks 1–{WEEKS_PER_PHASE} and the new workouts open up.
          </p>
          {readyToUnlock && (
            <button
              type="button"
              onClick={() => setUnlockCard(true)}
              className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3.5 text-xs font-bold text-accent-foreground uppercase"
            >
              Unlock phase 2 🌶️
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
                      <h2 className="text-xl leading-tight">{day.title}</h2>
                      <p className="text-sm font-semibold text-muted-foreground">{day.focus}</p>
                      <p className="mt-2 flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="size-3" aria-hidden /> {count} exercises
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" aria-hidden /> ~{estimateMinutes(day)} min
                        </span>
                      </p>
                    </div>
                  </div>
                  {completed ? (
                    <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      <Check className="size-3" aria-hidden /> Complete
                    </span>
                  ) : optionDone && option ? (
                    <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      <Check className="size-3" aria-hidden /> {option.doneLabel}
                    </span>
                  ) : inProgress ? (
                    <span className="rounded-full bg-bubblegum px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                      In progress
                    </span>
                  ) : null}
                </div>

                {showChoice && option ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      What's the plan today?
                    </p>
                    <div className="mt-2.5 flex gap-2.5">
                      <Link
                        to="/workout/$planId/$day"
                        params={{ planId: plan.id, day: String(day.day) }}
                        onClick={() => choosePlan(plan.id)}
                        className="flex-1 rounded-full bg-spicy px-4 py-3.5 text-center text-xs font-bold tracking-wide text-accent-foreground uppercase"
                      >
                        I'll Train
                      </Link>
                      <button
                        type="button"
                        onClick={() => setAltTarget(day)}
                        className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold tracking-wide text-pink uppercase"
                      >
                        {option.button}
                      </button>
                    </div>
                  </div>
                ) : optionChosen && option ? (
                  <div className="mt-4 rounded-2xl bg-bubblegum/35 p-4">
                    <p className="font-display text-lg leading-tight">{option.headline}</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
                      {option.goal}
                    </p>
                    {option.items && (
                      <ul className="mt-3 space-y-1.5">
                        {option.items.map((it) => (
                          <li
                            key={it.name}
                            className="flex items-center justify-between gap-3 text-xs font-semibold"
                          >
                            <span>{it.name}</span>
                            <span className="text-muted-foreground">{it.reps}</span>
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
                          <Check className="size-3.5" aria-hidden /> {option.doneLabel}
                        </>
                      ) : (
                        <>
                          <Footprints className="size-3.5" aria-hidden /> Mark it done
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => chooseTrain(plan.id, day.day)}
                      className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-[11px] font-bold uppercase"
                    >
                      Actually, I'll train
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
                    {completed ? "Repeat Workout" : inProgress ? "Resume Workout" : "Start Workout"}
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
              <h2 className="mt-2 text-3xl leading-[0.95]">Phase 2 unlocked 🌶️</h2>
              <p className="mt-3 text-xs font-bold uppercase opacity-90">
                Same goal.
                <br />
                New energy.
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm font-bold text-muted-foreground uppercase">
                Weeks 5–8 are ready.
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
                Level it up
              </button>
              <button
                type="button"
                onClick={() => setUnlockCard(false)}
                className="mt-3 w-full text-[11px] font-bold text-muted-foreground uppercase"
              >
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {altTarget && altTargetOption && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-ink/50 p-5">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-center">
            <Footprints className="mx-auto size-7 text-pink" aria-hidden />
            <h2 className="mt-2 text-xl">{altTargetOption.headline}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{altTargetOption.goal}</p>
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
                I'll Train
              </Link>
              <button
                type="button"
                onClick={() => {
                  chooseAlt(plan.id, altTarget.day);
                  setAltTarget(null);
                }}
                className="flex-1 rounded-full border-2 border-pink px-4 py-3 text-xs font-bold text-pink uppercase"
              >
                {altTargetOption.button}
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
