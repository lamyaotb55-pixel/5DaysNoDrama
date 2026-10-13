import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bug, Lightbulb, MessageCircle } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { errorText } from "@/lib/community";
import {
  MESSAGE_KINDS,
  MESSAGE_MAX,
  MESSAGE_MIN,
  sendSupportMessage,
  type MessageKind,
} from "@/lib/support";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact & Suggestions — 5 Days No Drama" }],
  }),
  component: ContactPage,
});

const KIND_ICON = {
  idea: Lightbulb,
  problem: Bug,
  other: MessageCircle,
} satisfies Record<MessageKind, unknown>;

function ContactPage() {
  const t = useT();
  const { user, loading } = useAuth();
  const [kind, setKind] = useState<MessageKind>("idea");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < MESSAGE_MIN) {
      setError(t("contact.tooShort", { n: MESSAGE_MIN }));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendSupportMessage({ data: { kind, body, lang: t.lang } });
      setSent(true);
      setBody("");
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "";
      if (/Daily limit/i.test(msg)) setError(t("contact.limit"));
      else if (/Confirm your email/i.test(msg)) setError(t("contact.confirmFirst"));
      else setError(t.c(errorText(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-6 pe-40">
        <Link to="/" className="text-xs font-bold text-muted-foreground uppercase">
          <span className="inline-block rtl:-scale-x-100">←</span> {t("common.home")}
        </Link>
      </div>
      <header className="pt-8 pb-6">
        <p className="eyebrow text-spicy">{t("contact.eyebrow")}</p>
        <h1 className="mt-3 text-4xl leading-[0.9]">{t("contact.title")}</h1>
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{t("contact.lede")}</p>
      </header>

      {loading ? null : !user ? (
        <div className="surface p-6 text-center">
          <h2 className="text-xl">{t("contact.signInTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.signInBody")}</p>
          <Link
            to="/auth"
            className="mt-5 inline-flex rounded-full bg-spicy px-5 py-3 text-xs font-bold text-accent-foreground uppercase"
          >
            {t("menu.signIn")}
          </Link>
        </div>
      ) : sent ? (
        <div className="surface p-6 text-center" role="status">
          <h2 className="text-2xl">{t("contact.sentTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("contact.sentBody")}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setSent(false)}
              className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-xs font-bold uppercase"
            >
              {t("contact.another")}
            </button>
            <Link
              to="/"
              className="flex-1 rounded-full bg-spicy px-4 py-3 text-xs font-bold text-accent-foreground uppercase"
            >
              {t("common.home")}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="surface space-y-5 p-5">
          <fieldset>
            <legend className="text-xs font-bold uppercase">{t("contact.kind")}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MESSAGE_KINDS.map((k) => {
                const Icon = KIND_ICON[k];
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setKind(k)}
                    className={
                      "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-bold uppercase " +
                      (on ? "border-spicy bg-spicy text-accent-foreground" : "border-border bg-card")
                    }
                  >
                    <Icon className="size-5" aria-hidden />
                    {t(`contact.kind.${k}`)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="contact-body" className="text-xs font-bold uppercase">
              {t("contact.message")}
            </label>
            <textarea
              id="contact-body"
              rows={6}
              maxLength={MESSAGE_MAX}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setError(null);
              }}
              placeholder={t(`contact.placeholder.${kind}`)}
              className="mt-2 w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 flex justify-between gap-3 text-[11px] font-semibold text-muted-foreground">
              <span>
                {t("contact.replyTo")}{" "}
                <span dir="ltr">{user.email}</span>
              </span>
              <span className="tabular-nums" dir="ltr">
                {body.length}/{MESSAGE_MAX}
              </span>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-spicy uppercase">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-spicy px-5 py-3.5 text-sm font-bold tracking-wide text-accent-foreground uppercase disabled:opacity-60"
          >
            {busy ? t("contact.sending") : t("contact.send")}
          </button>
        </form>
      )}
    </main>
  );
}
