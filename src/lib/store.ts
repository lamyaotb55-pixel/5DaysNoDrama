import { useSyncExternalStore } from "react";
import {
  DAYS_PER_WEEK,
  TOTAL_DAYS,
  WEEKS,
  WEEKS_PER_PHASE,
  absDay,
  dayInWeek,
  getDay,
  getPlan,
  phaseOf,
  phaseOfDay,
  repRange,
  weekOf,
  type Day,
  type Exercise,
  type Plan,
  type PlanId,
} from "./program";

export type SetLog = { weight: number; reps: number; done: boolean };

export type ActiveSession = {
  startedAt: number;
  sets: Record<string, SetLog>; // `${exIdx}-${setIdx}`
  notes: string;
  cardio: boolean;
};

export type FinishedSession = {
  planId: PlanId;
  day: number;
  title: string;
  focus: string;
  at: number;
  durationMin: number;
  exercises: number;
  sets: number;
  volume: number;
  prs: string[];
  notes: string;
  cardio: boolean;
};

export type BestSet = { at: number; weight: number; reps: number };

export type State = {
  activePlanId: PlanId | null;
  active: Record<string, ActiveSession>; // `${planId}|${day}`
  completed: Record<string, number>; // `${planId}|${day}` -> last finished timestamp
  history: FinishedSession[];
  lastSets: Record<string, { weight: number; reps: number }[]>; // `${planId}|${exName}`
  /** Per-week performance so every week keeps its own weights and reps. */
  weekSets: Record<string, { weight: number; reps: number }[]>; // `${planId}|${week}|${exName}`
  prs: Record<string, BestSet>; // exercise name
  trend: Record<string, BestSet[]>; // exercise name -> best set per session
  customDays: Record<string, Exercise[]>; // `${planId}|${dayInWeek}` (phase 2: `${planId}|p2-${dayInWeek}`)
  rounds: Record<string, number>; // `${planId}` -> how many times the plan was restarted
  skips: Record<string, number>; // `${planId}|${absDay}` -> day 5: chose the alternative (walk / mini)
  walks: Record<string, number>; // `${planId}|${absDay}` -> the alternative was completed
  /** `${planId}` -> timestamp phase 2 (weeks 5–8) was unlocked. */
  phase2: Record<string, number>;
  /** `${planId}` -> timestamp the 8-week completion screen was acknowledged. */
  programSeen: Record<string, number>;
};

const KEY = "five-days-no-drama-v1";

const empty: State = {
  activePlanId: null,
  active: {},
  completed: {},
  history: [],
  lastSets: {},
  weekSets: {},
  prs: {},
  trend: {},
  customDays: {},
  rounds: {},
  skips: {},
  walks: {},
  phase2: {},
  programSeen: {},
};

let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as State) };
  } catch {
    return empty;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function set(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

let announced = false;

function subscribe(cb: () => void) {
  if (!loaded) {
    loaded = true;
    state = load();
  }
  listeners.add(cb);
  // After hydration the server snapshot was empty; nudge subscribers so the
  // stored progress renders without needing a second interaction.
  if (!announced) {
    announced = true;
    queueMicrotask(() => listeners.forEach((l) => l()));
  }
  return () => listeners.delete(cb);
}

export function useStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!loaded) {
        loaded = true;
        state = load();
      }
      return state;
    },
    () => empty,
  );
}

export const sessionKey = (planId: string, day: number) => `${planId}|${day}`;
export const setKey = (exIdx: number, setIdx: number) => `${exIdx}-${setIdx}`;
export const exKey = (planId: string, name: string) => `${planId}|${name}`;

export function choosePlan(planId: PlanId) {
  set({ ...state, activePlanId: planId });
}

export function startSession(planId: string, day: number) {
  const key = sessionKey(planId, day);
  if (state.active[key]) return;
  set({
    ...state,
    active: {
      ...state.active,
      [key]: { startedAt: Date.now(), sets: {}, notes: "", cardio: false },
    },
  });
}

function withSession(planId: string, day: number, patch: (s: ActiveSession) => ActiveSession) {
  const key = sessionKey(planId, day);
  const existing =
    state.active[key] ??
    ({ startedAt: Date.now(), sets: {}, notes: "", cardio: false } as ActiveSession);
  set({ ...state, active: { ...state.active, [key]: patch(existing) } });
}

export function updateSet(
  planId: string,
  day: number,
  exIdx: number,
  setIdx: number,
  patch: Partial<SetLog>,
) {
  withSession(planId, day, (s) => {
    const k = setKey(exIdx, setIdx);
    const cur = s.sets[k] ?? { weight: 0, reps: 0, done: false };
    return { ...s, sets: { ...s.sets, [k]: { ...cur, ...patch } } };
  });
}

