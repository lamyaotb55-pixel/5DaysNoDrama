import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DAYS_PER_WEEK, WEEKS, type Plan } from "@/lib/program";
import {
  catchUpWeek,
  localDay,
  planCalendar,
  trainedDays,
  weekProgress,
  type State,
} from "@/lib/store";

/** Re-render at local midnight so the counter turns over on its own. */
function useToday() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const d = new Date(now);
    const nextMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const id = window.setTimeout(() => setNow(Date.now()), nextMidnight - now + 1000);
    return () => window.clearTimeout(id);
  }, [now]);
  return now;
}

/**
 * "Week 3 of 8 · Day 4 of 7", a 7-day strip of this week, workouts left, and
 * nudges when the week is ending or an earlier week needs catching up.
 */
export function WeekCounter({
  plan,
  state,
  tone = "card",
}: {
  plan: Plan;
  state: State;
  tone?: "card" | "onColor";
}) {
  const t = useT();
  const now = useToday();
  const cal = planCalendar(plan.id, state, now);
  const onColor = tone === "onColor";
  const muted = onColor ? "opacity-85" : "text-muted-foreground";

  if (!cal.started) {
    return (
      <p className={"flex items-center gap-1.5 text-[11px] font-bold uppercase " + muted}>
        <CalendarDays className="size-3.5" aria-hidden /> {t("cal.notStarted")}
      </p>
    );
  }

  const wp = weekProgress(plan, cal.week, state.completed, state.walks);
  const left = wp.total - wp.done;
  const trained = trainedDays(plan.id, state);
  const today = localDay(now);
  const catchUp = catchUpWeek(plan, state, now);
  const ending = !cal.over && left > 0 && cal.daysLeft <= 1;

  return (
    <div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase">
        <CalendarDays className="size-3.5" aria-hidden />
        <span>
          {t("home.weekOf", { week: cal.week, total: WEEKS })} ·{" "}
          {cal.over ? t("cal.timeUp") : t("cal.dayOf", { day: cal.dayOfWeek })}
        </span>
      </p>

      {!cal.over && (
        <ol className="mt-2 grid grid-cols-7 gap-1" aria-label={t("cal.thisWeek")}>
          {cal.weekDays.map((d, i) => {
            const done = trained.has(d);
            const isToday = d === today;
            const past = d < today;
            return (
              <li
                key={d}
                title={new Date(d * 86400000).toLocaleDateString(
                  t.lang === "ar" ? "ar-u-nu-latn" : "en-US",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  },
                )}
                className={
                  "grid h-7 place-items-center rounded-md text-[10px] font-bold tabular-nums " +
                  (done
                    ? onColor
                      ? "bg-paper text-ink"
                      : "bg-success text-ink"
                    : onColor
                      ? "bg-paper/20"
                      : past
                        ? "bg-secondary text-muted-foreground"
                        : "bg-secondary/60 text-muted-foreground") +
                  (isToday ? (onColor ? " ring-2 ring-paper" : " ring-2 ring-ink") : "")
                }
              >
                {done ? "✓" : i + 1}
              </li>
            );
          })}
        </ol>
      )}

      <p className={"mt-2 text-[11px] font-bold uppercase " + muted}>
        {t("cal.workoutsThisWeek", { done: wp.done, total: DAYS_PER_WEEK })}
        {!cal.over &&
          ` · ${cal.daysLeft === 0 ? t("cal.lastDay") : t.plural("cal.daysLeft", cal.daysLeft)}`}
      </p>

      {ending && (
        <p
          className={
            "mt-2 rounded-lg px-3 py-2 text-xs font-bold " +
            (onColor ? "bg-paper text-ink" : "bg-spicy/10 text-spicy")
          }
        >
          {t("cal.endingNudge", {
            left: t.plural("cal.workoutsLeft", left),
            time:
              cal.daysLeft === 0 ? t("cal.todayIsLast") : t.plural("cal.daysToGo", cal.daysLeft),
          })}
        </p>
      )}
      {catchUp && (
        <p
          className={
            "mt-2 rounded-lg px-3 py-2 text-xs font-bold " +
            (onColor ? "bg-paper/25" : "bg-ice/30 text-ink")
          }
        >
          {t("cal.catchUp", {
            week: catchUp.week,
            left: t.plural("cal.workoutsLeft", catchUp.left),
          })}
        </p>
      )}
    </div>
  );
}
