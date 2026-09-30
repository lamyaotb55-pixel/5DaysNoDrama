import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { PrCelebration } from "@/components/PrCelebration";
import { WeightChart } from "@/components/WeightChart";
import { ExerciseName } from "@/components/ExerciseName";
import { prText, useT } from "@/lib/i18n";
import { PHASES, WEEKS, dayInWeek, getPlan, phaseInfo, phaseOf, weekOf } from "@/lib/program";
import {
  currentWeek,
  isPhase2Unlocked,
  programProgress,
  programSummary,
  totalVolume,
  useStore,
  weeklyConsistency,
  weeklyHighlights,
} from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "My Progress — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Workouts completed, weekly consistency, weight progression per exercise, personal records, training volume and full workout history.",
      },
      { property: "og:title", content: "My Progress — 5 Days No Drama" },
      {
        property: "og:description",
        content: "Consistency, personal records, volume and weight progression in one clean view.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const state = useStore();
  const t = useT();
  const plan = getPlan(state.activePlanId ?? undefined);
  const consistency = weeklyConsistency(state.history);
  const volume = totalVolume(state.history);
  const week = weeklyHighlights(state.history);
  const prs = Object.entries(state.prs).sort((a, b) => b[1].weight - a[1].weight);
  const pp = plan ? programProgress(plan, state) : null;
  const weekComplete = week.workouts >= 5;

  // PRs set during the most recent finished workout get the celebration treatment.
  const lastAt = state.history.length ? Math.max(...state.history.map((h) => h.at)) : 0;
  const freshPrs = prs.filter(([, pr]) => lastAt > 0 && pr.at >= lastAt - 2000);
  const freshNames = freshPrs.map(([name]) => name);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!freshNames.length) return;
    const sig = `pr-cheered:${lastAt}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(sig)) return;
    sessionStorage.setItem(sig, "1");
    setCelebrate(true);
  }, [lastAt, freshNames.length]);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      {celebrate && (
        <PrCelebration
          prs={freshPrs.map(
            ([name, pr]) => `${t.c(name)} · ${pr.weight} ${t("unit.kg")} × ${pr.reps}`,
          )}
          onDone={() => setCelebrate(false)}
        />
      )}
      <div className="flex items-center justify-between pt-8 pe-40">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("common.home")}
        </Link>
        <Link
          to="/theme"
          className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold uppercase"
        >
          {t("prog.palette")}
        </Link>
      </div>

      <header className="mt-4">
        <p className="eyebrow text-spicy">{t("menu.progress")}</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">{t("prog.title")}</h1>
        <p className="mt-2 text-sm font-bold text-muted-foreground uppercase">
          {plan ? (
            <>
              {t("prog.currentPlan")}{" "}
              <Link
                to="/plan/$planId"
                params={{ planId: plan.id }}
                className="text-ink underline decoration-spicy decoration-2 underline-offset-4"
              >
                {t.c(plan.name)}
              </Link>
            </>
          ) : (
            t("prog.noPlan")
          )}
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Stat label={t("prog.workoutsDone")} value={String(state.history.length)} />
        <Stat
          label={t("home.thisWeek")}
          value={`${consistency.thisWeek}/5 · ${consistency.pct}%`}
        />
        <Stat label={t("prog.totalVolume")} value={`${t.num(volume)} ${t("unit.kg")}`} />
        <Stat label={t("wrap.prs")} value={String(prs.length)} accent="acid" />
      </section>

      {plan && pp && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow text-pink">{t("plan.eightWeekProgram")}</p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="font-display text-2xl uppercase">
              {t("home.weekOf", { week: currentWeek(plan, state), total: WEEKS })}
            </p>
            <p className="text-xs font-bold text-muted-foreground uppercase">
              {t("prog.pctDays", { pct: pp.pct, done: pp.done, total: pp.total })}
            </p>
          </div>
          {/* Bar is filled by finished work only — phase 1 in red, phase 2 in pink. */}
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-spicy transition-[width] duration-500"
              style={{ width: `${pp.phase1Share}%` }}
            />
            <div
              className="h-full bg-pink transition-[width] duration-500"
              style={{ width: `${pp.phase2Share}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-muted-foreground uppercase">
            {t("prog.weeksComplete", { done: pp.weeksDone, total: pp.weeksTotal })} ·{" "}
            {t.plural("hist.workouts", pp.trained)}
            {pp.alt > 0 ? ` · ${t.plural("plan.challenges", pp.alt)}` : ""}
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {PHASES.map((ph) => {
              const phase = ph.no === 1 ? pp.phase1 : pp.phase2;
              const locked = ph.no === 2 && !isPhase2Unlocked(plan.id, state);
              return (
                <div key={ph.no} className="rounded-xl bg-secondary p-3.5">
                  <p className="eyebrow text-muted-foreground">
                    {t("common.phaseN", { n: ph.no })} ·{" "}
                    {t("prog.weekRange", { from: ph.firstWeek, to: ph.lastWeek })}
                  </p>
                  <p className="mt-0.5 text-sm font-bold uppercase">
                    {locked ? "🔒 " : ""}
                    {t.c(ph.name)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold text-muted-foreground uppercase">
                    {phase.pct}% · {t.plural("hist.workouts", phase.trained)} ·{" "}
                    {t("hist.trackDays", { done: phase.done, total: phase.total })}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] font-bold text-muted-foreground uppercase">
            {t("prog.nowInPhase", { n: phaseOf(currentWeek(plan, state)) })} —{" "}
            {t.c(phaseInfo(phaseOf(currentWeek(plan, state))).name)} ·{" "}
            {t.plural("prog.challengesDone", programSummary(plan, state).challenges)}
          </p>
        </section>
      )}

      <section className="surface mt-4 p-5">
        <p className="eyebrow text-pink">{t("home.thisWeek")}</p>
        <h2 className="mt-1 text-xl">{weekComplete ? t("plan.fullWeek") : t("prog.highlights")}</h2>
        {week.workouts === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {t("prog.nothingThisWeek")}
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className={"rounded-lg p-3 " + (weekComplete ? "bg-success" : "bg-ice")}>
                <p className="eyebrow text-ink/70">{t("prog.workouts")}</p>
                <p className="mt-0.5 font-display text-xl text-ink">{week.workouts}/5</p>
              </div>
              <div className="rounded-lg bg-ice p-3">
                <p className="eyebrow text-ink/70">{t("workout.volume")}</p>
                <p className="mt-0.5 font-display text-xl text-ink">{t.num(week.volume)}</p>
              </div>
              <div className="rounded-lg bg-ice p-3">
                <p className="eyebrow text-ink/70">{t("edit.sets")}</p>
                <p className="mt-0.5 font-display text-xl text-ink">{week.sets}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-muted-foreground uppercase">
              {t("prog.minTrained", { min: week.minutes })}
              {week.bestDay ? ` · ${t("prog.biggestDay", { day: t.c(week.bestDay.title) })}` : ""}
            </p>
            <div className="mt-3 rounded-lg bg-acid p-3">
              <p className="eyebrow text-ink">{t("prog.recordsThisWeek")}</p>
              {week.prs.length === 0 ? (
                <p className="mt-1 text-xs font-bold text-ink/70 uppercase">{t("prog.noPrs")}</p>
              ) : (
                <ul className="mt-1 space-y-0.5 text-xs font-bold text-ink uppercase">
                  {week.prs.map((pr) => (
                    <li key={pr}>
                      {t("pr.title")} ⚡ {prText(t, pr)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">{t("prog.weightProgression")}</h2>
        <p className="mt-1 mb-4 text-xs font-semibold text-muted-foreground">
          {t("prog.weightProgressionBody")}
        </p>
        <WeightChart trend={state.trend} />
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">{t("wrap.prs")}</h2>
        {prs.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("prog.prsEmpty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {prs.map(([name, pr]) => {
              const isNew = freshNames.includes(name);
              return (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"
                >
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <Trophy
                      className={"size-3.5 " + (isNew ? "text-spicy" : "text-ink")}
                      aria-hidden
                    />
                    <ExerciseName name={name} />
                    {isNew && (
                      <span className="pr-pop inline-flex items-center gap-0.5 rounded-full bg-acid px-1.5 py-0.5 text-[10px] font-bold text-ink uppercase">
                        {t("prog.new")} <span className="pr-bolt">⚡</span>
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      "rounded-full bg-acid px-2 py-0.5 text-xs font-bold whitespace-nowrap text-ink " +
                      (isNew ? "pr-ring" : "")
                    }
                  >
                    <bdi>
                      {pr.weight} {t("unit.kg")} × {pr.reps}
                    </bdi>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="surface mt-4 p-5">
        <h2 className="text-xl">{t("prog.workoutHistory")}</h2>
        {state.history.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("prog.noWorkouts")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.history.map((h) => (
              <li
                key={`${h.planId}-${h.day}-${h.at}`}
                className="border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold uppercase">
                    {t("ex.weekShort", { n: weekOf(h.day) })} ·{" "}
                    {t("common.dayN", { n: dayInWeek(h.day) })} · {t.c(h.title)}
                  </p>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t.date(h.at)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {t.c(h.focus)} · {t("hist.sets", { n: h.sets })} · {t.num(h.volume)}{" "}
                  {t("unit.kg")} · {t("workout.minutes", { min: h.durationMin })}
                  {h.cardio ? ` · ${t("prog.cardioDone")}` : ""}
                </p>
                {h.notes && (
                  <p className="mt-1 text-xs whitespace-pre-wrap text-muted-foreground italic">
                    “{h.notes}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent = "ice",
}: {
  label: string;
  value: string;
  accent?: "ice" | "acid";
}) {
  return (
    <div className={"rounded-xl p-4 " + (accent === "acid" ? "bg-acid" : "bg-ice")}>
      <p className="eyebrow text-ink/70">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
