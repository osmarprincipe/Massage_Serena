import * as React from "react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; style: React.CSSProperties; dot: string }> = {
  // Booking
  PENDING:   { label: "Pending",   style: { background: "rgba(120,80,10,0.25)", color: "#d4a055", border: "1px solid rgba(180,120,20,0.28)" }, dot: "#d4a055" },
  CONFIRMED: { label: "Confirmed", style: { background: "rgba(10,80,45,0.25)", color: "#4ade80", border: "1px solid rgba(20,120,70,0.28)" }, dot: "#4ade80" },
  COMPLETED: { label: "Completed", style: { background: "rgba(20,40,100,0.25)", color: "#7eb0f0", border: "1px solid rgba(40,80,180,0.28)" }, dot: "#7eb0f0" },
  CANCELLED: { label: "Cancelled", style: { background: "rgba(122,12,28,0.25)", color: "#e8a0a8", border: "1px solid rgba(177,18,38,0.28)" }, dot: "#e8a0a8" },
  NO_SHOW:   { label: "No Show",   style: { background: "rgba(40,35,32,0.80)", color: "#8a7f78", border: "1px solid rgba(138,127,120,0.20)" }, dot: "#8a7f78" },
  // User/Membership
  ACTIVE:    { label: "Active",    style: { background: "rgba(10,80,45,0.25)", color: "#4ade80", border: "1px solid rgba(20,120,70,0.28)" }, dot: "#4ade80" },
  INACTIVE:  { label: "Inactive",  style: { background: "rgba(40,35,32,0.80)", color: "#8a7f78", border: "1px solid rgba(138,127,120,0.20)" }, dot: "#8a7f78" },
  EXPIRED:   { label: "Expired",   style: { background: "rgba(100,50,10,0.28)", color: "#d4956a", border: "1px solid rgba(160,80,20,0.28)" }, dot: "#d4956a" },
  // Content
  DRAFT:     { label: "Draft",     style: { background: "rgba(40,35,32,0.80)", color: "#8a7f78", border: "1px solid rgba(138,127,120,0.20)" }, dot: "#8a7f78" },
  PUBLISHED: { label: "Published", style: { background: "rgba(10,80,45,0.25)", color: "#4ade80", border: "1px solid rgba(20,120,70,0.28)" }, dot: "#4ade80" },
  ARCHIVED:  { label: "Archived",  style: { background: "rgba(122,12,28,0.20)", color: "#e8a0a8", border: "1px solid rgba(177,18,38,0.22)" }, dot: "#e8a0a8" },
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    style: { background: "rgba(40,35,32,0.80)", color: "#8a7f78", border: "1px solid rgba(138,127,120,0.20)" },
    dot: "#8a7f78",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        className
      )}
      style={config.style}
    >
      {showDot && (
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: config.dot }} />
      )}
      {config.label}
    </span>
  );
}
