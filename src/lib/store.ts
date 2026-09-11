import { useSyncExternalStore } from "react";
import {
  getDay,
  getPlan,
  repRange,
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
  prs: Record<string, BestSet>; // exercise name
  trend: Record<string, BestSet[]>; // exercise name -> best set per session
  customDays: Record<string, Exercise[]>; // `${planId}|${day}` -> edited exercise list
  rounds: Record<string, number>; // `${planId}` -> how many times the plan was restarted
};

const KEY = "five-days-no-drama-v1";

const empty: State = {
  activePlanId: null,
  active: {},
  completed: {},
  history: [],
  lastSets: {},
  prs: {},
  trend: {},
  customDays: {},
  rounds: {},
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

function subscribe(cb: () => void) {
  if (!loaded) {
    loaded = true;
    state = load();
  }
  listeners.add(cb);
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
    state.active[key] ?? ({ startedAt: Date.now(), sets: {}, notes: "", cardio: false } as ActiveSession);
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
      if (!pr || best.weight > pr.weight) records.push(`${ex.name} — ${best.weight} kg × ${best.reps}`);
    }
  });

  const durationMin = session ? Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)) : 0;
  return { durationMin, exercises: exercisesDone.size, sets, volume: Math.round(volume), prs: records };
}

export function finishSession(planId: PlanId, dayNo: number) {
  const plan = getPlan(planId);
  const day = plan ? getDay(plan, dayNo) : undefined;
  if (!plan || !day) return;
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
