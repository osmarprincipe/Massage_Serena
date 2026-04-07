import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
      {Icon && (
        <div
          className="mb-5 p-4 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <Icon className="h-7 w-7" style={{ color: "rgba(138,127,120,0.55)" }} />
        </div>
      )}
      <h3
        className="text-[15px] font-semibold text-foreground mb-2"
        style={{ letterSpacing: "-0.01em" }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-[260px] leading-relaxed" style={{ opacity: 0.80 }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] hover:-translate-y-px"
          style={{
            background: "linear-gradient(160deg, #7a0c1c 0%, #5c0815 55%, #3d0510 100%)",
            color: "#f5ede6",
            boxShadow: "0 2px 12px rgba(122,12,28,0.38), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.filter = "brightness(1.18)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 5px 22px rgba(177,18,38,0.48), inset 0 1px 0 rgba(255,255,255,0.10)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.filter = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(122,12,28,0.38), inset 0 1px 0 rgba(255,255,255,0.08)";
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
