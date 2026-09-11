import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/program";
import { planAccent } from "@/lib/plan-theme";

export const Route = createFileRoute("/theme")({
  head: () => ({
    meta: [
      { title: "Brand Palette — 5 Days No Drama" },
      {
        name: "description",
        content:
          "The full 5 Days No Drama palette: Spicy Red, Hot Pink, Bubblegum, Electric Ice Blue, Acid Yellow and Juicy Green, plus plan-specific accents.",
      },
      { property: "og:title", content: "Brand Palette — 5 Days No Drama" },
      {
        property: "og:description",
        content: "Spicy. Strong. Playful. Clean. Confident. See every colour and how it is used.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThemePage,
});

const SWATCHES: { name: string; hex: string; use: string; on: string }[] = [
  {
    name: "Spicy Red",
    hex: "#FF2038",
    use: "Primary CTAs, active states, progress",
    on: "text-paper",
  },
  {
    name: "Hot Pink",
    hex: "#FF4FA3",
    use: "Secondary highlights, tags, selected cards",
    on: "text-paper",
  },
  { name: "Bubblegum", hex: "#FFB3D9", use: "Soft accent backgrounds, decoration", on: "text-ink" },
  { name: "Electric Ice", hex: "#70D7FF", use: "Stats, rest timers, information", on: "text-ink" },
  { name: "Acid Yellow", hex: "#F5FF52", use: "PRs, streaks, badges, NEW", on: "text-ink" },
  { name: "Juicy Green", hex: "#35E875", use: "Completion & success only", on: "text-ink" },
  { name: "Almost Black", hex: "#111111", use: "Type, icons, contrast", on: "text-paper" },
  { name: "Cool Gray", hex: "#F5F5F7", use: "Inputs, inactive, subtle sections", on: "text-ink" },
];

function ThemePage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-8">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          ← Home
        </Link>
      </div>

      <header className="mt-4">
        <p className="eyebrow text-spicy">Brand palette</p>
        <h1 className="mt-1.5 text-4xl leading-[0.9] sm:text-5xl">
          Spicy. Strong.
          <br />
          Playful.
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">
          Every colour in the app, what it means, and how each plan is tinted.
        </p>
      </header>

      <section className="spicy-wash mt-6 rounded-2xl px-6 py-8 shadow-[var(--shadow-lift)]">
        <p className="eyebrow opacity-85">Hero gradient</p>
        <p className="mt-2 font-display text-3xl leading-[0.9] uppercase">No drama. Just reps.</p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        {SWATCHES.map((s) => (
          <div key={s.hex} className="surface overflow-hidden">
            <div
              className={"grid h-24 place-items-end p-3 " + s.on}
              style={{ backgroundColor: s.hex }}
            >
              <span className="font-display text-xs tracking-wide uppercase">{s.hex}</span>
            </div>
            <div className="p-3">
              <p className="text-sm font-bold uppercase">{s.name}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{s.use}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="text-xl">Plan accents</h2>
        <div className="mt-3 space-y-3">
          {PLANS.map((p) => {
            const a = planAccent(p.id);
            return (
              <div key={p.id} className={"surface flex items-center gap-4 p-4 " + a.soft}>
                <span className={"grid size-12 shrink-0 place-items-center rounded-xl " + a.bg}>
                  <span className={"font-display text-lg " + a.on}>{p.name.slice(0, 1)}</span>
                </span>
                <div className="min-w-0">
                  <p className={"eyebrow " + a.text}>{p.label}</p>
                  <p className="text-sm font-bold uppercase">{p.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl">States</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="surface p-4">
            <p className="eyebrow text-muted-foreground">Primary action</p>
            <button className="mt-2 w-full rounded-full bg-spicy px-5 py-3.5 text-xs font-bold text-accent-foreground uppercase">
              Start Workout
            </button>
          </div>
          <div className="surface p-4">
            <p className="eyebrow text-muted-foreground">Completion</p>
            <span className="check-pop mt-2 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1.5 text-[11px] font-bold text-ink uppercase">
              <Check className="size-3.5" aria-hidden /> Complete
            </span>
          </div>
          <div className="surface p-4">
            <p className="eyebrow text-muted-foreground">Achievement</p>
            <span className="pr-pop mt-2 inline-flex items-center gap-1 rounded-full bg-acid px-3 py-1.5 text-[11px] font-bold text-ink uppercase">
              New PR <span className="pr-bolt">⚡</span>
            </span>
          </div>
          <div className="surface p-4">
            <p className="eyebrow text-muted-foreground">Information</p>
            <div className="mt-2 rounded-lg bg-ice p-3">
              <p className="eyebrow text-ink/70">Rest</p>
              <p className="font-display text-xl text-ink">01:30</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
