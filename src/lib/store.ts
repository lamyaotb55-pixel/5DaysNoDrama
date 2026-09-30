import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applyLang,
  getLang,
  translate,
  translateContent,
  translatePlural,
  type Lang,
} from "./i18n";
import {
  DAYS_PER_WEEK,
  TOTAL_DAYS,
  WEEKS,
  WEEKS_PER_PHASE,
  absDay,
  dayInWeek,
  getDay,
  blankDays,
  getPlan,
  phaseDays,
  setUserPlans,
  phaseOf,
  phaseOfDay,
  repRange,
  weekOf,
  type Day,
  type Exercise,
  type BuiltinPlanId,
  type Plan,
  type PlanId,
} from "./program";

export type SetLog = { weight: number; reps: number; done: boolean };

export type ActiveSession = {
  startedAt: number;
  /** Set when the user taps Start; browsing a day never creates a session. */
  started?: boolean;
  sets: Record<string, SetLog>; // `${exIdx}-${setIdx}`
  notes: string;
  cardio: boolean;
  /** 5-minute warm-up ticked off before the workout. */
  warmup?: boolean;
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
  warmup?: boolean;
  /** Which run of the plan this belongs to (1 = first track, 2 = after first restart…). */
  round?: number;
};

/** Snapshot of a finished (or abandoned) track, saved when the plan is restarted. */
export type TrackArchive = {
  planId: PlanId;
  round: number;
  startedAt: number | null;
  endedAt: number;
  /** Days done per week, index 0 = week 1. */
  weeks: number[];
  daysDone: number;
  sessions: number;
  volume: number;
  prs: number;
  /** Day-5 alternatives completed in that track (`${planId}|${absDay}` -> timestamp). */
  walks: Record<string, number>;
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
  /** Dashboards of previous tracks, newest first. */
  tracks: TrackArchive[];
  /** Plans the user owns: their own copies, plans built from scratch, followed plans. */
  myPlans: Record<string, MyPlan>;
  /** Chosen app language; follows a signed-in user across devices. */
  language?: Lang;
};

/** Where a user plan came from. */
export type PlanOrigin =
  | { kind: "builtin"; planId: string }
  | { kind: "blank" }
  | { kind: "community"; communityId: string; version: number; author: string };

export type MyPlan = {
  id: string;
  name: string;
  description: string;
  base: BuiltinPlanId;
  day5Alt: boolean;
  /** Weeks 1–4. */
  days: Day[];
  /** Weeks 5–8. */
  phase2: Day[];
  createdAt: number;
  updatedAt: number;
  origin: PlanOrigin;
  /** Set once the owner sends it to Plans by You. */
  communityId?: string;
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
  tracks: [],
  myPlans: {},
};

/* ---------- Exercise renames ----------
 * Weights, PRs and trends are stored under the exercise name. When a plan
 * exercise is renamed, move saved data from the old name so nothing is lost. */
const RENAMED_EXERCISES: Record<string, string> = {
  "Chest Press": "Dumbbell Floor Press",
  "Smith Machine Romanian Deadlift": "Barbell Romanian Deadlift",
  "Cable Lateral Raise": "Dumbbell Lateral Raise",
  "Seated Leg Curl": "Lying Leg Curl",
  "Reverse / Curtsy Lunges": "Curtsy Lunge",
  "Reverse Lunges": "Reverse Lunge",
  "Cable Bent Over Row": "Cable Bent-Over Row",
  "Cable Kickbacks": "Cable Kickback",
  "Romanian Deadlift": "Kettlebell Romanian Deadlift",
  "Heel-Elevated Goblet Squat": "Goblet Squat",
  "Smith Machine Bulgarian Split Squat": "Bulgarian Split Squat",
};

const renamed = (name: string) => RENAMED_EXERCISES[name] ?? name;

/** Rewrite the exercise-name segment (last `|` part) of each key; existing new-name data wins. */
function renameKeys<T>(rec: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(rec))
    if (!(k.split("|").pop()! in RENAMED_EXERCISES)) out[k] = v;
  for (const [k, v] of Object.entries(rec)) {
    const parts = k.split("|");
    const name = parts.pop()!;
    if (!(name in RENAMED_EXERCISES)) continue;
    const nk = [...parts, renamed(name)].join("|");
    if (!(nk in out)) out[nk] = v;
  }
  return out;
}