export function setNotes(planId: string, day: number, notes: string) {
  withSession(planId, day, (s) => ({ ...s, notes }));
}

export function setCardio(planId: string, day: number, cardio: boolean) {
  withSession(planId, day, (s) => ({ ...s, cardio }));
}

export function discardSession(planId: string, day: number) {
  const active = { ...state.active };
  delete active[sessionKey(planId, day)];
  set({ ...state, active });
}

export type SessionSummary = {
  durationMin: number;
  exercises: number;
  sets: number;
  volume: number;
  prs: string[];
};

export function summarize(
  planId: string,
  day: Day,
  session: ActiveSession | undefined,
  prs: Record<string, BestSet>,
): SessionSummary {
  let sets = 0;
  let volume = 0;
  const exercisesDone = new Set<number>();
  const records: string[] = [];

  day.exercises.forEach((ex, exIdx) => {
    let best: { weight: number; reps: number } | null = null;
    for (let i = 0; i < ex.sets; i++) {
      const log = session?.sets[setKey(exIdx, i)];
      if (!log?.done) continue;
      sets += 1;
      volume += log.weight * log.reps;
      exercisesDone.add(exIdx);
      if (!best || log.weight > best.weight) best = { weight: log.weight, reps: log.reps };
    }
    if (best && best.weight > 0) {
      const pr = prs[ex.name];
      if (!pr || best.weight > pr.weight)
        records.push(`${ex.name} — ${best.weight} kg × ${best.reps}`);
    }
  });

  const durationMin = session
    ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
    : 0;
  return {
    durationMin,
    exercises: exercisesDone.size,
    sets,
    volume: Math.round(volume),
    prs: records,
  };
}

export function finishSession(planId: PlanId, dayNo: number): string | null {
  const plan = getPlan(planId);
  const rawDay = plan ? getDay(plan, dayNo) : undefined;
  const day = rawDay ? effectiveDay(planId, rawDay, state.customDays) : undefined;
  if (!plan || !day) return null;
  const key = sessionKey(planId, dayNo);
  const session = state.active[key];
  const summary = summarize(planId, day, session, state.prs);
  const at = Date.now();

  const lastSets = { ...state.lastSets };
  const prs = { ...state.prs };
  const trend = { ...state.trend };

  day.exercises.forEach((ex, exIdx) => {
    const logged: { weight: number; reps: number }[] = [];
    for (let i = 0; i < ex.sets; i++) {
      const log = session?.sets[setKey(exIdx, i)];
      if (log?.done) logged.push({ weight: log.weight, reps: log.reps });
    }
    if (!logged.length) return;
    lastSets[exKey(planId, ex.name)] = logged;
    const best = logged.reduce((a, b) => (b.weight > a.weight ? b : a));
    if (best.weight > 0) {
      const pr = prs[ex.name];
      if (!pr || best.weight > pr.weight) prs[ex.name] = { ...best, at };
      trend[ex.name] = [...(trend[ex.name] ?? []), { ...best, at }].slice(-40);
    }
  });

  const finished: FinishedSession = {
    planId,
    day: dayNo,
    title: day.title,
    focus: day.focus,
    at,
    durationMin: summary.durationMin,
    exercises: summary.exercises,
    sets: summary.sets,
    volume: summary.volume,
    prs: summary.prs,
    notes: session?.notes ?? "",
    cardio: session?.cardio ?? false,
  };

  const active = { ...state.active };
  delete active[key];

  set({
    ...state,
    active,
    completed: { ...state.completed, [key]: at },
    history: [finished, ...state.history].slice(0, 200),
    lastSets,
    prs,
    trend,
  });

  return encouragement(planId, dayNo, state);
}

export function resetDay(planId: string, day: number) {
  const completed = { ...state.completed };
  delete completed[sessionKey(planId, day)];
  const active = { ...state.active };
  delete active[sessionKey(planId, day)];
  set({ ...state, completed, active });
}

/** Suggested target: only progress when the last session hit the top of the range on every set. */
export function suggestion(
  planId: string,
  exName: string,
  reps: string,
  lastSets: Record<string, { weight: number; reps: number }[]>,
) {
  const last = lastSets[exKey(planId, exName)];
  if (!last?.length) return null;
  const { min, max } = repRange(reps);
  const topWeight = last.reduce((a, b) => (b.weight > a.weight ? b : a));
  const allTop = last.every((s) => s.reps >= max);
  const step = topWeight.weight >= 40 ? 5 : 2.5;
  return {
    last,
    lastBest: topWeight,
    target: allTop && topWeight.weight > 0 ? topWeight.weight + step : topWeight.weight,
    progress: allTop && topWeight.weight > 0,
    range: `${min}${max !== min ? `–${max}` : ""}`,
  };
}

