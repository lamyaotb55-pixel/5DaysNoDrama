import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { dayInWeek, getPlan, weekOf } from "@/lib/program";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Every workout you finished: day, focus, sets, volume, personal records and how the session felt.",
      },
      { property: "og:title", content: "Workout History — 5 Days No Drama" },
      { property: "og:description", content: "Every session you finished, in one clean list." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const state = useStore();

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase">
          <ArrowLeft className="size-3.5 text-spicy" aria-hidden /> Home
        </Link>
      </div>

      <header className="pt-8 pb-6">
        <p className="eyebrow text-spicy">Done &amp; dusted</p>
        <h1 className="mt-3 text-4xl leading-[0.9]">History</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground uppercase">
          {state.history.length} workout{state.history.length === 1 ? "" : "s"} logged
        </p>
      </header>

      {state.history.length === 0 ? (
        <p className="surface p-5 text-sm text-muted-foreground">
          Nothing here yet. Finish a workout day and it lands here.
        </p>
      ) : (
        <ul className="space-y-3">
          {state.history.map((h) => (
            <li key={`${h.planId}-${h.day}-${h.at}`} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-muted-foreground">
                    {getPlan(h.planId)?.name ?? h.planId} · Week {weekOf(h.day)} Day{" "}
                    {dayInWeek(h.day)}
                  </p>
                  <h2 className="mt-1 text-xl leading-tight">{h.title}</h2>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">{h.focus}</p>
                </div>
                <span className="rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                  ✓ Done
                </span>
              </div>
              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase">
                <span>{new Date(h.at).toLocaleDateString()}</span>
                <span className="text-muted-foreground">{h.sets} sets</span>
                <span className="text-muted-foreground">{Math.round(h.volume)} volume</span>
                <span className="text-muted-foreground">{h.durationMin} min</span>
                {h.prs.length > 0 && (
                  <span className="rounded-full bg-acid px-2 py-0.5 text-ink">
                    ⚡ {h.prs.length} PR{h.prs.length === 1 ? "" : "s"}
                  </span>
                )}
              </p>
              {h.notes && <p className="mt-3 text-xs text-muted-foreground italic">“{h.notes}”</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
