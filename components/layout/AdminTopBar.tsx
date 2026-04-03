"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/admin/dashboard": { title: "Dashboard", description: "Welcome back" },
  "/admin/calendar": { title: "Calendar", description: "Manage your schedule" },
  "/admin/bookings": { title: "Bookings", description: "Manage appointments" },
  "/admin/clients": { title: "Clients", description: "Client management" },
  "/admin/users": { title: "Users", description: "User accounts & memberships" },
  "/admin/memberships": { title: "Memberships", description: "Subscription plans" },
  "/admin/content": { title: "Content Library", description: "Manage your content" },
  "/admin/business-info": { title: "Business Info", description: "Studio settings" },
  "/admin/bot-settings": { title: "Bot Settings", description: "AI assistant configuration" },
};

const quickActions: Record<string, { label: string; href: string } | null> = {
  "/admin/bookings": { label: "New Booking", href: "/admin/bookings?new=true" },
  "/admin/clients": { label: "New Client", href: "/admin/clients?new=true" },
  "/admin/content": { label: "New Content", href: "/admin/content?new=true" },
};

export function AdminTopBar() {
  const pathname = usePathname();
  const page = pageTitles[pathname];
  const quickAction = quickActions[pathname];

  if (!page) return null;

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6 backdrop-blur-md border-b"
      style={{ background: "rgba(15, 11, 10, 0.85)", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex-1 min-w-0">
        <h2 className="text-[15px] font-semibold text-foreground truncate tracking-[-0.01em] leading-tight">{page.title}</h2>
        <p className="text-[11px] text-muted-foreground hidden sm:block mt-0.5">{page.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: "transparent" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-wine-700" />
        </button>
        {quickAction && (
          <Button size="sm" asChild>
            <Link href={quickAction.href}>
              <Plus className="h-3.5 w-3.5" />
              {quickAction.label}
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
