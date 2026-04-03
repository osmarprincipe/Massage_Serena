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
    card: "",
    cardStyle: { background: "#181312", border: "1px solid rgba(255,255,255,0.06)" },
    icon: "",
    iconStyle: { background: "rgba(255,255,255,0.07)", color: "#e8a0a8" },
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  accent: {
    card: "",
    cardStyle: { background: "linear-gradient(145deg, #1e0a10 0%, #150608 100%)", border: "1px solid rgba(122,12,28,0.25)" },
    icon: "",
    iconStyle: { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  premium: {
    card: "",
    cardStyle: { background: "linear-gradient(145deg, #1a1508 0%, #110f04 100%)", border: "1px solid rgba(212,175,55,0.20)" },
    icon: "",
    iconStyle: { background: "rgba(212,175,55,0.15)", color: "#d4af37" },
    title: "text-muted-foreground",
    value: "text-foreground",
  },
  dark: {
    card: "",
    cardStyle: { background: "linear-gradient(145deg, #211916 0%, #181312 100%)", border: "1px solid rgba(255,255,255,0.06)" },
    icon: "",
    iconStyle: { background: "rgba(255,255,255,0.08)", color: "#cbbfb6" },
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
      className={cn("rounded-2xl p-6 transition-all duration-300", className)}
      style={{ ...styles.cardStyle, boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.50)")}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn("text-[11px] font-semibold uppercase tracking-widest mb-3", styles.title)}>
            {title}
          </p>
          <p className={cn("text-[2rem] font-bold font-display leading-none tracking-tight", styles.value)}>
            {isCurrency ? formatCurrency(Number(value)) : value}
          </p>
          {subtitle && (
            <p className={cn("text-xs mt-1.5 opacity-60", styles.title)}>{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              )}
              <span className={cn("text-xs font-medium", isPositive ? "text-emerald-500" : "text-rose-400")}>
                {isPositive ? "+" : ""}{trend.value}%
              </span>
              {trend.label && (
                <span className={cn("text-xs opacity-50", styles.title)}>{trend.label}</span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl shrink-0 ml-4" style={styles.iconStyle}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