export function weeklyConsistency(history: FinishedSession[]) {
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = history.filter((h) => h.at >= weekAgo).length;
  return { thisWeek, pct: Math.min(100, Math.round((thisWeek / 5) * 100)) };
}

export function totalVolume(history: FinishedSession[]) {
  return history.reduce((n, h) => n + h.volume, 0);
}

/** Highlights for the last 7 days: workouts, volume, sets, minutes and records hit. */
export function weeklyHighlights(history: FinishedSession[]) {
  const weekAgo = Date.now() - 7 * 86400000;
  const week = history.filter((h) => h.at >= weekAgo);
  return {
    workouts: week.length,
    volume: week.reduce((n, h) => n + h.volume, 0),
    sets: week.reduce((n, h) => n + h.sets, 0),
    minutes: week.reduce((n, h) => n + h.durationMin, 0),
    prs: week.flatMap((h) => h.prs),
    bestDay: week.reduce<FinishedSession | null>(
      (a, h) => (!a || h.volume > a.volume ? h : a),
      null,
    ),
  };
}

/* ---------- Plan customization (names, reps, sets, media) ---------- */

/** The day as the user has it: their edited exercise list when present.
 *  Edits are stored per template day (1–5) so they apply to all 8 weeks. */
export function effectiveDay(planId: string, day: Day, custom: State["customDays"]): Day {
  const override = custom[sessionKey(planId, dayInWeek(day.day))];
  return override ? { ...day, exercises: override } : day;
}

export function effectivePlan(plan: Plan, custom: State["customDays"]): Plan {
  return { ...plan, days: plan.days.map((d) => effectiveDay(plan.id, d, custom)) };
}

export function saveDayExercises(planId: string, day: number, exercises: Exercise[]) {
  set({ ...state, customDays: { ...state.customDays, [sessionKey(planId, day)]: exercises } });
}

export function resetDayExercises(planId: string, day: number) {
  const customDays = { ...state.customDays };
  delete customDays[sessionKey(planId, day)];
  set({ ...state, customDays });
}

/* ---------- Restart / change plan ---------- */

/** Clear day completion + in-progress sessions for a plan, keeping all history and records. */
export function restartPlan(planId: PlanId) {
  const completed = { ...state.completed };
  const active = { ...state.active };
  const skips = { ...state.skips };
  const walks = { ...state.walks };
  const prefix = `${planId}|`;
  Object.keys(completed).forEach((k) => k.startsWith(prefix) && delete completed[k]);
  Object.keys(active).forEach((k) => k.startsWith(prefix) && delete active[k]);
  Object.keys(skips).forEach((k) => k.startsWith(prefix) && delete skips[k]);
  Object.keys(walks).forEach((k) => k.startsWith(prefix) && delete walks[k]);
  set({
    ...state,
    completed,
    active,
    skips,
    walks,
    rounds: { ...state.rounds, [planId]: (state.rounds[planId] ?? 1) + 1 },
  });
}

export function clearPlan() {
  set({ ...state, activePlanId: null });
}

/* ---------- Day 5: how are you showing up today? ---------- */

/** The alternative (walk / mini) is offered on day 5 only. */
export function altAllowed(dayNo: number) {
  return dayInWeek(dayNo) === DAYS_PER_WEEK;
}

/** Did the user pick the alternative for this day? */
export function isAltChosen(planId: string, dayNo: number, chosen: State["skips"]) {
  return Boolean(chosen[sessionKey(planId, dayNo)]);
}

/** Did the user finish the alternative for this day? */
export function isAltDone(planId: string, dayNo: number, done: State["walks"]) {
  return Boolean(done[sessionKey(planId, dayNo)]);
}

export function chooseAlt(planId: string, dayNo: number) {
  if (!altAllowed(dayNo)) return false;
  const active = { ...state.active };
  delete active[sessionKey(planId, dayNo)];
  set({ ...state, active, skips: { ...state.skips, [sessionKey(planId, dayNo)]: Date.now() } });
  return true;
}

/** Back to the full workout for this day. */
export function chooseTrain(planId: string, dayNo: number) {
  const skips = { ...state.skips };
  const walks = { ...state.walks };
  delete skips[sessionKey(planId, dayNo)];
  delete walks[sessionKey(planId, dayNo)];
  set({ ...state, skips, walks });
}

export function completeAlt(planId: string, dayNo: number, done: boolean) {
  const walks = { ...state.walks };
  if (done) walks[sessionKey(planId, dayNo)] = Date.now();
  else delete walks[sessionKey(planId, dayNo)];
  set({ ...state, walks });
}

/* ---------- Next workout ---------- */

