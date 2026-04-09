import { cn } from "@/lib/utils";
import { getPlanTier, getTierIcon, tierBadgeStyles } from "@/lib/plan-style";

interface MembershipBadgeProps {
  /** The plan's numeric level (from DB) */
  planLevel: number;
  /** The plan's display name (free text — not used for styling) */
  planName: string;
  /** Max level across all plans — enables relative tier calculation. Omit for absolute thresholds. */
  maxLevel?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const sizes = {
  sm: "px-2 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-[11px] gap-1",
  lg: "px-3 py-1.5 text-xs gap-1.5",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export function MembershipBadge({
  planLevel,
  planName,
  maxLevel,
  size = "md",
  showIcon = true,
  className,
}: MembershipBadgeProps) {
  const tier = getPlanTier(planLevel, maxLevel);
  const Icon = getTierIcon(tier);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide",
        sizes[size],
        className
      )}
      style={tierBadgeStyles[tier]}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {planName}
    </span>
  );
}
