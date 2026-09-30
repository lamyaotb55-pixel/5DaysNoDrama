import { setLanguage } from "@/lib/store";
import { useT } from "@/lib/i18n";

/** EN | عربي toggle, pinned next to the account button on every page. */
export function LanguageSwitch() {
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("lang.switch")}
      className="fixed top-5 end-[4.25rem] z-40 flex h-11 items-center rounded-full border border-border bg-card p-1 shadow-sm"
    >
      {(
        [
          ["en", "EN"],
          ["ar", "عربي"],
        ] as const
      ).map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={t.lang === code}
          onClick={() => setLanguage(code)}
          className={
            "h-full rounded-full px-2.5 text-[11px] font-bold " +
            (t.lang === code ? "bg-ink text-paper" : "text-muted-foreground")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