/**
 * Days used to start automatically when opened. Drop those untouched sessions so
 * a day only shows "in progress" once someone taps Start or logs something.
 */
function dropUnstartedSessions(s: State): State {
  const active: State["active"] = {};
  let changed = false;
  for (const [k, sess] of Object.entries(s.active ?? {})) {
    const logged =
      Object.values(sess.sets ?? {}).some((x) => x.done || x.weight || x.reps) ||
      Boolean(sess.notes) ||
      sess.cardio ||
      Boolean(sess.warmup);
    if (sess.started) active[k] = sess;
    else if (logged) {
      active[k] = { ...sess, started: true };
      changed = true;
    } else changed = true;
  }
  return changed ? { ...s, active } : s;
}

function migrateState(s: State): State {
  return dropUnstartedSessions(migrateExerciseNames(s));
}

export function migrateExerciseNames(s: State): State {
  const hasOld = (keys: string[]) => keys.some((k) => k.split("|").pop()! in RENAMED_EXERCISES);
  const customOld = Object.values(s.customDays ?? {}).some((list) =>
    list.some((e) => e.name in RENAMED_EXERCISES),
  );
  if (
    !customOld &&
    !hasOld(Object.keys(s.lastSets ?? {})) &&
    !hasOld(Object.keys(s.weekSets ?? {})) &&
    !hasOld(Object.keys(s.prs ?? {})) &&
    !hasOld(Object.keys(s.trend ?? {}))
  )
    return s;

  const prs = renameKeys(s.prs ?? {});
  const trend = renameKeys(s.trend ?? {});
  // Merge old-name records into an existing new-name entry instead of dropping them.
  for (const [oldName, newName] of Object.entries(RENAMED_EXERCISES)) {
    const oldPr = s.prs?.[oldName];
    const curPr = prs[newName];
    if (oldPr && curPr && oldPr.weight > curPr.weight) prs[newName] = oldPr;
    const oldTrend = s.trend?.[oldName];
    if (oldTrend && s.trend?.[newName])
      trend[newName] = [...s.trend[newName]!, ...oldTrend].sort((a, b) => a.at - b.at).slice(-40);
  }

  return {
    ...s,
    lastSets: renameKeys(s.lastSets ?? {}),
    weekSets: renameKeys(s.weekSets ?? {}),
    prs,
    trend,
    customDays: Object.fromEntries(
      Object.entries(s.customDays ?? {}).map(([k, list]) => [
        k,
        list.map((e) => (e.name in RENAMED_EXERCISES ? { ...e, name: renamed(e.name) } : e)),
      ]),
    ),
  };
}

let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

/* ---------- Cloud sync (Supabase) for signed-in users ----------
 * Guests keep working entirely from localStorage, exactly as before.
 * Once someone is signed in, their state also round-trips through
 * `user_data` so it follows them across devices. */
let currentUserId: string | null = null;
let remoteSyncTimer: ReturnType<typeof setTimeout> | null = null;
let authWired = false;

async function hydrateFromRemote(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    const remoteState = data?.state as Partial<State> | undefined;
    if (remoteState && Object.keys(remoteState).length > 0) {
      state = migrateState({ ...empty, ...remoteState });
      syncUserPlans(state);
      if (state.language) applyLang(state.language);
      persist();
      listeners.forEach((l) => l());
    } else {
      // First time this account has signed in: carry over whatever is on this device.
      await supabase.from("user_data").upsert({ user_id: userId, state });
    }
  } catch {
    /* offline, or the table isn't reachable yet — localStorage stays authoritative */
  }
}

function scheduleRemoteSave() {
  if (!currentUserId) return;
  const userId = currentUserId;
  if (remoteSyncTimer) clearTimeout(remoteSyncTimer);
  remoteSyncTimer = setTimeout(() => {
    void supabase
      .from("user_data")
      .upsert({ user_id: userId, state })
      .then(({ error }) => {
        if (error) console.error("[user_data] save failed", error);
      });
  }, 800);
}

