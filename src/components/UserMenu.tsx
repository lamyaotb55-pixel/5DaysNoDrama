import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  LayoutDashboard,
  History,
  LayoutList,
  LineChart,
  LogIn,
  LogOut,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { checkIsAdmin } from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";
import { displayNameOf, initialsOf, useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import { UnitSwitch } from "./UnitSwitch";
import { RestSettings } from "./RestSettings";

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const name = displayNameOf(user);
  const [isAdmin, setIsAdmin] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let alive = true;
    checkIsAdmin().then((ok) => alive && setIsAdmin(ok));
    return () => {
      alive = false;
    };
  }, [user]);

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
        aria-label={t("menu.account")}
        className="fixed top-5 end-4 z-40 grid size-11 place-items-center rounded-full border border-border bg-card text-xs font-bold uppercase shadow-sm"
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
            aria-label={t("menu.close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="absolute top-0 end-0 h-full w-[82%] max-w-xs border-s border-border bg-card px-5 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow text-spicy">
                  {isAuthenticated ? t("menu.signedIn") : t("menu.guest")}
                </p>
                <p className="mt-1 text-xl leading-tight">
                  {isAuthenticated ? name : t("menu.noAccount")}
                </p>
                {isAuthenticated && user?.email && (
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground uppercase">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="grid size-9 place-items-center rounded-full bg-secondary"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-secondary px-4 py-3">
              <UnitSwitch />
              <div className="mt-3 border-t border-border pt-3">
                <RestSettings />
              </div>
            </div>

            <nav className="mt-4 space-y-2.5">
              {isAuthenticated ? (
                <MenuLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  icon={<UserIcon className="size-4" aria-hidden />}
                >
                  {t("menu.profile")}
                </MenuLink>
              ) : (
                <MenuLink
                  to="/auth"
                  onClick={() => setOpen(false)}
                  icon={<LogIn className="size-4" aria-hidden />}
                >
                  {t("menu.signIn")}
                </MenuLink>
              )}
              <MenuLink
                to="/progress"
                onClick={() => setOpen(false)}
                icon={<LineChart className="size-4" aria-hidden />}
              >
                {t("menu.progress")}
              </MenuLink>
              <MenuLink
                to="/history"
                onClick={() => setOpen(false)}
                icon={<History className="size-4" aria-hidden />}
              >
                {t("menu.history")}
              </MenuLink>
              <MenuLink
                to="/my-plans"
                onClick={() => setOpen(false)}
                icon={<LayoutList className="size-4" aria-hidden />}
              >
                {t("menu.myPlans")}
              </MenuLink>
              <MenuLink
                to="/plans-by-you"
                onClick={() => setOpen(false)}
                icon={<Users className="size-4" aria-hidden />}
              >
                {t("menu.plansByYou")}
              </MenuLink>
              {isAdmin && (
                <MenuLink
                  to="/admin/dashboard"
                  onClick={() => setOpen(false)}
                  icon={<LayoutDashboard className="size-4" aria-hidden />}
                >
                  {t("dash.title")}
                </MenuLink>
              )}
              {isAdmin && (
                <MenuLink
                  to="/admin/review"
                  onClick={() => setOpen(false)}
                  icon={<ClipboardCheck className="size-4" aria-hidden />}
                >
                  {t("menu.review")}
                </MenuLink>
              )}
            </nav>

            {isAuthenticated && (
              <button
                type="button"
                onClick={signOut}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-bold uppercase"
              >
                <LogOut className="size-4" aria-hidden /> {t("menu.signOut")}
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
  to:
    | "/profile"
    | "/progress"
    | "/history"
    | "/auth"
    | "/my-plans"
    | "/plans-by-you"
    | "/admin/review"
    | "/admin/dashboard";
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
