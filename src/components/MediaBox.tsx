import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { defaultMedia } from "@/lib/media";
import { useT } from "@/lib/i18n";
import { ExerciseName } from "./ExerciseName";

const isVideo = (src: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(src);

/** YouTube search for a form demo of the movement — used when no media exists. */
const demoUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

function Media({ src, name, className }: { src: string; name: string; className: string }) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);

  // Play while on screen, pause when scrolled away. Phones (iOS Low Power
  // Mode, data saver) can refuse autoplay — then show controls so the demo is
  // still one tap away.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    const play = () => v.play().catch(() => setBlocked(true));
    if (typeof IntersectionObserver === "undefined") {
      void play();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? void play() : v.pause()),
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [src]);

  return isVideo(src) ? (
    <video
      ref={ref}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      controls={blocked}
      preload="auto"
      aria-label={t("media.demoOf", { name: t.c(name) })}
      className={className}
    />
  ) : (
    <img
      src={src}
      alt={t("media.demoOf", { name: t.c(name) })}
      decoding="async"
      className={className}
    />
  );
}

/**
 * Exercise demonstration slot. Plays the exercise's image/GIF/video (custom or
 * built-in); tap to enlarge. Without media it links out to a form demo.
 */
export function MediaBox({
  name,
  compact = false,
  wide = false,
  src,
}: {
  name: string;
  compact?: boolean;
  /** Full-width banner, used at the top of each exercise card. */
  wide?: boolean;
  src?: string | undefined;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const media = src || defaultMedia(name);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initials = name
    .replace(/[^a-zA-Z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const frame =
    "group relative block w-full overflow-hidden rounded-lg " +
    (compact ? "aspect-square" : wide ? "aspect-video" : "aspect-[4/3]");

  if (media) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={frame + " bg-white"}
          aria-label={t("media.show", { name: t.c(name) })}
        >
          <Media src={media} name={name} className="absolute inset-0 size-full object-contain" />
        </button>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("media.demoOf", { name: t.c(name) })}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white"
            >
              <Media src={media} name={name} className="aspect-square w-full object-contain" />
              <p className="px-4 pb-4 text-center font-display text-lg uppercase">
                <ExerciseName name={name} />
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="absolute top-3 end-3 grid size-9 place-items-center rounded-full bg-secondary"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <a
      href={demoUrl(name)}
      target="_blank"
      rel="noopener noreferrer"
      className={frame + " bg-secondary"}
      aria-label={t("media.watch", { name: t.c(name) })}
      title={t("media.watch", { name: t.c(name) })}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl text-ink/25">{initials}</span>
      </span>
      {!compact && (
        <span className="absolute bottom-1.5 start-1.5 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[9px] font-bold text-ink uppercase">
          <Play className="size-2.5" aria-hidden /> {t("media.demo")}
        </span>
      )}
    </a>
  );
}
