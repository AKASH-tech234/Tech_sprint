// src/components/Dashboard/Shared/StatsCard.jsx
import React from "react";
import { cn } from "../../../lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

const colorVariants = {
  rose: {
    bg: "bg-gradient-to-br from-rose-500/20 to-rose-600/10",
    icon: "text-rose-400",
    border: "border-rose-500/20",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-500/20 to-violet-600/10",
    icon: "text-violet-400",
    border: "border-violet-500/20",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/10",
    icon: "text-indigo-400",
    border: "border-indigo-500/20",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
    icon: "text-amber-400",
    border: "border-amber-500/20",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10",
    icon: "text-cyan-400",
    border: "border-cyan-500/20",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "rose",
  className,
}) {
  const colorClasses = colorVariants[color] || colorVariants.rose;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg",
        colorClasses.bg,
        colorClasses.border,
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/60">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>

          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={
                  trend === "up" ? "text-emerald-400" : "text-rose-400"
                }
              >
                {trendValue}%
              </span>
              <span className="text-white/40">vs last period</span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg bg-white/10",
              colorClasses.icon
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
