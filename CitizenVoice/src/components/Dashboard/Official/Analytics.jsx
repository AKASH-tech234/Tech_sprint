// src/components/Dashboard/Official/Analytics.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
} from "lucide-react";

// Mock analytics data
const mockOverviewStats = [
  {
    title: "Total Issues",
    value: "1,284",
    change: "+12%",
    trend: "up",
    color: "rose",
  },
  {
    title: "Resolved",
    value: "847",
    change: "+8%",
    trend: "up",
    color: "emerald",
  },
  {
    title: "Avg. Resolution Time",
    value: "2.4 days",
    change: "-15%",
    trend: "up",
    color: "violet",
  },
  {
    title: "Pending",
    value: "156",
    change: "+3%",
    trend: "down",
    color: "amber",
  },
];

const mockCategoryData = [
  { category: "Potholes", count: 342, percentage: 27, color: "bg-rose-500" },
  {
    category: "Street Lights",
    count: 256,
    percentage: 20,
    color: "bg-violet-500",
  },
  { category: "Garbage", count: 198, percentage: 15, color: "bg-amber-500" },
  {
    category: "Water/Drainage",
    count: 178,
    percentage: 14,
    color: "bg-cyan-500",
  },
  { category: "Traffic", count: 156, percentage: 12, color: "bg-emerald-500" },
  { category: "Other", count: 154, percentage: 12, color: "bg-gray-500" },
];

const mockMonthlyData = [
  { month: "Jan", reported: 120, resolved: 98 },
  { month: "Feb", reported: 145, resolved: 130 },
  { month: "Mar", reported: 132, resolved: 125 },
  { month: "Apr", reported: 168, resolved: 142 },
  { month: "May", reported: 189, resolved: 170 },
  { month: "Jun", reported: 156, resolved: 148 },
  { month: "Jul", reported: 178, resolved: 165 },
  { month: "Aug", reported: 203, resolved: 185 },
  { month: "Sep", reported: 187, resolved: 172 },
  { month: "Oct", reported: 195, resolved: 180 },
  { month: "Nov", reported: 210, resolved: 195 },
  { month: "Dec", reported: 225, resolved: 200 },
];

const mockDepartmentData = [
  {
    name: "Roads & Infrastructure",
    issues: 456,
    resolved: 389,
    avgTime: "2.1 days",
  },
  { name: "Sanitation", issues: 312, resolved: 287, avgTime: "1.5 days" },
  { name: "Electricity", issues: 245, resolved: 198, avgTime: "3.2 days" },
  { name: "Water Supply", issues: 178, resolved: 142, avgTime: "2.8 days" },
  { name: "Parks & Recreation", issues: 93, resolved: 85, avgTime: "4.5 days" },
];

export function Analytics() {
  const [dateRange, setDateRange] = useState("month");
  const maxMonthlyValue = Math.max(
    ...mockMonthlyData.map((d) => Math.max(d.reported, d.resolved))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics</h2>
          <p className="text-sm text-white/60">
            Performance overview and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {["week", "month", "quarter", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-2 text-xs transition-colors",
                  dateRange === range
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockOverviewStats.map((stat, index) => (
          <div
            key={index}
            className={cn(
              "rounded-xl border border-white/10 bg-gradient-to-br p-6",
              stat.color === "rose"
                ? "from-rose-500/10 to-transparent"
                : stat.color === "emerald"
                ? "from-emerald-500/10 to-transparent"
                : stat.color === "violet"
                ? "from-violet-500/10 to-transparent"
                : "from-amber-500/10 to-transparent"
            )}
          >
            <p className="text-sm text-white/60">{stat.title}</p>
            <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              {stat.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              )}
              <span
                className={
                  stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                }
              >
                {stat.change}
              </span>
              <span className="text-white/40">vs last {dateRange}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Issues by Category */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <PieChart className="h-5 w-5 text-rose-400" />
            Issues by Category
          </h3>
          <div className="space-y-4">
            {mockCategoryData.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{item.category}</span>
                  <span className="text-white/60">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <Activity className="h-5 w-5 text-violet-400" />
            Monthly Trend
          </h3>
          <div className="flex h-64 items-end gap-2">
            {mockMonthlyData.map((month) => (
              <div
                key={month.month}
                className="group flex flex-1 flex-col items-center gap-1"
              >
                <div className="relative flex w-full justify-center gap-1">
                  {/* Reported bar */}
                  <div
                    className="w-2 rounded-t bg-rose-500/60 transition-all group-hover:bg-rose-500"
                    style={{
                      height: `${(month.reported / maxMonthlyValue) * 200}px`,
                    }}
                  />
                  {/* Resolved bar */}
                  <div
                    className="w-2 rounded-t bg-emerald-500/60 transition-all group-hover:bg-emerald-500"
                    style={{
                      height: `${(month.resolved / maxMonthlyValue) * 200}px`,
                    }}
                  />
                </div>
                <span className="text-xs text-white/40">{month.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="text-xs text-white/60">Reported</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-white/60">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Department Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-xs font-medium text-white/60">
                  Department
                </th>
                <th className="pb-3 text-right text-xs font-medium text-white/60">
                  Total Issues
                </th>
                <th className="pb-3 text-right text-xs font-medium text-white/60">
                  Resolved
                </th>
                <th className="pb-3 text-right text-xs font-medium text-white/60">
                  Resolution Rate
                </th>
                <th className="pb-3 text-right text-xs font-medium text-white/60">
                  Avg. Time
                </th>
                <th className="pb-3 text-left text-xs font-medium text-white/60">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody>
              {mockDepartmentData.map((dept, index) => {
                const rate = Math.round((dept.resolved / dept.issues) * 100);
                return (
                  <tr
                    key={index}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="py-4 text-sm text-white">{dept.name}</td>
                    <td className="py-4 text-right text-sm text-white/60">
                      {dept.issues}
                    </td>
                    <td className="py-4 text-right text-sm text-white/60">
                      {dept.resolved}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={cn(
                          "rounded px-2 py-1 text-xs",
                          rate >= 85
                            ? "bg-emerald-500/20 text-emerald-400"
                            : rate >= 70
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        )}
                      >
                        {rate}%
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm text-white/60">
                      {dept.avgTime}
                    </td>
                    <td className="py-4">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            rate >= 85
                              ? "bg-emerald-500"
                              : rate >= 70
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          )}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">Best Performer</span>
          </div>
          <p className="text-sm text-white">
            <strong>Sanitation</strong> department has the best resolution rate
            at 92% with avg. resolution time of 1.5 days.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-400">Peak Hours</span>
          </div>
          <p className="text-sm text-white">
            Most issues are reported between <strong>9 AM - 11 AM</strong> on
            weekdays. Consider allocating more resources during these hours.
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-400" />
            <span className="font-medium text-rose-400">Attention Needed</span>
          </div>
          <p className="text-sm text-white">
            <strong>Parks & Recreation</strong> has the longest average
            resolution time at 4.5 days. Review resource allocation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