/** First day of the 8 weeks that is not finished (training or the day 5 alternative). */
export function nextWorkout(
  plan: Plan,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
): Day {
  for (let abs = 1; abs <= TOTAL_DAYS; abs++) {
    const key = sessionKey(plan.id, abs);
    if (!completedMap[key] && !altDone[key]) return getDay(plan, abs)!;
  }
  return getDay(plan, 1)!;
}

export function planProgress(
  plan: Plan,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
) {
  let done = 0;
  let alt = 0;
  for (let abs = 1; abs <= TOTAL_DAYS; abs++) {
    const key = sessionKey(plan.id, abs);
    if (completedMap[key]) done += 1;
    else if (altDone[key]) alt += 1;
  }
  const total = TOTAL_DAYS;
  return {
    done: done + alt,
    trained: done,
    alt,
    total,
    weeks: WEEKS,
    pct: Math.round(((done + alt) / total) * 100),
  };
}

/** Progress inside one week (5 days). */
export function weekProgress(
  plan: Plan,
  week: number,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
) {
  let done = 0;
  let alt = 0;
  for (let d = 1; d <= DAYS_PER_WEEK; d++) {
    const key = sessionKey(plan.id, absDay(week, d));
    if (completedMap[key]) done += 1;
    else if (altDone[key]) alt += 1;
  }
  return {
    done: done + alt,
    trained: done,
    alt,
    total: DAYS_PER_WEEK,
    pct: Math.round(((done + alt) / DAYS_PER_WEEK) * 100),
  };
}

/** Weeks where all five days are finished. */
export function completedWeeks(
  plan: Plan,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
) {
  let n = 0;
  for (let w = 1; w <= WEEKS; w++) {
    const p = weekProgress(plan, w, completedMap, altDone);
    if (p.done >= p.total) n += 1;
  }
  return n;
}

/* ---------- Encouragement ---------- */

const PLAN_LINES: Record<PlanId, string[]> = {
  "lose-weight": [
    "That's movement, sweat and strength in one session.",
    "Every burn session stacks up — fat loss loves consistency.",
    "You showed up and kept moving. That's the whole plan.",
  ],
  "tone-up": [
    "Controlled reps, real definition. Shape is being built.",
    "Strong and shaped — exactly what this plan is for.",
    "That's the kind of clean work that shows in the mirror.",
  ],
  "build-muscle": [
    "Heavy work done. That's growth signalled.",
    "Progressive overload in action — muscle is being built.",
    "You lifted, you progressed. Next session goes heavier.",
  ],
};

/**
 * Encouragement for a finished day, tuned to the plan and the user's consistency.
 * Called after the session is saved, so history already includes it.
 */
export function encouragement(planId: PlanId, dayNo: number, s: State): string {
  const plan = getPlan(planId);
  const planLines = PLAN_LINES[planId];
  const inWeek = dayInWeek(dayNo);
  const weekNo = weekOf(dayNo);
  const base = planLines[(inWeek - 1) % planLines.length]!;
  const week = weeklyConsistency(s.history);
  const streak = currentStreak(s.history);
  const wp = plan ? weekProgress(plan, weekNo, s.completed, s.walks) : null;
  const weeksDone = plan ? completedWeeks(plan, s.completed, s.walks) : 0;
  const remaining = wp ? wp.total - wp.done : 0;

  const parts = [`Week ${weekNo}, Day ${inWeek} of ${plan?.name ?? "your plan"} — done. ${base}`];

  if (weeksDone >= WEEKS) {
    parts.push("All 8 weeks complete. Restart the plan whenever you're ready to go again.");
  } else if (remaining <= 0) {
    parts.push(`Week ${weekNo} closed out — ${WEEKS - weeksDone} weeks to go.`);
  } else if (remaining === 1) {
    parts.push(`One day left in week ${weekNo}. No drama.`);
  } else {
    parts.push(`${remaining} days left in week ${weekNo}.`);
  }

  if (streak >= 3) parts.push(`${streak} days in a row — that streak is doing the work.`);
  else if (week.thisWeek >= 5) parts.push("Five workouts this week. Full consistency.");
  else if (week.thisWeek >= 2)
    parts.push(`${week.thisWeek} workouts this week — momentum is real.`);
  else if (s.history.length === 1) parts.push("First one logged. The hardest one is behind you.");

  return parts.join(" ");
}

/** Consecutive calendar days with at least one finished workout, ending today or yesterday. */
export function currentStreak(history: FinishedSession[]): number {
  const days = new Set(history.map((h) => new Date(h.at).toDateString()));
  if (!days.size) return 0;
  const oneDay = 86400000;
  let cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor = new Date(cursor.getTime() - oneDay);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor = new Date(cursor.getTime() - oneDay);
  }
  return streak;
}
