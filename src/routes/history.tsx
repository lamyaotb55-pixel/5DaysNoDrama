import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Dumbbell, Footprints } from "lucide-react";
import { dayInWeek, dayOption, getPlan, weekOf } from "@/lib/program";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — 5 Days No Drama" },
      {
        name: "description",
        content:
          "Every workout you finished: day, focus, sets, volume, personal records and how you showed up on Day 5.",
      },
      { property: "og:title", content: "Workout History — 5 Days No Drama" },
      { property: "og:description", content: "Every session you finished, in one clean list." },
    ],
  }),
  component: HistoryPage,
});

type TrainedItem = {
  kind: "trained";
  at: number;
  planId: string;
  day: number;
  title: string;
  focus: string;
  sets: number;
  volume: number;
  durationMin: number;
  prs: unknown[];
  notes?: string;
};

type AltItem = {
  kind: "alt";
  at: number;
  planId: string;
  day: number;
  headline: string;
  goal: string;
  button: string;
  doneLabel: string;
};

function HistoryPage() {
  const state = useStore();

  const trained: TrainedItem[] = state.history.map((h) => ({
    kind: "trained",
    at: h.at,
    planId: h.planId,
    day: h.day,
    title: h.title,
    focus: h.focus,
    sets: h.sets,
    volume: h.volume,
    durationMin: h.durationMin,
    prs: h.prs,
    notes: h.notes,
  }));

  const alts: AltItem[] = Object.entries(state.walks)
    .map(([key, at]) => {
      const [planId, dayStr] = key.split("|");
      const day = Number(dayStr);
      const option = dayOption(planId, day);
      if (!option) return null;
      return {
        kind: "alt" as const,
        at,
        planId,
        day,
        headline: option.headline,
        goal: option.goal,
        button: option.button,
        doneLabel: option.doneLabel,
      };
    })
    .filter((x): x is AltItem => x !== null);

  const items = [...trained, ...alts].sort((a, b) => b.at - a.at);

  const weeks = Array.from(new Set(items.map((i) => weekOf(i.day)))).sort((a, b) => b - a);

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
          {items.length} day{items.length === 1 ? "" : "s"} logged
        </p>
      </header>

      {items.length === 0 ? (
        <p className="surface p-5 text-sm text-muted-foreground">
          Nothing here yet. Finish a day and it lands here.
        </p>
      ) : (
        <div className="space-y-8">
          {weeks.map((week) => {
            const weekItems = items.filter((i) => weekOf(i.day) === week);
            return (
              <section key={week}>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-2xl leading-none">Week {week}</h2>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    {weekItems.length} day{weekItems.length === 1 ? "" : "s"} done
                  </span>
                </div>

                <ul className="mt-3 space-y-3">
                  {weekItems.map((item) => (
                    <li key={`${item.kind}-${item.planId}-${item.day}-${item.at}`} className="surface p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="eyebrow text-muted-foreground">
                            {getPlan(item.planId)?.name ?? item.planId} · Week {weekOf(item.day)} Day{" "}
                            {dayInWeek(item.day)}
                          </p>
                          <h3 className="mt-1 text-xl leading-tight">
                            {item.kind === "trained" ? item.title : item.headline}
                          </h3>
                          <p className="text-[11px] font-bold text-muted-foreground uppercase">
                            {item.kind === "trained" ? item.focus : item.goal}
                          </p>
                          {dayInWeek(item.day) === 5 && (
                            <span
                              className={
                                "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase " +
                                (item.kind === "trained"
                                  ? "bg-secondary text-ink"
                                  : "border-2 border-pink text-pink")
                              }
                            >
                              {item.kind === "trained" ? (
                                <>
                                  <Dumbbell className="size-3" aria-hidden /> I&apos;ll Train
                                </>
                              ) : (
                                <>
                                  <Footprints className="size-3" aria-hidden /> {item.button}
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <span className="check-pop inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[10px] font-bold text-ink uppercase">
                          <Check className="size-3" aria-hidden />{" "}
                          {item.kind === "trained" ? "Done" : item.doneLabel}
                        </span>
                      </div>

                      {item.kind === "trained" ? (
                        <>
                          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase">
                            <span>{new Date(item.at).toLocaleDateString()}</span>
                            <span className="text-muted-foreground">{item.sets} sets</span>
                            <span className="text-muted-foreground">
                              {Math.round(item.volume)} volume
                            </span>
                            <span className="text-muted-foreground">{item.durationMin} min</span>
                            {item.prs.length > 0 && (
                              <span className="rounded-full bg-acid px-2 py-0.5 text-ink">
                                ⚡ {item.prs.length} PR{item.prs.length === 1 ? "" : "s"}
                              </span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="mt-3 text-xs text-muted-foreground italic">
                              “{item.notes}”
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold uppercase">
                          <span>{new Date(item.at).toLocaleDateString()}</span>
                          <span className="text-muted-foreground">You showed up your way</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
