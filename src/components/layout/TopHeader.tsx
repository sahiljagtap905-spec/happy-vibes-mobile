import { Link } from "@tanstack/react-router";
import { Bell, Leaf, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function TopHeader() {
  const { user } = useAuth();
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-screen-sm items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">Inventory Pulse</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted active:scale-95"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            to="/profile"
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            {user ? initial : <User className="h-4 w-4" />}
          </Link>
        </div>
      </div>
    </header>
  );
}