function wireAuthSync() {
  if (authWired || typeof window === "undefined") return;
  authWired = true;
  supabase.auth.getSession().then(({ data }) => {
    const uid = data.session?.user.id ?? null;
    if (uid && uid !== currentUserId) {
      currentUserId = uid;
      void hydrateFromRemote(uid);
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user.id ?? null;
    if (uid && uid !== currentUserId) {
      currentUserId = uid;
      void hydrateFromRemote(uid);
    } else if (!uid) {
      currentUserId = null;
    }
  });
}

/**
 * Progress carried over from an old address (see __root.tsx). Used only when
 * this browser has no progress of its own on the main domain.
 */
function takeCarriedState(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const carry = params.get("carry");
  if (!carry) return null;
  params.delete("carry");
  const rest = params.toString();
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search + (rest ? `#${rest}` : ""),
  );
  try {
    const b64 = carry.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(window.atob(b64)));
    JSON.parse(json);
    return json;
  } catch {
    return null;
  }
}

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const carried = takeCarriedState();
    if (carried && !window.localStorage.getItem(KEY)) window.localStorage.setItem(KEY, carried);
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const loadedState = migrateState({ ...empty, ...(JSON.parse(raw) as State) });
    syncUserPlans(loadedState);
    return loadedState;
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

/** Make the user's own plans visible to getPlan() everywhere. */
function syncUserPlans(s: State) {
  setUserPlans(Object.values(s.myPlans ?? {}).map(toPlan));
}

function set(next: State) {
  state = next;
  syncUserPlans(state);
  persist();
  scheduleRemoteSave();
  listeners.forEach((l) => l());
}

let announced = false;

