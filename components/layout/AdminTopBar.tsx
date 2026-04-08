"use client";

import { usePathname } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import Link from "next/link";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/admin/dashboard":     { title: "Dashboard",       description: "Studio overview & insights" },
  "/admin/calendar":      { title: "Calendar",         description: "Session schedule" },
  "/admin/bookings":      { title: "Bookings",         description: "Manage appointments" },
  "/admin/clients":       { title: "Clients",          description: "Client profiles" },
  "/admin/users":         { title: "Users",            description: "Accounts & memberships" },
  "/admin/memberships":   { title: "Memberships",      description: "Subscription plans" },
  "/admin/content":       { title: "Content Library",  description: "Media & materials" },
  "/admin/business-info": { title: "Business Info",    description: "Studio settings" },
  "/admin/bot-settings":  { title: "Bot Settings",     description: "AI assistant" },
};

const quickActions: Record<string, { label: string; href: string } | null> = {
  "/admin/bookings":    { label: "New Booking", href: "/admin/bookings?new=true" },
  "/admin/clients":     { label: "New Client",  href: "/admin/clients?new=true" },
  "/admin/content":     { label: "New Content", href: "/admin/content?new=true" },
  "/admin/users":       { label: "New User",    href: "/admin/users?new=true" },
  "/admin/memberships": { label: "New Plan",    href: "/admin/memberships?new=true" },
};

interface AdminTopBarProps {
  onMenuClick?: () => void;
}

export function AdminTopBar({ onMenuClick }: AdminTopBarProps) {
  const pathname = usePathname();
  const page = pageTitles[pathname];
  const quickAction = quickActions[pathname];

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 backdrop-blur-md border-b"
      style={{
        height: "var(--topbar-height)",
        background: "rgba(12, 9, 8, 0.88)",
        borderColor: "rgba(255,255,255,0.055)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Mobile hamburger */}
      <button
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-all duration-150 shrink-0"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {page && (
          <>
            <h2
              className="text-[15px] font-semibold text-foreground truncate leading-tight"
              style={{ letterSpacing: "-0.012em" }}
            >
              {page.title}
            </h2>
            <p
              className="text-[11px] text-muted-foreground hidden sm:block mt-0.5"
              style={{ opacity: 0.70 }}
            >
              {page.description}
            </p>
          </>
        )}
      </div>

      {/* Quick action */}
      {quickAction && (
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={quickAction.href}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.97]"
            style={{
              background: "linear-gradient(160deg, #7a0c1c 0%, #5c0815 55%, #3d0510 100%)",
              color: "#f5ede6",
              boxShadow: "0 2px 12px rgba(122,12,28,0.38), inset 0 1px 0 rgba(255,255,255,0.08)",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "translateY(-1px)";
              el.style.filter = "brightness(1.18)";
              el.style.boxShadow =
                "0 5px 22px rgba(177,18,38,0.48), inset 0 1px 0 rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "";
              el.style.filter = "";
              el.style.boxShadow =
                "0 2px 12px rgba(122,12,28,0.38), inset 0 1px 0 rgba(255,255,255,0.08)";
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{quickAction.label}</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      )}
    </header>
  );
}
