import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, LineChart, LogIn, LogOut, User as UserIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { displayNameOf, initialsOf, useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const name = displayNameOf(user);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Account menu"
        className="fixed top-5 right-4 z-40 grid size-11 place-items-center rounded-full border border-border bg-card text-xs font-bold uppercase shadow-sm"
      >
        {isAuthenticated ? (
          <span className="text-spicy">{initialsOf(name)}</span>
        ) : (
          <UserIcon className="size-5 text-ink" aria-hidden />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="absolute top-0 right-0 h-full w-[82%] max-w-xs border-l border-border bg-card px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-spicy">{isAuthenticated ? "Signed in" : "Guest"}</p>
                <p className="mt-1 text-xl leading-tight">{isAuthenticated ? name : "No account yet"}</p>
                {isAuthenticated && user?.email && (
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground uppercase">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full bg-secondary"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <nav className="mt-7 space-y-2.5">
              {isAuthenticated ? (
                <MenuLink to="/profile" onClick={() => setOpen(false)} icon={<UserIcon className="size-4" aria-hidden />}>
                  Profile
                </MenuLink>
              ) : (
                <MenuLink to="/auth" onClick={() => setOpen(false)} icon={<LogIn className="size-4" aria-hidden />}>
                  Register / Sign in
                </MenuLink>
              )}
              <MenuLink to="/progress" onClick={() => setOpen(false)} icon={<LineChart className="size-4" aria-hidden />}>
                Progress
              </MenuLink>
              <MenuLink to="/history" onClick={() => setOpen(false)} icon={<History className="size-4" aria-hidden />}>
                History
              </MenuLink>
            </nav>

            {isAuthenticated && (
              <button
                type="button"
                onClick={signOut}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-bold uppercase"
              >
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function MenuLink({
  to,
  icon,
  children,
  onClick,
}: {
  to: "/profile" | "/progress" | "/history" | "/auth";
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3.5 text-sm font-bold uppercase"
    >
      <span className="text-spicy">{icon}</span>
      {children}
    </Link>
  );
}
