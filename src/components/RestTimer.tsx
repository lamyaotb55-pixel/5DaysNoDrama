import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function RestTimer({ seconds = 90 }: { seconds?: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setRunning(false);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <div className="mt-3 flex items-center gap-2 rounded-full bg-ice px-3 py-2">
      <Timer className="size-3.5 text-ink" aria-hidden />
      <span className="text-[11px] font-bold text-ink uppercase">Rest</span>
      <span className="ml-auto font-display text-base text-ink tabular-nums">{fmt(left)}</span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pause rest timer" : "Start rest timer"}
        className="rounded-full bg-card p-2 text-ink"
      >
        {running ? (
          <Pause className="size-3.5" aria-hidden />
        ) : (
          <Play className="size-3.5" aria-hidden />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setRunning(false);
          setLeft(seconds);
        }}
        aria-label="Reset rest timer"
        className="rounded-full bg-card p-2 text-ink"
      >
        <RotateCcw className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
