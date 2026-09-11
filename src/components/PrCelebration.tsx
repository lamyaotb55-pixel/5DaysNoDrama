import { useEffect, useState } from "react";

const BITS = ["var(--acid)", "var(--pink)", "var(--ice)", "var(--spicy)", "var(--acid)"];

/** Acid-yellow celebration burst shown when new personal records land. */
export function PrCelebration({ prs, onDone }: { prs: string[]; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 3200);
    const t2 = setTimeout(onDone, 3800);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      className={
        "fixed inset-0 z-50 grid place-items-center bg-ink/40 px-6 backdrop-blur-sm transition-opacity duration-500 " +
        (leaving ? "opacity-0" : "opacity-100")
      }
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="confetti-bit absolute top-0 block h-3 w-1.5 rounded-full"
            style={{
              left: `${(i * 5.5 + 4) % 100}%`,
              backgroundColor: BITS[i % BITS.length],
              animationDelay: `${(i % 6) * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="pr-pop relative w-full max-w-xs rounded-2xl bg-acid p-6 text-center text-ink">
        <span className="pr-bolt block text-4xl" aria-hidden>
          ⚡
        </span>
        <h2 className="mt-2 text-3xl leading-[0.9]">New PR</h2>
        <p className="mt-1 text-[11px] font-bold tracking-widest uppercase">
          Strong looks good on you.
        </p>
        <ul className="mt-4 space-y-1 text-xs font-bold uppercase">
          {prs.slice(0, 4).map((pr) => (
            <li key={pr} className="rounded-full bg-ink/10 px-3 py-1">
              {pr}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] font-bold tracking-widest uppercase opacity-60">
          Tap to close
        </p>
      </div>
    </div>
  );
}