function subscribe(cb: () => void) {
  if (!loaded) {
    loaded = true;
    state = load();
  }
  wireAuthSync();
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
export const weekExKey = (planId: string, week: number, name: string) =>
  `${planId}|${week}|${name}`;

/** Where an edited day template is stored — phase 1 keeps the original key. */
export const templateKey = (planId: string, dayNo: number) =>
  phaseOfDay(dayNo) === 1 ? `${planId}|${dayInWeek(dayNo)}` : `${planId}|p2-${dayInWeek(dayNo)}`;

export function choosePlan(planId: PlanId) {
  set({ ...state, activePlanId: planId });
}

export function startSession(planId: string, day: number) {
  const key = sessionKey(planId, day);
  const existing = state.active[key];
  if (existing?.started) return;
  set({
    ...state,
    active: {
      ...state.active,
      [key]: existing
        ? { ...existing, started: true }
        : { startedAt: Date.now(), started: true, sets: {}, notes: "", cardio: false },
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

export function setWarmup(planId: string, day: number, warmup: boolean) {
  withSession(planId, day, (s) => ({ ...s, warmup }));
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
  const weekSets = { ...state.weekSets };
  const prs = { ...state.prs };
  const trend = { ...state.trend };
  const weekNo = weekOf(dayNo);

  day.exercises.forEach((ex, exIdx) => {
    const logged: { weight: number; reps: number }[] = [];
    for (let i = 0; i < ex.sets; i++) {
      const log = session?.sets[setKey(exIdx, i)];
      if (log?.done) logged.push({ weight: log.weight, reps: log.reps });
    }
    if (!logged.length) return;
    lastSets[exKey(planId, ex.name)] = logged;
    weekSets[weekExKey(planId, weekNo, ex.name)] = logged;
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
    warmup: session?.warmup ?? false,
    round: state.rounds[planId] ?? 1,
  };

  const active = { ...state.active };
  delete active[key];

  set({
    ...state,
    active,
    completed: { ...state.completed, [key]: at },
    history: [finished, ...state.history].slice(0, 400),
    lastSets,
    weekSets,
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
 *  Edits are stored per phase template day, so they apply to that phase's 4 weeks. */
export function effectiveDay(planId: string, day: Day, custom: State["customDays"]): Day {
  const override = custom[templateKey(planId, day.day)];
  return override ? { ...day, exercises: override } : day;
}

export function effectivePlan(plan: Plan, custom: State["customDays"]): Plan {
  return { ...plan, days: plan.days.map((d) => effectiveDay(plan.id, d, custom)) };
}

export function saveDayExercises(planId: string, day: number, exercises: Exercise[]) {
  if (state.myPlans?.[planId]) {
    updateMyPlanDay(planId, day, { exercises });
    return;
  }
  set({ ...state, customDays: { ...state.customDays, [templateKey(planId, day)]: exercises } });
}

export function resetDayExercises(planId: string, day: number) {
  const customDays = { ...state.customDays };
  delete customDays[templateKey(planId, day)];
  set({ ...state, customDays });
}

/* ---------- Restart / change plan ---------- */

/** Clear day completion + in-progress sessions for a plan, keeping all history and records. */
export function sessionRound(h: FinishedSession) {
  return h.round ?? 1;
}

export function restartPlan(planId: PlanId) {
  const plan = getPlan(planId);
  const round = state.rounds[planId] ?? 1;
  const sessions = state.history.filter((h) => h.planId === planId && sessionRound(h) === round);
  const trackWalks = Object.fromEntries(
    Object.entries(state.walks).filter(([k]) => k.startsWith(`${planId}|`)),
  );
  const archive: TrackArchive | null = plan
    ? {
        planId,
        round,
        startedAt: sessions.length ? Math.min(...sessions.map((h) => h.at)) : null,
        endedAt: Date.now(),
        weeks: Array.from(
          { length: WEEKS },
          (_, i) => weekProgress(plan, i + 1, state.completed, state.walks).done,
        ),
        daysDone: planProgress(plan, state.completed, state.walks).done,
        sessions: sessions.length,
        volume: sessions.reduce((a, h) => a + h.volume, 0),
        prs: sessions.reduce((a, h) => a + h.prs.length, 0),
        walks: trackWalks,
      }
    : null;
  const completed = { ...state.completed };
  const active = { ...state.active };
  const skips = { ...state.skips };
  const walks = { ...state.walks };
  const prefix = `${planId}|`;
  Object.keys(completed).forEach((k) => k.startsWith(prefix) && delete completed[k]);
  Object.keys(active).forEach((k) => k.startsWith(prefix) && delete active[k]);
  Object.keys(skips).forEach((k) => k.startsWith(prefix) && delete skips[k]);
  Object.keys(walks).forEach((k) => k.startsWith(prefix) && delete walks[k]);
  const weekSets = { ...state.weekSets };
  Object.keys(weekSets).forEach((k) => k.startsWith(prefix) && delete weekSets[k]);
  const phase2 = { ...state.phase2 };
  const programSeen = { ...state.programSeen };
  delete phase2[planId];
  delete programSeen[planId];
  set({
    ...state,
    completed,
    active,
    skips,
    walks,
    weekSets,
    phase2,
    programSeen,
    tracks: archive ? [archive, ...(state.tracks ?? [])] : (state.tracks ?? []),
    rounds: { ...state.rounds, [planId]: round + 1 },
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

const PLAN_LINES: Record<BuiltinPlanId, string[]> = {
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
  const planLines = PLAN_LINES[plan?.base ?? "lose-weight"];
  const inWeek = dayInWeek(dayNo);
  const weekNo = weekOf(dayNo);
  const base = planLines[(inWeek - 1) % planLines.length]!;
  const week = weeklyConsistency(s.history);
  const streak = currentStreak(s.history);
  const wp = plan ? weekProgress(plan, weekNo, s.completed, s.walks) : null;
  const weeksDone = plan ? completedWeeks(plan, s.completed, s.walks) : 0;
  const remaining = wp ? wp.total - wp.done : 0;

  const l = getLang();
  const planName = plan ? translateContent(l, plan.name) : translate(l, "cheer.yourPlan");
  const parts = [
    translate(l, "cheer.done", { week: weekNo, day: inWeek, plan: planName }),
    translateContent(l, base),
  ];

  if (weeksDone >= WEEKS) {
    parts.push(translate(l, "cheer.allWeeks"));
  } else if (remaining <= 0) {
    parts.push(
      translate(l, "cheer.weekClosed", {
        week: weekNo,
        left: translatePlural(l, "cheer.weeksToGo", WEEKS - weeksDone),
      }),
    );
  } else if (remaining === 1) {
    parts.push(translate(l, "cheer.oneDayLeft", { week: weekNo }));
  } else {
    parts.push(translate(l, "cheer.daysLeft", { n: remaining, week: weekNo }));
  }

  if (streak >= 3) parts.push(translate(l, "cheer.streak", { n: streak }));
  else if (week.thisWeek >= 5) parts.push(translate(l, "cheer.fiveThisWeek"));
  else if (week.thisWeek >= 2) parts.push(translate(l, "cheer.momentum", { n: week.thisWeek }));
  else if (s.history.length === 1) parts.push(translate(l, "cheer.first"));

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

/* ---------- Phases: weeks 1–4 and weeks 5–8 ---------- */

/** Every week of the first phase finished? */
export function phase1Complete(
  plan: Plan,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
) {
  for (let w = 1; w <= WEEKS_PER_PHASE; w++) {
    const p = weekProgress(plan, w, completedMap, altDone);
    if (p.done < p.total) return false;
  }
  return true;
}

export function isPhase2Unlocked(planId: string, s: State) {
  return Boolean(s.phase2[planId]);
}

export function unlockPhase2(planId: string) {
  if (state.phase2[planId]) return;
  set({ ...state, phase2: { ...state.phase2, [planId]: Date.now() } });
}

/** Weeks 5–8 stay locked until the first phase is finished and unlocked. */
export function weekLocked(plan: Plan, week: number, s: State) {
  return phaseOf(week) === 2 && !isPhase2Unlocked(plan.id, s);
}

/** Phase 1 is finished but the user hasn't opened phase 2 yet. */
export function phase2Ready(plan: Plan, s: State) {
  return !isPhase2Unlocked(plan.id, s) && phase1Complete(plan, s.completed, s.walks);
}

/** Furthest week the user can currently open. */
export function currentWeek(plan: Plan, s: State) {
  for (let w = 1; w <= WEEKS; w++) {
    if (weekLocked(plan, w, s)) return Math.max(1, w - 1);
    const p = weekProgress(plan, w, s.completed, s.walks);
    if (p.done < p.total) return w;
  }
  return WEEKS;
}

/** Progress inside one phase (20 days). */
export function phaseProgress(
  plan: Plan,
  phase: 1 | 2,
  completedMap: Record<string, number>,
  altDone: State["walks"] = {},
) {
  const first = phase === 1 ? 1 : WEEKS_PER_PHASE + 1;
  let done = 0;
  let trained = 0;
  for (let w = first; w < first + WEEKS_PER_PHASE; w++) {
    const p = weekProgress(plan, w, completedMap, altDone);
    done += p.done;
    trained += p.trained;
  }
  const total = WEEKS_PER_PHASE * DAYS_PER_WEEK;
  return { done, trained, total, pct: Math.round((done / total) * 100) };
}

/** Weight and reps logged for an exercise in an earlier week of this plan. */
export function previousWeekSets(
  planId: string,
  week: number,
  exName: string,
  s: Pick<State, "weekSets" | "lastSets">,
): { week: number | null; sets: { weight: number; reps: number }[] } | null {
  for (let w = week - 1; w >= 1; w--) {
    const sets = s.weekSets[weekExKey(planId, w, exName)];
    if (sets?.length) return { week: w, sets };
  }
  const fallback = s.lastSets[exKey(planId, exName)];
  return fallback?.length ? { week: null, sets: fallback } : null;
}

/** Everything the 8-week wrap-up screen shows. */
export function programSummary(plan: Plan, s: State) {
  const history = s.history.filter((h) => h.planId === plan.id);
  const challenges = Object.keys(s.walks).filter((k) => k.startsWith(`${plan.id}|`)).length;
  const overall = planProgress(plan, s.completed, s.walks);
  const prs = Object.entries(s.prs).sort((a, b) => b[1].weight - a[1].weight);

  const counts = new Map<string, number>();
  history.forEach((h) => counts.set(h.title, (counts.get(h.title) ?? 0) + 1));
  const topDays = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const improvements = Object.entries(s.trend)
    .map(([name, points]) => {
      const first = points[0];
      const last = points[points.length - 1];
      if (!first || !last || first.weight <= 0) return null;
      return { name, from: first.weight, to: last.weight, gain: last.weight - first.weight };
    })
    .filter((x): x is { name: string; from: number; to: number; gain: number } => !!x && x.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 4);

  return {
    workouts: overall.trained,
    challenges,
    volume: totalVolume(history),
    minutes: history.reduce((n, h) => n + h.durationMin, 0),
    consistency: Math.round((overall.done / overall.total) * 100),
    prs: prs.slice(0, 5),
    prCount: prs.length,
    improvements,
    topDays,
  };
}

/** True once all 8 weeks are finished. */
export function programComplete(plan: Plan, s: State) {
  return completedWeeks(plan, s.completed, s.walks) >= WEEKS;
}

export function markProgramSeen(planId: string) {
  if (state.programSeen[planId]) return;
  set({ ...state, programSeen: { ...state.programSeen, [planId]: Date.now() } });
}

/**
 * Week-by-week best set for a progression (anchor) lift, across both phases.
 * Falls back to the plain last-sets record when a week wasn't tracked per-week.
 */
export function anchorHistory(
  planId: string,
  exName: string,
  s: Pick<State, "weekSets" | "lastSets">,
) {
  const points: { week: number; phase: 1 | 2; weight: number; reps: number }[] = [];
  for (let w = 1; w <= WEEKS; w++) {
    const sets = s.weekSets[weekExKey(planId, w, exName)];
    if (!sets?.length) continue;
    const best = sets.reduce((a, b) => (b.weight > a.weight ? b : a));
    points.push({ week: w, phase: phaseOf(w), weight: best.weight, reps: best.reps });
  }
  const first = points[0];
  const last = points[points.length - 1];
  const gain = first && last ? last.weight - first.weight : 0;
  const best = points.reduce<(typeof points)[number] | undefined>(
    (a, b) => (!a || b.weight > a.weight ? b : a),
    undefined,
  );
  return { points, gain, best };
}

/**
 * Overall program progress driven purely by finished work — completed weeks and
 * workouts — never by calendar time. Phase 2 days count exactly like phase 1.
 */
export function programProgress(plan: Plan, s: State) {
  const overall = planProgress(plan, s.completed, s.walks);
  const p1 = phaseProgress(plan, 1, s.completed, s.walks);
  const p2 = phaseProgress(plan, 2, s.completed, s.walks);
  const weeksDone = completedWeeks(plan, s.completed, s.walks);
  return {
    ...overall,
    weeksDone,
    weeksTotal: WEEKS,
    phase1: p1,
    phase2: p2,
    // Share of the whole 8-week program each phase has already delivered.
    phase1Share: Math.round((p1.done / overall.total) * 100),
    phase2Share: Math.round((p2.done / overall.total) * 100),
  };
}

/* ---------- My Plans ---------- */

export function toPlan(p: MyPlan): Plan {
  const byline =
    p.origin.kind === "community"
      ? `By ${p.origin.author}`
      : p.communityId
        ? "Shared by you"
        : "My plan";
  return {
    id: p.id,
    name: p.name,
    slogan: p.description,
    label: byline,
    goal: p.description,
    style: "",
    days: p.days,
    phase2: p.phase2,
    base: p.base,
    day5Alt: p.day5Alt,
    custom: true,
  };
}

const newPlanId = () => `my-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const cloneDays = (days: Day[]): Day[] => JSON.parse(JSON.stringify(days)) as Day[];

/**
 * Start a new plan owned by the user: a copy of a plan (with any edits they
 * made to it) or a blank one. Returns the new plan id.
 */
export function createMyPlan(fromPlanId: string | null): string {
  const id = newPlanId();
  const now = Date.now();
  const source = fromPlanId ? getPlan(fromPlanId) : undefined;
  let plan: MyPlan;
  if (source) {
    const edited = (phase: 1 | 2, week: number) =>
      phaseDays(source, phase).map((d) =>
        effectiveDay(source.id, { ...d, day: absDay(week, d.day) }, state.customDays),
      );
    const strip = (days: Day[]) => cloneDays(days).map((d, i) => ({ ...d, day: i + 1 }));
    plan = {
      id,
      name: `My ${source.name}`,
      description: source.custom ? source.goal : source.slogan,
      base: source.base,
      day5Alt: source.day5Alt !== false,
      days: strip(edited(1, 1)),
      phase2: strip(edited(2, WEEKS_PER_PHASE + 1)),
      createdAt: now,
      updatedAt: now,
      origin: { kind: "builtin", planId: source.id },
    };
  } else {
    plan = {
      id,
      name: "My New Plan",
      description: "",
      base: "tone-up",
      day5Alt: false,
      days: blankDays(),
      phase2: blankDays(),
      createdAt: now,
      updatedAt: now,
      origin: { kind: "blank" },
    };
  }
  set({ ...state, myPlans: { ...(state.myPlans ?? {}), [id]: plan } });
  return id;
}

export type MyPlanPatch = Partial<Pick<MyPlan, "name" | "description" | "base" | "day5Alt">>;

export function updateMyPlan(id: string, patch: MyPlanPatch) {
  const plan = state.myPlans?.[id];
  if (!plan) return;
  set({
    ...state,
    myPlans: { ...state.myPlans, [id]: { ...plan, ...patch, updatedAt: Date.now() } },
  });
}

/** Change one day template of a user plan; `absDayNo` picks the phase. */
export function updateMyPlanDay(
  id: string,
  absDayNo: number,
  patch: Partial<Pick<Day, "title" | "focus" | "exercises">>,
) {
  const plan = state.myPlans?.[id];
  if (!plan) return;
  const key = phaseOfDay(absDayNo) === 1 ? "days" : "phase2";
  const idx = dayInWeek(absDayNo) - 1;
  const days = plan[key].map((d, i) => (i === idx ? { ...d, ...patch } : d));
  set({
    ...state,
    myPlans: { ...state.myPlans, [id]: { ...plan, [key]: days, updatedAt: Date.now() } },
  });
}

export function deleteMyPlan(id: string) {
  const myPlans = { ...(state.myPlans ?? {}) };
  delete myPlans[id];
  set({
    ...state,
    myPlans,
    activePlanId: state.activePlanId === id ? null : state.activePlanId,
  });
}

export function linkCommunityPlan(id: string, communityId: string) {
  const plan = state.myPlans?.[id];
  if (!plan) return;
  set({ ...state, myPlans: { ...state.myPlans, [id]: { ...plan, communityId } } });
}

/** Published plan content as stored in Plans by You. */
export type CommunityContent = { day5Alt: boolean; days: Day[]; phase2: Day[] };

export function communityContent(plan: MyPlan): CommunityContent {
  return { day5Alt: plan.day5Alt, days: plan.days, phase2: plan.phase2 };
}

/** Copy a published plan into My Plans. Returns the (existing or new) plan id. */
export function followIntoMyPlans(cp: {
  id: string;
  name: string;
  description: string;
  base: BuiltinPlanId;
  version: number;
  author: string;
  content: CommunityContent;
}): string {
  const existing = Object.values(state.myPlans ?? {}).find(
    (p) => p.origin.kind === "community" && p.origin.communityId === cp.id,
  );
  if (existing) return existing.id;
  const id = newPlanId();
  const now = Date.now();
  const plan: MyPlan = {
    id,
    name: cp.name,
    description: cp.description,
    base: cp.base,
    day5Alt: cp.content.day5Alt,
    days: cloneDays(cp.content.days),
    phase2: cloneDays(cp.content.phase2),
    createdAt: now,
    updatedAt: now,
    origin: { kind: "community", communityId: cp.id, version: cp.version, author: cp.author },
  };
  set({ ...state, myPlans: { ...(state.myPlans ?? {}), [id]: plan } });
  return id;
}

/** Switch a followed plan to the latest approved version. Progress is kept. */
export function applyCommunityUpdate(
  id: string,
  cp: {
    name: string;
    description: string;
    base: BuiltinPlanId;
    version: number;
    content: CommunityContent;
  },
) {
  const plan = state.myPlans?.[id];
  if (!plan || plan.origin.kind !== "community") return;
  set({
    ...state,
    myPlans: {
      ...state.myPlans,
      [id]: {
        ...plan,
        name: cp.name,
        description: cp.description,
        base: cp.base,
        day5Alt: cp.content.day5Alt,
        days: cloneDays(cp.content.days),
        phase2: cloneDays(cp.content.phase2),
        updatedAt: Date.now(),
        origin: { ...plan.origin, version: cp.version },
      },
    },
  });
}

/* ---------- Language ---------- */

/** Switch the app language and remember it (device + account). */
export function setLanguage(language: Lang) {
  applyLang(language);
  if (state.language !== language) set({ ...state, language });
}
