import { Play } from "lucide-react";

const isVideo = (src: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(src);

/** YouTube search for a form demo of the movement — used when no custom media is set. */
const demoUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

/**
 * Exercise demonstration slot. Plays a custom image/GIF/video when one is set,
 * otherwise links out to a form demo of the movement.
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

  if (src) {
    return (
      <div className={frame + " bg-secondary"} role="img" aria-label={`${name} demonstration`}>
        {isVideo(src) ? (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <img
            src={src}
            alt={`${name} demonstration`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </div>
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
