import { useSyncExternalStore } from "react";
import type { Exercise, Plan, PlanId } from "./plans";

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
  /** key = `${week}-${day}` -> free-text session note */
  notes?: Record<string, string>;
};

export type TrackerState = {
  activeRunId: string | null;
  runs: Run[];
  /** Saved workout templates. key = `${planId}-${dayNo}` -> custom exercise list reused every week */
  templates?: Record<string, Exercise[]>;
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

export function saveNote(week: number, day: number, note: string) {
  updateActive((r) => {
    const notes = { ...(r.notes ?? {}) };
    const key = dayKey(week, day);
    if (note.trim()) notes[key] = note;
    else delete notes[key];
    return { ...r, notes };
  });
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

/* ---------- Workout templates (reused across all 8 weeks) ---------- */

export const templateKey = (planId: PlanId, dayNo: number) => `${planId}-${dayNo}`;

export function saveTemplate(planId: PlanId, dayNo: number, exercises: Exercise[]) {
  ensureLoaded();
  emit({
    ...state,
    templates: { ...(state.templates ?? {}), [templateKey(planId, dayNo)]: exercises },
  });
}

export function resetTemplate(planId: PlanId, dayNo: number) {
  ensureLoaded();
  const templates = { ...(state.templates ?? {}) };
  delete templates[templateKey(planId, dayNo)];
  emit({ ...state, templates });
}

/** The plan with any saved custom templates applied to its days. */
export function effectivePlan(plan: Plan, templates?: Record<string, Exercise[]>): Plan {
  if (!templates) return plan;
  return {
    ...plan,
    days: plan.days.map((day, i) => {
      const custom = templates[templateKey(plan.id, i + 1)];
      return custom && custom.length ? { ...day, exercises: custom } : day;
    }),
  };
}

/* ---------- Streak & consistency ---------- */

const dayStamp = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function streakStats(run: Run) {
  const days = [...new Set(Object.values(run.done).map(dayStamp))].sort();
  let longest = 0;
  let current = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = new Date(`${d}T00:00:00Z`).getTime();
    current = prev !== null && t - prev === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    prev = t;
  }
  // The streak only counts as live if the last session was today or yesterday.
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const live = prev !== null && today - prev <= 86_400_000;
  const weeksElapsed = Math.max(
    1,
    Math.ceil((Date.now() - new Date(run.startedAt).getTime()) / (7 * 86_400_000)),
  );
  const expected = Math.min(40, weeksElapsed * 5);
  const doneCount = Object.keys(run.done).length;
  return {
    current: live ? current : 0,
    longest,
    activeDays: days.length,
    consistency: Math.min(100, Math.round((doneCount / expected) * 100)),
    expected,
  };
}
