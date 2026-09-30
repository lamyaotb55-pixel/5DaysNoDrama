import { useT } from "@/lib/i18n";

/** Exercise name in the reader's language; in Arabic the English gym name sits underneath. */
export function ExerciseName({ name, className = "" }: { name: string; className?: string }) {
  const t = useT();
  const local = t.c(name);
  return (
    <span className={className}>
      {local}
      {local !== name && (
        <span className="mt-0.5 block font-sans text-[0.72em] font-semibold tracking-normal text-muted-foreground normal-case">
          <bdi>{name}</bdi>
        </span>
      )}
    </span>
  );
}
