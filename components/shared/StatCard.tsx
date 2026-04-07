import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "accent" | "premium" | "dark";
  isCurrency?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    cardStyle: {
      background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
    },
    iconStyle: { background: "rgba(255,255,255,0.07)", color: "#e8a0a8" },
    accentBar: null,
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  accent: {
    cardStyle: {
      background: "linear-gradient(145deg, #1e0a10 0%, #150608 100%)",
      border: "1px solid rgba(122,12,28,0.25)",
    },
    iconStyle: { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
    accentBar: "linear-gradient(90deg, #b11226, rgba(177,18,38,0.30))",
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  premium: {
    cardStyle: {
      background: "linear-gradient(145deg, #1a1508 0%, #110f04 100%)",
      border: "1px solid rgba(212,175,55,0.20)",
    },
    iconStyle: { background: "rgba(212,175,55,0.15)", color: "#d4af37" },
    accentBar: "linear-gradient(90deg, #d4af37, rgba(212,175,55,0.25))",
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  dark: {
    cardStyle: {
      background: "linear-gradient(145deg, #211916 0%, #181312 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
    },
    iconStyle: { background: "rgba(255,255,255,0.08)", color: "#cbbfb6" },
    accentBar: null,
    title: "text-muted-foreground",
    value: "text-foreground",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  isCurrency = false,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const isPositive = trend && trend.value > 0;

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300 [box-shadow:0_4px_28px_rgba(0,0,0,0.55)] hover:[box-shadow:0_20px_60px_rgba(0,0,0,0.70),0_6px_22px_rgba(122,12,28,0.20)] hover:-translate-y-0.5",
        className,
      )}
      style={styles.cardStyle}
    >
      {/* Top accent bar for accent / premium variants */}
      {styles.accentBar && (
        <div style={{ height: "2px", background: styles.accentBar, opacity: 0.85 }} />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={cn("text-[10px] font-bold uppercase tracking-[0.10em] mb-3", styles.title)}>
              {title}
            </p>
            <p className={cn("text-[2.1rem] font-bold font-display leading-none tracking-tight tabular-nums", styles.value)}>
              {isCurrency ? formatCurrency(Number(value)) : value}
            </p>
            {subtitle && (
              <p className={cn("text-xs mt-1.5", styles.title)} style={{ opacity: 0.55 }}>{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5 mt-3.5">
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: isPositive ? "rgba(16,130,70,0.18)" : "rgba(177,18,38,0.18)",
                  }}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" style={{ color: "#4ade80" }} />
                  ) : (
                    <TrendingDown className="h-3 w-3" style={{ color: "#f87171" }} />
                  )}
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ color: isPositive ? "#4ade80" : "#f87171" }}
                  >
                    {isPositive ? "+" : ""}{trend.value}%
                  </span>
                </div>
                {trend.label && (
                  <span className={cn("text-[10px]", styles.title)} style={{ opacity: 0.50 }}>
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl shrink-0 ml-4" style={styles.iconStyle}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
