import { cn } from "@/lib/utils";
import { Crown, Star, Sparkles } from "lucide-react";

interface MembershipBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const configs = {
  Normal: {
    style: {
      background: "rgba(35, 28, 26, 0.90)",
      color: "#cbbfb6",
      border: "1px solid rgba(138, 127, 120, 0.22)",
    },
    icon: Star,
    label: "Normal",
  },
  VIP: {
    style: {
      background: "linear-gradient(135deg, rgba(122, 12, 28, 0.30) 0%, rgba(90, 8, 20, 0.20) 100%)",
      color: "#e8a0a8",
      border: "1px solid rgba(177, 18, 38, 0.28)",
    },
    icon: Crown,
    label: "VIP",
  },
  Premium: {
    style: {
      background: "linear-gradient(135deg, rgba(180, 140, 20, 0.22) 0%, rgba(212, 175, 55, 0.12) 100%)",
      color: "#d4af37",
      border: "1px solid rgba(212, 175, 55, 0.28)",
    },
    icon: Sparkles,
    label: "Premium",
  },
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px] gap-1 tracking-wide",
  md: "px-2.5 py-1 text-[11px] gap-1 tracking-wide",
  lg: "px-3 py-1.5 text-xs gap-1.5 tracking-wide",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export function MembershipBadge({
  level,
  size = "md",
  showIcon = true,
  className,
}: MembershipBadgeProps) {
  const config = configs[level as keyof typeof configs] || configs.Normal;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        sizes[size],
        className
      )}
      style={config.style}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
