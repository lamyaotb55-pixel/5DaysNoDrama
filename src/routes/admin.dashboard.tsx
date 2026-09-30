import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { adminStats, checkIsAdmin, errorText, goalName, type AdminStats } from "@/lib/community";
import { useT, type T } from "@/lib/i18n";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — 5 Days No Drama" }, { name: "robots", content: "noindex" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const t = useT();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      setStats(await adminStats());
    } catch (e) {
      setError(t.c(errorText(e)));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setAdmin(false);
      return;
    }
    let alive = true;
    checkIsAdmin().then((ok) => {
      if (!alive) return;
      setAdmin(ok);
      if (ok) void load();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (admin === null) {
    return (
      <main className="mx-auto max-w-2xl px-5 pt-24">
        <p className="surface p-5 text-sm text-muted-foreground">{t("admin.checking")}</p>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-5">
        <div className="surface p-8 text-center">
          <h1 className="text-2xl">{t("admin.teamOnly")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {user ? t("dash.cantView") : t("dash.signIn")}
          </p>
          <Link
            to={user ? "/" : "/auth"}
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {user ? t("common.home") : t("common.signIn")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <div className="flex items-center justify-between gap-3 pt-6 pe-40">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("common.home")}
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3 pt-8 pb-6">
        <div>
          <p className="eyebrow text-spicy">{t("admin.eyebrow")}</p>
          <h1 className="mt-2 text-4xl leading-[0.9]">{t("dash.title")}</h1>
          {stats && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              {t("dash.updated", {
                time: new Date(stats.generatedAt).toLocaleTimeString(
                  t.lang === "ar" ? "ar-u-nu-latn" : "en-US",
                  { hour: "numeric", minute: "2-digit" },
                ),
              })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/review"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
          >
            <ClipboardCheck className="size-3.5 text-spicy" aria-hidden /> {t("menu.review")}
            {stats && stats.community.waiting > 0 && (
              <span className="rounded-full bg-spicy px-1.5 text-[10px] text-paper tabular-nums">
                {stats.community.waiting}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase disabled:opacity-50"
          >
            <RefreshCw className={"size-3.5 " + (busy ? "animate-spin" : "")} aria-hidden />
            {t("dash.refresh")}
          </button>
        </div>
      </header>

      {error && <p className="surface mb-4 p-4 text-sm font-semibold text-spicy">{error}</p>}
      {!stats && !error && (
        <p className="surface p-5 text-sm text-muted-foreground">{t("dash.loading")}</p>
      )}

      {stats && (
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile
              label={t("dash.users")}
              value={stats.users.total}
              sub={t("dash.newThisWeek", { n: stats.users.new7 })}
            />
            <Tile
              label={t("dash.active7")}
              value={stats.activity.active7}
              sub={t("dash.active30", { n: stats.activity.active30 })}
            />
            <Tile
              label={t("dash.workouts7")}
              value={stats.activity.workouts7}
              sub={t("dash.allTime", { n: t.num(stats.activity.workoutsTotal) })}
            />
            <Tile
              label={t("dash.finished")}
              value={stats.activity.finished8Weeks}
              sub={t("dash.finishedSub")}
            />
          </section>

          <section className="surface p-5">
            <h2 className="text-xl">{t("dash.perDay")}</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {t("dash.perDaySub")}
            </p>
            <DayBars t={t} data={stats.activity.perDay} />
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <section className="surface p-5">
              <h2 className="text-xl">{t("dash.accounts")}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row
                  label={t("dash.confirmed")}
                  value={`${stats.users.confirmed}/${stats.users.total}`}
                />
                <Row label={t("dash.viaGoogle")} value={String(stats.users.google)} />
                <Row label={t("dash.signedIn7")} value={String(stats.users.signedIn7)} />
                <Row label={t("dash.new30")} value={String(stats.users.new30)} />
                <Row label={t("dash.withProgress")} value={String(stats.users.withProgress)} />
              </dl>
            </section>

            <section className="surface p-5">
              <h2 className="text-xl">{t("menu.plansByYou")}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={t("dash.livePlans")} value={String(stats.community.live)} />
                <Row label={t("dash.waiting")} value={String(stats.community.waiting)} />
                <Row label={t("dash.follows")} value={String(stats.community.follows)} />
              </dl>
            </section>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Breakdown
              t={t}
              title={t("dash.currentPlan")}
              data={stats.plans}
              label={(k) =>
                k === "custom"
                  ? t("dash.customPlan")
                  : k === "none"
                    ? t("dash.noPlan")
                    : t.c(goalName(k))
              }
            />
            <Breakdown
              t={t}
              title={t("lang.switch")}
              data={stats.language}
              label={(k) => (k === "ar" ? "عربي" : k === "en" ? "English" : t("dash.notSet"))}
            />
            <Breakdown
              t={t}
              title={t("unit.switch")}
              data={stats.unit}
              label={(k) => (k === "lb" ? t("unit.lb") : t("unit.kg"))}
            />
          </div>

          <section className="surface p-5">
            <h2 className="text-xl">{t("dash.recent")}</h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {t("dash.recentSub")}
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-start text-sm">
                <thead>
                  <tr className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    <th className="py-2 pe-3 text-start">{t("dash.colUser")}</th>
                    <th className="py-2 pe-3 text-start">{t("dash.colJoined")}</th>
                    <th className="py-2 pe-3 text-start">{t("dash.colLastIn")}</th>
                    <th className="py-2 pe-3 text-end">{t("prog.workouts")}</th>
                    <th className="py-2 text-start">{t("dash.colLastWorkout")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((r) => (
                    <tr key={r.email} className="border-t border-border align-top">
                      <td className="py-2.5 pe-3">
                        <span className="block font-semibold">{r.name}</span>
                        <span dir="ltr" className="block text-xs text-muted-foreground">
                          {r.email}
                          {r.provider === "google" ? " · Google" : ""}
                        </span>
                      </td>
                      <td className="py-2.5 pe-3 whitespace-nowrap">{t.date(r.created_at)}</td>
                      <td className="py-2.5 pe-3 whitespace-nowrap">
                        {r.last_sign_in_at ? t.date(r.last_sign_in_at) : "—"}
                      </td>
                      <td className="py-2.5 pe-3 text-end font-semibold tabular-nums">
                        {r.workouts}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        {r.last_workout ? t.date(r.last_workout) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">{t("dash.guestNote")}</p>
        </div>
      )}
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="surface p-4">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

/** Workouts per day, last 14 days: one series, so one hue and no legend. */
function DayBars({ t, data }: { t: T; data: { day: string; workouts: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.workouts));
  const total = data.reduce((n, d) => n + d.workouts, 0);
  const label = (day: string) =>
    new Date(day + "T12:00:00").toLocaleDateString(t.lang === "ar" ? "ar-u-nu-latn" : "en-US", {
      day: "numeric",
      month: "short",
    });
  return (
    <figure className="mt-4">
      <div
        dir="ltr"
        className="relative flex h-40 items-end gap-[2px] border-b border-border"
        role="img"
        aria-label={t("dash.chartLabel", { n: total })}
      >
        <span className="absolute -top-1 left-0 text-[10px] font-semibold text-muted-foreground tabular-nums">
          {max}
        </span>
        {data.map((d) => (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 items-end"
            title={`${label(d.day)}: ${d.workouts}`}
          >
            <div
              className="w-full rounded-t-[4px] bg-spicy transition-opacity group-hover:opacity-80"
              style={{
                height: d.workouts ? `${(d.workouts / max) * 100}%` : "2px",
                opacity: d.workouts ? 1 : 0.25,
              }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-paper group-hover:block">
              {label(d.day)} · {d.workouts}
            </span>
          </div>
        ))}
      </div>
      <div
        dir="ltr"
        className="mt-1.5 flex justify-between text-[10px] font-semibold text-muted-foreground"
      >
        <span>{data[0] ? label(data[0].day) : ""}</span>
        <span>{data.length ? label(data[data.length - 1]!.day) : ""}</span>
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer font-bold text-muted-foreground uppercase">
          {t("dash.showTable")}
        </summary>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {data.map((d) => (
              <tr key={d.day} className="border-t border-border">
                <td className="py-1">{label(d.day)}</td>
                <td className="py-1 text-end font-semibold tabular-nums">{d.workouts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function Breakdown({
  t,
  title,
  data,
  label,
}: {
  t: T;
  title: string;
  data: Record<string, number>;
  label: (key: string) => string;
}) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((n, [, v]) => n + v, 0) || 1;
  return (
    <section className="surface p-5">
      <h2 className="text-lg">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("dash.noData")}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map(([k, v]) => (
            <li key={k}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-semibold">{label(k)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {v} · {Math.round((v / total) * 100)}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-ice"
                  style={{ width: `${(v / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
