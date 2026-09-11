import { useSyncExternalStore } from "react";
import type { PlanId } from "./plans";

export type LogEntry = { reps: number; rounds: number; weight: number };

export type Run = {
  id: string;
  planId: PlanId;
  startedAt: string;
  finishedAt?: string;
  /** key = `${week}-${day}-${exerciseIndex}` */
  logs: Record<string, LogEntry>;
  /** key = `${week}-${day}` -> ISO date completed */
  done: Record<string, string>;
};

export type TrackerState = {
  activeRunId: string | null;
  runs: Run[];
};

const KEY = "fitflow.tracker.v1";
const EMPTY: TrackerState = { activeRunId: null, runs: [] };

let state: TrackerState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): TrackerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as TrackerState;
    if (!parsed || !Array.isArray(parsed.runs)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = load();
    loaded = true;
  }
}

function emit(next: TrackerState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  ensureLoaded();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useTracker() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function activeRun(s: TrackerState): Run | null {
  return s.runs.find((r) => r.id === s.activeRunId) ?? null;
}

export const dayKey = (week: number, day: number) => `${week}-${day}`;
export const logKey = (week: number, day: number, index: number) => `${week}-${day}-${index}`;

export function startPlan(planId: PlanId) {
  ensureLoaded();
  const run: Run = {
    id: `${planId}-${Date.now()}`,
    planId,
    startedAt: new Date().toISOString(),
    logs: {},
    done: {},
  };
  emit({ activeRunId: run.id, runs: [...state.runs, run] });
  return run.id;
}

function updateActive(fn: (run: Run) => Run) {
  ensureLoaded();
  if (!state.activeRunId) return;
  emit({
    ...state,
    runs: state.runs.map((r) => (r.id === state.activeRunId ? fn(r) : r)),
  });
}

export function saveLog(week: number, day: number, index: number, entry: LogEntry) {
  updateActive((r) => ({ ...r, logs: { ...r.logs, [logKey(week, day, index)]: entry } }));
}

export function toggleDayDone(week: number, day: number) {
  updateActive((r) => {
    const key = dayKey(week, day);
    const done = { ...r.done };
    if (done[key]) delete done[key];
    else done[key] = new Date().toISOString();
    return { ...r, done };
  });
}

/** Archive the current run and begin a fresh track of the same (or another) plan. */
export function restartPlan(planId: PlanId) {
  ensureLoaded();
  const runs = state.runs.map((r) =>
    r.id === state.activeRunId && !r.finishedAt ? { ...r, finishedAt: new Date().toISOString() } : r,
  );
  const run: Run = {
    id: `${planId}-${Date.now()}`,
    planId,
    startedAt: new Date().toISOString(),
    logs: {},
    done: {},
  };
  emit({ activeRunId: run.id, runs: [...runs, run] });
}

export function switchToRun(id: string) {
  ensureLoaded();
  emit({ ...state, activeRunId: id });
}
