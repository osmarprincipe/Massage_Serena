"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  UserCircle,
  Crown,
  PlaySquare,
  Building2,
  Bot,
  LogOut,
  Sparkles,
  Shield,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  {
    section: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    section: "Clients & Bookings",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: BookOpen },
      { href: "/admin/clients", label: "Clients", icon: Users },
    ],
  },
  {
    section: "Members",
    items: [
      { href: "/admin/users", label: "Users", icon: UserCircle },
      { href: "/admin/memberships", label: "Memberships", icon: Crown },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/content", label: "Content Library", icon: PlaySquare },
    ],
  },
  {
    section: "Settings",
    items: [
      { href: "/admin/business-info", label: "Business Info", icon: Building2 },
      { href: "/admin/bot-settings", label: "Bot Settings", icon: Bot },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-[260px] border-r"
      style={{ background: "#0f0b0a", borderColor: "rgba(255,255,255,0.05)" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #7a0c1c 0%, #b11226 100%)", boxShadow: "0 2px 14px rgba(177,18,38,0.40)" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold font-display tracking-tight text-stone-100 leading-none">
            Serene Studio
          </h1>
          <div className="flex items-center gap-1 mt-1">
            <Shield className="h-2.5 w-2.5" style={{ color: "rgba(232,160,168,0.70)" }} />
            <p className="text-[10px] uppercase tracking-[0.1em] font-semibold" style={{ color: "rgba(232,160,168,0.70)" }}>
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((section) => (
          <div key={section.section} className="mb-5">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(138,127,120,0.55)" }}>
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 font-medium",
                      isActive
                        ? "font-semibold"
                        : "hover:bg-white/[0.06]"
                    )}
                    style={isActive ? {
                      background: "linear-gradient(135deg, rgba(122,12,28,0.22) 0%, rgba(122,12,28,0.08) 100%)",
                      borderLeft: "2px solid #b11226",
                      paddingLeft: "10px",
                      color: "#e8a0a8",
                    } : { color: "#8a7f78" }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#f5ede6"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#8a7f78"; }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: isActive ? "#e8a0a8" : undefined, opacity: isActive ? 1 : 0.7 }}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#b11226" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
              {getInitials(session?.user?.name || session?.user?.email || "A")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight text-stone-100">
              {session?.user?.name || "Admin"}
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
  );
}
