"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import {
  Home,
  Crown,
  PlaySquare,
  ShoppingBag,
  Calendar,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/app/dashboard",  label: "Home",          icon: Home },
  { href: "/app/content",    label: "My Content",     icon: PlaySquare },
  { href: "/app/bookings",   label: "My Bookings",    icon: Calendar },
  { href: "/app/purchases",  label: "My Purchases",   icon: ShoppingBag },
  { href: "/app/membership", label: "My Membership",  icon: Crown },
  { href: "/app/profile",    label: "My Profile",     icon: User },
];

export function UserNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ═══════════════════════════════════════════
          Desktop Sidebar — hidden on mobile
      ═══════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-[240px] border-r"
        style={{
          background: "rgba(7,3,5,0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="p-2 rounded-xl shrink-0"
            style={{
              background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)",
              boxShadow: "0 2px 14px rgba(177,18,38,0.40)",
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold font-display tracking-tight text-stone-100 leading-none">
              Serene Studio
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.1em] font-semibold mt-1"
              style={{ color: "rgba(232,160,168,0.70)" }}
            >
              Member Area
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 font-medium",
                  !isActive && "hover:bg-white/[0.06]"
                )}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(122,12,28,0.22) 0%, rgba(122,12,28,0.08) 100%)",
                        borderLeft: "2px solid #b11226",
                        paddingLeft: "10px",
                        color: "#e8a0a8",
                        fontWeight: 600,
                      }
                    : { color: "#8a7f78" }
                }
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.color = "#f5ede6";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.color = "#8a7f78";
                }}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: isActive ? "#e8a0a8" : undefined, opacity: isActive ? 1 : 0.7 }}
                />
                <span>{link.label}</span>
                {isActive && (
                  <div
                    className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: "#b11226" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group cursor-default"
            style={{ background: "transparent" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback
                className="text-xs"
                style={{ background: "rgba(122,12,28,0.35)", color: "#e8a0a8" }}
              >
                {getInitials(session?.user?.name || session?.user?.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-100 truncate leading-tight">
                {session?.user?.name || "Member"}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "#8a7f78" }}>
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
              style={{ color: "#8a7f78" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#f5ede6";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8a7f78";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          Mobile Top Bar — hidden on desktop
      ═══════════════════════════════════════════ */}
      <header
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b backdrop-blur-md"
        style={{
          background: "rgba(7,3,5,0.92)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg shrink-0"
            style={{ background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold font-display text-sm text-foreground">
            Serene Studio
          </span>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-150"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ═══════════════════════════════════════════
          Mobile backdrop overlay
      ═══════════════════════════════════════════ */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(2px)" }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ═══════════════════════════════════════════
          Mobile slide-in drawer
      ═══════════════════════════════════════════ */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] border-r",
          "transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "rgba(7,3,5,0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
        aria-label="Navigation menu"
      >
        {/* Drawer header with close button */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-lg shrink-0"
              style={{
                background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)",
                boxShadow: "0 2px 10px rgba(177,18,38,0.35)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold font-display tracking-tight text-stone-100 leading-none">
                Serene Studio
              </p>
              <p
                className="text-[10px] uppercase tracking-[0.1em] font-semibold mt-0.5"
                style={{ color: "rgba(232,160,168,0.65)" }}
              >
                Member Area
              </p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User identity */}
        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback
                className="text-sm"
                style={{ background: "rgba(122,12,28,0.35)", color: "#e8a0a8" }}
              >
                {getInitials(session?.user?.name || session?.user?.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-100 truncate leading-tight">
                {session?.user?.name || "Member"}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "#8a7f78" }}>
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-[15px] font-medium transition-all duration-150",
                  !isActive && "hover:bg-white/[0.05]"
                )}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(122,12,28,0.20) 0%, rgba(122,12,28,0.07) 100%)",
                        borderLeft: "2px solid #b11226",
                        paddingLeft: "12px",
                        color: "#e8a0a8",
                        fontWeight: 600,
                      }
                    : { color: "#8a7f78" }
                }
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: isActive ? "#e8a0a8" : undefined, opacity: isActive ? 1 : 0.65 }}
                />
                <span>{link.label}</span>
                {isActive && (
                  <div
                    className="ml-auto h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: "#b11226" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3.5 w-full px-3.5 py-3 rounded-xl text-[15px] font-medium transition-all duration-150 hover:bg-white/[0.05]"
            style={{ color: "#8a7f78" }}
          >
            <LogOut className="h-5 w-5 shrink-0 opacity-65" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
