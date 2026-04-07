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
import { useState } from "react";

const navLinks = [
  { href: "/app/dashboard", label: "Home", icon: Home },
  { href: "/app/membership", label: "My Membership", icon: Crown },
  { href: "/app/content", label: "My Content", icon: PlaySquare },
  { href: "/app/purchases", label: "My Purchases", icon: ShoppingBag },
  { href: "/app/bookings", label: "My Bookings", icon: Calendar },
  { href: "/app/profile", label: "My Profile", icon: User },
];

export function UserNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-[240px] border-r"
        style={{ background: "#0c090a", borderColor: "rgba(255,255,255,0.055)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)", boxShadow: "0 2px 14px rgba(177,18,38,0.40)" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold font-display tracking-tight text-stone-100 leading-none">
              Serene Studio
            </h1>
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold mt-1" style={{ color: "rgba(232,160,168,0.70)" }}>
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
                style={isActive ? {
                  background: "linear-gradient(135deg, rgba(122,12,28,0.22) 0%, rgba(122,12,28,0.08) 100%)",
                  borderLeft: "2px solid #b11226",
                  paddingLeft: "10px",
                  color: "#e8a0a8",
                  fontWeight: 600,
                } : { color: "#8a7f78" }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#f5ede6"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#8a7f78"; }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: isActive ? "#e8a0a8" : undefined, opacity: isActive ? 1 : 0.7 }} />
                <span>{link.label}</span>
                {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#b11226" }} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group cursor-default"
            style={{ background: "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs" style={{ background: "rgba(122,12,28,0.35)", color: "#e8a0a8" }}>
                {getInitials(session?.user?.name || session?.user?.email || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-100 truncate leading-tight">
                {session?.user?.name || "Member"}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: "#8a7f78" }}>{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
              style={{ color: "#8a7f78" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f5ede6"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8a7f78"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md border-b"
        style={{ background: "rgba(15, 11, 10, 0.92)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)" }}>
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold font-display text-sm text-foreground">Serene Studio</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: "transparent" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 backdrop-blur-sm pt-16" style={{ background: "rgba(15,11,10,0.97)" }}>
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                  )}
                  style={isActive ? {
                    background: "rgba(122,12,28,0.20)",
                    color: "#e8a0a8",
                    borderLeft: "2px solid #b11226",
                    paddingLeft: "14px",
                  } : { color: "#8a7f78" }}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 mt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium w-full text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
