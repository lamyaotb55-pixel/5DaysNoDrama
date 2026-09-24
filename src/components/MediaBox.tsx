import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import { defaultMedia } from "@/lib/media";

const isVideo = (src: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(src);

/** YouTube search for a form demo of the movement — used when no media exists. */
const demoUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

function Media({ src, name, className }: { src: string; name: string; className: string }) {
  return isVideo(src) ? (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={`${name} demonstration`}
      className={className}
    />
  ) : (
    <img src={src} alt={`${name} demonstration`} loading="lazy" className={className} />
  );
}

/**
 * Exercise demonstration slot. Plays the exercise's image/GIF/video (custom or
 * built-in); tap to enlarge. Without media it links out to a form demo.
 */
export function MediaBox({
  name,
  compact = false,
  src,
}: {
  name: string;
  compact?: boolean;
  src?: string | undefined;
}) {
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
    (compact ? "aspect-square" : "aspect-[4/3]");

  if (media) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={frame + " bg-white"}
          aria-label={`Show ${name} demonstration`}
        >
          <Media src={media} name={name} className="absolute inset-0 size-full object-contain" />
        </button>
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} demonstration`}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white"
            >
              <Media src={media} name={name} className="aspect-square w-full object-contain" />
              <p className="px-4 pb-4 text-center font-display text-lg uppercase">{name}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-secondary"
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
      aria-label={`Watch a ${name} demo`}
      title={`Watch a ${name} demo`}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl text-ink/25">{initials}</span>
      </span>
      {!compact && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[9px] font-bold text-ink uppercase">
          <Play className="size-2.5" aria-hidden /> Demo
        </span>
      )}
    </a>
  );
}
