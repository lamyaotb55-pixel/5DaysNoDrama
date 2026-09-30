import { useMemo, useSyncExternalStore } from "react";
import { en } from "./i18n/en";
import { ar } from "./i18n/ar";
import { CONTENT_AR } from "./i18n/content-ar";

/* ---------- Language: English / Arabic ----------
 * The server always renders English. On the client the saved choice (or the
 * phone's language on a first visit) is applied right after hydration; an
 * inline head script sets dir/lang early and hides the page for that instant. */

export type Lang = "en" | "ar";
export type Key = keyof typeof en;
type Params = Record<string, string | number>;

export const LANG_STORAGE_KEY = "fdnd-lang";
const DICTS: Record<Lang, Record<string, string>> = { en, ar };

let lang: Lang = "en";
let initialised = false;
const listeners = new Set<() => void>();

function detect(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    /* storage blocked */
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return prefs.some((l) => /^ar\b/i.test(l ?? "")) ? "ar" : "en";
}

function applyToDocument() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
  root.classList.remove("lang-pending");
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  lang = detect();
  applyToDocument();
}

function subscribe(cb: () => void) {
  init();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getLang(): Lang {
  init();
  return lang;
}

/** Switch language everywhere and remember it on this device. */
export function applyLang(next: Lang) {
  init();
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    /* storage blocked */
  }
  if (next === lang) return;
  lang = next;
  applyToDocument();
  listeners.forEach((l) => l());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    subscribe,
    () => lang,
    () => "en",
  );
}

/* In right-to-left text, "8–10" and "2 × 12" would display reversed ("10–8").
 * Isolating each numeric range keeps it in reading order. */
const NUMERIC_RUN = /\d[\d.,]*(?:\s*[–×x]\s*\d[\d.,]*)+/g;
export const isolateNumbers = (text: string) =>
  text.replace(NUMERIC_RUN, (m) => `\u2066${m}\u2069`);

function fill(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Translate a UI phrase. `{name}` placeholders are filled from params. */
export function translate(l: Lang, key: Key, params?: Params): string {
  const text = fill(DICTS[l][key] ?? en[key] ?? key, params);
  return l === "ar" ? isolateNumbers(text) : text;
}

/**
 * Translate a phrase that depends on a count. Looks for `key_one`, `key_two`,
 * `key_few`… (Arabic has six plural forms) and falls back to `key_other`.
 */
export function translatePlural(l: Lang, key: string, count: number, params?: Params): string {
  const rule = new Intl.PluralRules(l === "ar" ? "ar" : "en").select(count);
  const dict = DICTS[l];
  const text =
    (count === 0 ? dict[`${key}_zero`] : undefined) ??
    dict[`${key}_${rule}`] ??
    dict[`${key}_other`] ??
    en[`${key}_${rule}` as Key] ??
    en[`${key}_other` as Key] ??
    key;
  const out = fill(text, { count, ...params });
  return l === "ar" ? isolateNumbers(out) : out;
}

/** Plan content (plan names, day titles, exercise names…) written in English. */
export function translateContent(l: Lang, text: string): string {
  if (l !== "ar" || !text) return text;
  const hit = CONTENT_AR[text] ?? CONTENT_AR[text.trim()];
  if (hit) return isolateNumbers(hit);
  // Bylines on followed plans: "By Sara" → "من Sara".
  if (text.startsWith("By ")) return `من ${text.slice(3)}`;
  return text;
}

/** Intl locale: Arabic with Western digits (1 2 3), per the brand choice. */
export const localeOf = (l: Lang) => (l === "ar" ? "ar-u-nu-latn" : "en-US");

export function useT() {
  const l = useLang();
  return useMemo(() => {
    const t = (key: Key, params?: Params) => translate(l, key, params);
    t.lang = l;
    t.plural = (key: string, count: number, params?: Params) =>
      translatePlural(l, key, count, params);
    t.c = (text: string) => translateContent(l, text);
    t.num = (n: number) => n.toLocaleString(localeOf(l));
    t.date = (d: number | string | Date, opts?: Intl.DateTimeFormatOptions) =>
      new Date(d).toLocaleDateString(localeOf(l), opts);
    return t;
  }, [l]);
}

export type T = ReturnType<typeof useT>;

/** Runs in <head> before first paint: sets direction early and hides the swap. */
export const EARLY_LANG_SCRIPT = `(function(){try{var s=localStorage.getItem("${LANG_STORAGE_KEY}");var l=s==="ar"||s==="en"?s:((navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language]).some(function(x){return /^ar(-|$)/i.test(x||"")})?"ar":"en");if(l==="ar"){var h=document.documentElement;h.lang="ar";h.dir="rtl";h.classList.add("lang-pending");}}catch(e){}})();`;

/**
 * PR lines are stored in English and kg ("Hip Thrust — 60 kg × 8"); show them in
 * the reader's language and weight unit.
 */
export function prText(t: T, pr: string, w?: { fmt: (kg: number) => string }): string {
  const m = /^(.*) — ([\d.]+) kg × (\d+)$/.exec(pr);
  if (!m) return t.c(pr);
  const weight = w ? w.fmt(Number(m[2])) : `${m[2]} ${t("unit.kg")}`;
  return `${t.c(m[1]!)} — ${weight} × ${m[3]}`;
}
