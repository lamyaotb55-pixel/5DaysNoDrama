import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bug, Check, Lightbulb, Mail, MessageCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin, errorText } from "@/lib/community";
import { adminMessages, setMessageDone, type SupportMessage } from "@/lib/support";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [{ title: "Messages — 5 Days No Drama" }, { name: "robots", content: "noindex" }],
  }),
  component: MessagesPage,
});

const KIND_ICON: Record<string, typeof Lightbulb> = {
  idea: Lightbulb,
  problem: Bug,
  other: MessageCircle,
};

type Filter = "new" | "done" | "all";

function MessagesPage() {
  const { user, loading } = useAuth();
  const t = useT();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<SupportMessage[]>([]);
  const [filter, setFilter] = useState<Filter>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy("load");
    setError(null);
    try {
      setRows(await adminMessages());
    } catch (e) {
      setError(t.c(errorText(e)));
    } finally {
      setBusy(null);
    }
  }, [t]);

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

  const toggle = async (m: SupportMessage) => {
    setBusy(m.id);
    setError(null);
    try {
      const done = m.status !== "done";
      await setMessageDone(m.id, done);
      setRows((rs) =>
        rs.map((r) =>
          r.id === m.id
            ? { ...r, status: done ? "done" : "new", done_at: done ? new Date().toISOString() : null }
            : r,
        ),
      );
    } catch (e) {
      setError(t.c(errorText(e)));
    } finally {
      setBusy(null);
    }
  };

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
            {user ? t("msgs.noAccess") : t("msgs.signInAdmin")}
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

  const counts = {
    new: rows.filter((r) => r.status !== "done").length,
    done: rows.filter((r) => r.status === "done").length,
    all: rows.length,
  };
  const shown = rows.filter((r) =>
    filter === "all" ? true : filter === "done" ? r.status === "done" : r.status !== "done",
  );

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16">
      <div className="pt-6 pe-40">
        <Link to="/admin/dashboard" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("dash.title")}
        </Link>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-3 pt-8 pb-6">
        <div>
          <p className="eyebrow text-spicy">{t("admin.eyebrow")}</p>
          <h1 className="mt-2 text-4xl leading-[0.9]">{t("msgs.title")}</h1>
          <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("msgs.lede")}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase disabled:opacity-50"
        >
          <RefreshCw className={"size-3.5 " + (busy === "load" ? "animate-spin" : "")} aria-hidden />
          {t("dash.refresh")}
        </button>
      </header>

      <div className="mb-4 flex gap-2 rounded-full bg-secondary p-1" role="tablist">
        {(["new", "done", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={
              "flex-1 rounded-full px-3 py-2.5 text-xs font-bold uppercase " +
              (filter === f ? "bg-spicy text-accent-foreground" : "text-ink")
            }
          >
            {t(`msgs.${f}`)} <span className="tabular-nums opacity-80">{counts[f]}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="status" className="mb-4 rounded-lg bg-secondary p-3 text-sm font-semibold">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="surface p-5 text-sm text-muted-foreground">
          {busy === "load" ? t("admin.checking") : t("msgs.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => {
            const Icon = KIND_ICON[m.kind] ?? MessageCircle;
            const done = m.status === "done";
            const kindLabel = ["idea", "problem", "other"].includes(m.kind)
              ? t(`contact.kind.${m.kind as "idea" | "problem" | "other"}`)
              : m.kind;
            return (
              <li key={m.id} className={"surface p-4 " + (done ? "opacity-70" : "")}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 " +
                      (m.kind === "problem" ? "bg-spicy/15 text-spicy" : "bg-ice/40 text-ink")
                    }
                  >
                    <Icon className="size-3.5" aria-hidden /> {kindLabel}
                  </span>
                  <span className="text-muted-foreground">
                    {t.date(m.created_at, {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {m.lang === "ar" && (
                    <span className="text-muted-foreground">· {t("msgs.inArabic")}</span>
                  )}
                  {done && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-ink">
                      <Check className="size-3" aria-hidden /> {t("msgs.done")}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold">
                  {m.name}{" "}
                  <span className="font-semibold text-muted-foreground" dir="ltr">
                    {m.email}
                  </span>
                </p>
                <p
                  className="mt-2 text-sm whitespace-pre-wrap break-words"
                  dir={m.lang === "ar" ? "rtl" : "ltr"}
                >
                  {m.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to 5 Days No Drama")}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold uppercase"
                  >
                    <Mail className="size-3.5 text-spicy" aria-hidden /> {t("msgs.reply")}
                  </a>
                  <button
                    type="button"
                    onClick={() => toggle(m)}
                    disabled={busy !== null}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold uppercase disabled:opacity-50 " +
                      (done ? "border border-border bg-card" : "bg-spicy text-accent-foreground")
                    }
                  >
                    {done ? (
                      <RotateCcw className="size-3.5" aria-hidden />
                    ) : (
                      <Check className="size-3.5" aria-hidden />
                    )}
                    {busy === m.id ? t("admin.saving") : done ? t("msgs.markNew") : t("msgs.markDone")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
