import { useCallback, useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { DEFAULT_REST_EXERCISE, DEFAULT_REST_SET, useStore } from "@/lib/store";

export type Rest = {
  kind: "set" | "exercise";
  seconds: number;
  /** When it ends (ms). Counting from a timestamp keeps it right if the screen locks. */
  endsAt: number;
  /** Seconds left while paused; null while running. */
  pausedLeft: number | null;
  /** Name of the exercise that comes next (between-exercise rest only). */
  next?: string | undefined;
};

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** One rest timer for the whole workout, started automatically by ticking sets. */
export function useRest() {
  const state = useStore();
  const setSeconds = state.restSet ?? DEFAULT_REST_SET;
  const exerciseSeconds = state.restExercise ?? DEFAULT_REST_EXERCISE;
  const [rest, setRest] = useState<Rest | null>(null);

  const start = useCallback(
    (kind: Rest["kind"], next?: string) => {
      const seconds = kind === "set" ? setSeconds : exerciseSeconds;
      setRest({ kind, seconds, endsAt: Date.now() + seconds * 1000, pausedLeft: null, next });
    },
    [setSeconds, exerciseSeconds],
  );
  const close = useCallback(() => setRest(null), []);
  const restart = useCallback(
    () =>
      setRest((r) => (r ? { ...r, endsAt: Date.now() + r.seconds * 1000, pausedLeft: null } : r)),
    [],
  );
  const togglePause = useCallback(
    () =>
      setRest((r) => {
        if (!r) return r;
        if (r.pausedLeft !== null)
          return { ...r, endsAt: Date.now() + r.pausedLeft * 1000, pausedLeft: null };
        return { ...r, pausedLeft: Math.max(0, Math.ceil((r.endsAt - Date.now()) / 1000)) };
      }),
    [],
  );
  return { rest, start, close, restart, togglePause };
}

export function RestBar({
  rest,
  onClose,
  onRestart,
  onTogglePause,
}: {
  rest: Rest;
  onClose: () => void;
  onRestart: () => void;
  onTogglePause: () => void;
}) {
  const t = useT();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (rest.pausedLeft !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [rest.pausedLeft, rest.endsAt]);

  const left =
    rest.pausedLeft ?? Math.max(0, Math.ceil((rest.endsAt - Math.max(now, Date.now())) / 1000));
  const done = left === 0;
  const pct = Math.min(100, ((rest.seconds - left) / rest.seconds) * 100);

  // A short buzz when time's up (phones that allow it).
  useEffect(() => {
    if (done) navigator.vibrate?.([180, 90, 180]);
  }, [done]);

  // Close on its own a little after reaching zero.
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(onClose, 8000);
    return () => window.clearTimeout(id);
  }, [done, onClose]);

  return (
    <div
      role="timer"
      aria-live="polite"
      className={
        "relative mx-auto mb-2 flex max-w-2xl items-center gap-2.5 overflow-hidden rounded-2xl px-3.5 py-2.5 shadow-[var(--shadow-lift)] " +
        (done ? "bg-success" : "bg-ice")
      }
    >
      <span
        className="absolute inset-y-0 start-0 bg-ink/10 transition-[width] duration-300"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <Timer className="relative size-4 shrink-0 text-ink" aria-hidden />
      <div className="relative min-w-0 flex-1 text-ink">
        <p className="text-[11px] font-bold uppercase">
          {done
            ? t("rest.go")
            : rest.kind === "exercise"
              ? t("rest.betweenExercises")
              : t("rest.afterSet")}
        </p>
        {rest.kind === "exercise" && rest.next && (
          <p className="truncate text-[11px] font-semibold opacity-80">
            {t("rest.next")} {t.c(rest.next)}
          </p>
        )}
      </div>
      <span className="relative font-display text-xl text-ink tabular-nums" dir="ltr">
        {fmt(left)}
      </span>
      {!done && (
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={rest.pausedLeft !== null ? t("rest.resume") : t("timer.pause")}
          className="relative grid size-9 place-items-center rounded-full bg-card text-ink"
        >
          {rest.pausedLeft !== null ? (
            <Play className="size-3.5" aria-hidden />
          ) : (
            <Pause className="size-3.5" aria-hidden />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onRestart}
        aria-label={t("timer.reset")}
        className="relative grid size-9 place-items-center rounded-full bg-card text-ink"
      >
        <RotateCcw className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("rest.close")}
        className="relative grid size-9 place-items-center rounded-full bg-ink text-paper"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
