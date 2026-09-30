import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { Check, Flame, Footprints, Play, Timer, Trophy } from "lucide-react";
import { ExerciseCard } from "@/components/ExerciseCard";
import {
  WEEKS,
  dayInWeek,
  dayOption,
  getDay,
  getPlan,
  isUserPlanId,
  phaseInfo,
  phaseOf,
  weekGoal,
  weekOf,
} from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";
import { prText, useT } from "@/lib/i18n";
import { ExerciseName } from "@/components/ExerciseName";
import {
  altAllowed,
  chooseAlt,
  effectiveDay,
  finishSession,
  sessionKey,
  setCardio,
  setWarmup,
  setKey,
  setNotes,
  startSession,
  summarize,
  useStore,
  weekLocked,
} from "@/lib/store";

export const Route = createFileRoute("/workout/$planId/$day")({
  head: ({ params }) => {
    const plan = getPlan(params.planId);
    const day = plan ? getDay(plan, Number(params.day)) : undefined;
    const title = day
      ? `Week ${weekOf(day.day)} Day ${dayInWeek(day.day)} ${day.title} — ${day.focus} | 5 Days No Drama`
      : "Workout | 5 Days No Drama";
    const description = day
      ? `Track sets, reps and weight for ${day.title.toLowerCase()} (${day.focus}) with rest timers and progressive overload targets.`
      : "Track sets, reps and weight with rest timers and progressive overload targets.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: WorkoutPage,
});

function WorkoutPage() {
  const { planId, day: dayParam } = Route.useParams();
  const plan = getPlan(planId);
  const state = useStore();
  const rawDay = plan ? getDay(plan, Number(dayParam)) : undefined;
  const day = plan && rawDay ? effectiveDay(plan.id, rawDay, state.customDays) : undefined;
  const navigate = useNavigate();
  const [review, setReview] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const accent = planAccent(planId);
  const hydrated = useHydrated();
  const t = useT();

  if (isUserPlanId(planId) && !hydrated) return null;

  if (!plan || !day) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">{t("workout.notFound")}</h1>
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

  const key = sessionKey(plan.id, day.day);
  const session = state.active[key];
  // Browsing a day is free; it only counts as in progress after Start.
  const started = Boolean(session?.started);
  const doneBefore = Boolean(state.completed[key]);
  const start = () => startSession(plan.id, day.day);
  const summary = summarize(plan.id, day, session, state.prs);
  const total = day.exercises.length;
  const doneExercises = day.exercises.filter((ex, exIdx) =>
    Array.from({ length: ex.sets }).every((_, i) => session?.sets[setKey(exIdx, i)]?.done),
  ).length;
  const pct = total ? Math.round((doneExercises / total) * 100) : 0;
  const allDone = total > 0 && doneExercises === total;
  const restSeconds = 60;
  const option = dayOption(plan.id, day.day);
  const optionAvailable = altAllowed(day.day) && summary.sets === 0 && !allDone;
  const weekNo = weekOf(day.day);
  const goal = weekGoal(weekNo);
  const phase = phaseInfo(phaseOf(weekNo));
  const locked = weekLocked(plan, weekNo, state);
  const dayLabel = t("common.weekDay", { week: weekNo, day: dayInWeek(day.day) });

  if (locked) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface p-8 text-center">
          <p className="eyebrow text-pink">
            {t("common.phaseN", { n: 2 })} · {t.c("Level It Up 🌶️")}
          </p>
          <h1 className="mt-2 text-2xl">{t("workout.weeks58NotOpen")}</h1>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">
            {t("workout.finishFirst")}
          </p>
          <Link
            to="/plan/$planId"
            params={{ planId: plan.id }}
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {t("workout.backToPlan")}
          </Link>
        </div>
      </main>
    );
  }

  if (cheer) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface overflow-hidden text-center">
          <div className="spicy-wash px-6 py-8">
            <p className="eyebrow opacity-85">
              {dayLabel} · {t.c(day.title)}
            </p>
            <h1 className="mt-2 text-4xl leading-[0.9]">{t("workout.smashedTitle")}</h1>
          </div>
          <div className="px-6 py-6">
            <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[11px] font-bold text-ink uppercase">
              <Check className="size-3.5" aria-hidden /> {t("workout.complete")}
            </span>
            <p className="mt-4 text-sm leading-relaxed font-semibold text-muted-foreground">
              {cheer}
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate({ to: "/" })}
                className="w-full rounded-full bg-spicy px-6 py-4 text-xs font-bold text-accent-foreground uppercase"
              >
                {t("workout.backToPlan")}
              </button>
              <button
                onClick={() => navigate({ to: "/progress" })}
                className="w-full rounded-full bg-secondary px-6 py-3.5 text-xs font-bold uppercase"
              >
                {t("common.seeProgress")}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (review) {
    return (
      <main className="mx-auto max-w-md px-5 pb-16">
        <div className="surface mt-10 p-6 text-center">
          <Trophy className="mx-auto size-8 text-spicy" aria-hidden />
          <h1 className="mt-3 text-2xl">{t("workout.reviewTitle")}</h1>
          <p className="mt-1 text-xs font-bold text-muted-foreground uppercase">
            {dayLabel} · {t.c(day.title)} — {t.c(day.focus)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-start">
            <Stat
              label={t("workout.duration")}
              value={t("workout.minutes", { min: summary.durationMin })}
            />
            <Stat label={t("workout.exercises")} value={`${summary.exercises}/${total}`} />
            <Stat label={t("workout.setsCompleted")} value={String(summary.sets)} />
            <Stat label={t("workout.volume")} value={`${t.num(summary.volume)} ${t("unit.kg")}`} />
          </dl>

          {summary.prs.length > 0 && (
            <div className="pr-pop mt-4 rounded-lg bg-acid p-3 text-start">
              <p className="eyebrow text-ink">
                {t("pr.title")} <span className="pr-bolt">⚡</span>
              </p>
              <ul className="mt-1 space-y-0.5 text-xs font-bold text-ink uppercase">
                {summary.prs.map((pr) => (
                  <li key={pr}>{prText(t, pr)}</li>
                ))}
              </ul>
            </div>
          )}

          <label className="mt-4 flex items-center gap-2 rounded-lg bg-secondary p-3 text-start text-xs font-bold uppercase">
            <input
              type="checkbox"
              checked={session?.warmup ?? false}
              onChange={(e) => setWarmup(plan.id, day.day, e.target.checked)}
              className="size-4 accent-[var(--success)]"
            />
            {t("workout.warmupDone")}
          </label>

          {day.finisher && (
            <label className="mt-4 flex items-center gap-2 rounded-lg bg-secondary p-3 text-start text-xs font-bold uppercase">
              <input
                type="checkbox"
                checked={session?.cardio ?? false}
                onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
                className="size-4 accent-[var(--success)]"
              />
              {t("workout.finisherDone", {
                label: t.c(day.finisher.label),
                detail: t.c(day.finisher.detail),
              })}
            </label>
          )}

          <label className="mt-4 block text-start">
            <span className="eyebrow text-muted-foreground">{t("workout.notes")}</span>
            <textarea
              rows={3}
              value={session?.notes ?? ""}
              onChange={(e) => setNotes(plan.id, day.day, e.target.value)}
              placeholder={t("workout.notesPlaceholder")}
              className="mt-1.5 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            onClick={() => {
              const message = finishSession(plan.id, day.day);
              setCheer(message ?? t("workout.dayDoneFallback"));
            }}
            className="spicy-wash mt-5 w-full rounded-full px-6 py-4 text-xs font-bold tracking-wide uppercase shadow-[var(--shadow-lift)]"
          >
            {t("workout.smashedFinish")}
          </button>
          <button
            onClick={() => setReview(false)}
            className="mt-3 text-[11px] font-bold text-muted-foreground uppercase"
          >
            <span className="inline-block rtl:-scale-x-100">←</span> {t("workout.backToWorkout")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28">
      <div className="pt-8">
        <Link
          to="/plan/$planId"
          params={{ planId: plan.id }}
          className="text-xs font-bold text-muted-foreground uppercase"
        >
          <span className="inline-block rtl:-scale-x-100">←</span> {t.c(plan.name)}
        </Link>
      </div>

      <header className="mt-4 flex items-end gap-3">
        <span className={`day-number ${allDone ? "text-success" : accent.text}`}>
          {String(dayInWeek(day.day)).padStart(2, "0")}
        </span>
        <div className="min-w-0 pb-1">
          <p className="eyebrow text-muted-foreground">
            {t("home.weekOf", { week: weekOf(day.day), total: WEEKS })} ·{" "}
            {t("common.dayN", { n: dayInWeek(day.day) })}
          </p>
          <h1 className="text-2xl leading-tight sm:text-3xl">{t.c(day.title)}</h1>
          <p className="text-sm font-semibold text-muted-foreground">{t.c(day.focus)}</p>
        </div>
      </header>

      <section className="mt-4 rounded-2xl bg-secondary p-4">
        <p className="eyebrow text-pink">
          {t("common.phaseN", { n: phase.no })} · {t.c(phase.name)}
        </p>
        <p className="mt-1 font-display text-base uppercase">
          {t("workout.weekGoal", { week: weekNo, goal: t.c(goal.title) })}
        </p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{t.c(goal.copy)}</p>
      </section>

      {option && optionAvailable && (
        <button
          type="button"
          onClick={() => {
            chooseAlt(plan.id, day.day);
            navigate({ to: "/plan/$planId", params: { planId: plan.id } });
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-pink px-5 py-3 text-[11px] font-bold text-pink uppercase"
        >
          <Footprints className="size-3.5" aria-hidden />{" "}
          {t("workout.optionInstead", { option: t.c(option.button) })}
        </button>
      )}

      {!started && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">{t("workout.lookAround")}</p>
          <button
            type="button"
            onClick={start}
            className="spicy-wash mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-xs font-bold tracking-wide uppercase shadow-[var(--shadow-lift)]"
          >
            <Play className="size-4 fill-current" aria-hidden />{" "}
            {doneBefore ? t("workout.startAgain") : t("workout.startWorkout")}
          </button>
        </section>
      )}

      <div className="mt-4">
        {allDone ? (
          <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[11px] font-bold text-ink uppercase">
            <Check className="size-3.5" aria-hidden /> {t("workout.dayComplete")}
          </span>
        ) : (
          <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
            {t("workout.progressLine", { done: doneExercises, total })}
          </p>
        )}
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={
              "h-full rounded-full transition-[width] duration-500 " +
              (allDone ? "bg-success" : "bg-spicy")
            }
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <section className="surface mt-6 p-5">
        <p className="eyebrow inline-flex items-center gap-1 text-ice">
          <Timer className="size-3" aria-hidden /> {t("workout.warmup")}
        </p>
        <p className="mt-1.5 text-sm font-semibold">{t("workout.warmupBody")}</p>
        <label className="mt-3 flex items-center gap-2 text-xs font-bold uppercase">
          <input
            type="checkbox"
            checked={session?.warmup ?? false}
            disabled={!started}
            onChange={(e) => setWarmup(plan.id, day.day, e.target.checked)}
            className="size-4 accent-[var(--success)]"
          />
          {t("workout.markComplete")}
        </label>
      </section>

      <div className="mt-4 space-y-4">
        {day.exercises.length === 0 && (
          <div className="surface p-5 text-center">
            <p className="text-sm font-semibold">{t("workout.noExercises")}</p>
            {plan.custom && (
              <Link
                to="/customize/$planId"
                params={{ planId: plan.id }}
                className="mt-3 inline-flex rounded-full bg-ink px-4 py-2.5 text-xs font-bold text-paper uppercase"
              >
                {t("workout.addExercises")}
              </Link>
            )}
          </div>
        )}
        {day.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={`${ex.name}-${exIdx}`}
            planId={plan.id}
            day={day.day}
            week={weekNo}
            exIdx={exIdx}
            exercise={ex}
            state={state}
            restSeconds={restSeconds}
            preview={!started}
          />
        ))}
      </div>

      {day.circuit && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow text-pink">{t.plural("workout.rounds", day.circuit.rounds)}</p>
          <h2 className="mt-1 text-lg">{t.c(day.circuit.name)}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {day.circuit.items.map((item) => (
              <li
                key={item.name}
                className="flex justify-between gap-3 border-b border-border pb-2 last:border-0"
              >
                <span className="font-semibold">
                  <ExerciseName name={item.name} />
                </span>
                <span className="font-semibold text-muted-foreground">{t.c(item.reps)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {day.finisher && (
        <section className="surface mt-4 p-5">
          <p className="eyebrow inline-flex items-center gap-1 text-spicy">
            <Flame className="size-3" aria-hidden /> {t.c(day.finisher.label)}
          </p>
          <p className="mt-1.5 text-sm font-semibold">{t.c(day.finisher.detail)}</p>
          <label className="mt-3 flex items-center gap-2 text-xs font-bold uppercase">
            <input
              type="checkbox"
              checked={session?.cardio ?? false}
              disabled={!started}
              onChange={(e) => setCardio(plan.id, day.day, e.target.checked)}
              className="size-4 accent-[var(--success)]"
            />
            {t("workout.markComplete")}
          </label>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-muted-foreground uppercase">
              {t("workout.barSummary", { sets: summary.sets, kg: t.num(summary.volume) })}
            </p>
          </div>
          {!started ? (
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-2 rounded-full bg-spicy px-5 py-3.5 text-xs font-bold tracking-wide text-accent-foreground uppercase shadow-[var(--shadow-lift)]"
            >
              <Play className="size-4 fill-current" aria-hidden /> {t("workout.start")}
            </button>
          ) : (
            <button
              onClick={() => setReview(true)}
              key={allDone ? "done" : "todo"}
              className={
                "inline-flex items-center gap-2 rounded-full px-5 py-3.5 text-xs font-bold tracking-wide uppercase shadow-[var(--shadow-lift)] " +
                (allDone ? "bg-success text-ink check-pop" : "bg-spicy text-accent-foreground")
              }
            >
              <Check className="size-4" aria-hidden />{" "}
              {allDone ? t("workout.smashed") : t("workout.finish")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary p-3">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-lg">{value}</dd>
    </div>
  );
}
