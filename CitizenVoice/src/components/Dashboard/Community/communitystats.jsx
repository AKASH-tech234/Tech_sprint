// src/components/Dashboard/Community/CommunityStats.jsx
import React, { useState, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { districtService, parseDistrictId } from "../../../services/districtService";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  Download,
  Share2,
  BarChart3,
  PieChart,
  Activity,
  Trophy,
  Star,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";

// Mock community stats
const mockOverviewStats = [
  {
    title: "Total Area Issues",
    value: "847",
    change: "+23",
    trend: "up",
    period: "this month",
    icon: FileText,
    color: "rose",
  },
  {
    title: "Resolution Rate",
    value: "76%",
    change: "+5%",
    trend: "up",
    period: "vs last month",
    icon: CheckCircle2,
    color: "emerald",
  },
  {
    title: "Active Community Members",
    value: "1,234",
    change: "+156",
    trend: "up",
    period: "this month",
    icon: Users,
    color: "violet",
  },
  {
    title: "Avg. Resolution Time",
    value: "3.2 days",
    change: "-0.5",
    trend: "up",
    period: "improvement",
    icon: Clock,
    color: "cyan",
  },
];

const mockCategoryBreakdown = [
  { category: "Roads & Potholes", count: 234, percentage: 28, trend: "up" },
  { category: "Street Lighting", count: 189, percentage: 22, trend: "down" },
  { category: "Garbage & Sanitation", count: 156, percentage: 18, trend: "up" },
  { category: "Water & Drainage", count: 134, percentage: 16, trend: "stable" },
  { category: "Public Safety", count: 89, percentage: 11, trend: "down" },
  { category: "Others", count: 45, percentage: 5, trend: "stable" },
];

const mockMonthlyTrend = [
  { month: "Jul", reported: 78, resolved: 65 },
  { month: "Aug", reported: 92, resolved: 78 },
  { month: "Sep", reported: 85, resolved: 82 },
  { month: "Oct", reported: 102, resolved: 89 },
  { month: "Nov", reported: 118, resolved: 98 },
  { month: "Dec", reported: 125, resolved: 105 },
];

const mockLeaderboard = [
  { rank: 1, name: "Sarah K.", points: 2450, verifications: 89, badge: "🏆" },
  { rank: 2, name: "Mike T.", points: 2180, verifications: 76, badge: "🥈" },
  { rank: 3, name: "Emily R.", points: 1920, verifications: 64, badge: "🥉" },
  { rank: 4, name: "John D.", points: 1650, verifications: 52, badge: "⭐" },
  { rank: 5, name: "Lisa M.", points: 1480, verifications: 48, badge: "⭐" },
];

const mockDepartmentPerformance = [
  {
    department: "Roads Dept",
    responseTime: "2.1 days",
    resolved: 89,
    pending: 23,
  },
  {
    department: "Sanitation",
    responseTime: "1.5 days",
    resolved: 156,
    pending: 12,
  },
  {
    department: "Electricity",
    responseTime: "3.8 days",
    resolved: 67,
    pending: 34,
  },
  {
    department: "Water Supply",
    responseTime: "2.9 days",
    resolved: 45,
    pending: 18,
  },
];

export function CommunityStats({ districtId }) {
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Parse district info
  const districtInfo = parseDistrictId(districtId);

  useEffect(() => {
    fetchStats();
  }, [timeRange, districtId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch stats from district service
      const [statsResponse, leaderboardResponse] = await Promise.all([
        districtService.getCommunityStats(districtId).catch(() => null),
        districtService.getLeaderboard(districtId, 5).catch(() => ({ leaderboard: [] })),
      ]);
      
      if (statsResponse) {
        const { overviewStats: apiStats, categoryBreakdown: apiCategories, monthlyTrend: apiTrend } = statsResponse;
        
        // Transform API stats to component format
        if (apiStats) {
          const { totalIssues, reported, acknowledged, inProgress, resolved } = apiStats;
          const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;
          const activeIssues = reported + acknowledged + inProgress;
          
          setOverviewStats([
            {
              title: "Total Area Issues",
              value: totalIssues.toString(),
              change: `+${activeIssues}`,
              trend: "up",
              period: "active",
              icon: FileText,
              color: "rose",
            },
            {
              title: "Resolution Rate",
              value: `${resolutionRate}%`,
              change: `${resolved} resolved`,
              trend: "up",
              period: "",
              icon: CheckCircle2,
              color: "emerald",
            },
            {
              title: "Active Issues",
              value: activeIssues.toString(),
              change: "needs attention",
              trend: activeIssues > 10 ? "down" : "up",
              period: "",
              icon: Users,
              color: "violet",
            },
            {
              title: "In Progress",
              value: inProgress.toString(),
              change: "being worked on",
              trend: "up",
              period: "",
              icon: Clock,
              color: "cyan",
            },
          ]);
        }
        
        if (apiCategories) {
          const total = apiCategories.reduce((sum, c) => sum + c.count, 0);
          setCategoryBreakdown(apiCategories.map(c => ({
            category: c.category?.charAt(0).toUpperCase() + c.category?.slice(1) || 'Other',
            count: c.count,
            percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
            trend: "stable"
          })));
        }
        
        if (apiTrend) {
          setMonthlyTrend(apiTrend);
        }
      }
      
      // Set leaderboard
      if (leaderboardResponse?.leaderboard) {
        const badges = ['🏆', '🥈', '🥉', '⭐', '⭐'];
        setLeaderboard(leaderboardResponse.leaderboard.map((l, idx) => ({
          ...l,
          badge: badges[idx] || '⭐'
        })));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fall back to mock data
      setOverviewStats(mockOverviewStats);
      setCategoryBreakdown(mockCategoryBreakdown);
      setMonthlyTrend(mockMonthlyTrend);
      setLeaderboard(mockLeaderboard);
    } finally {
      setLoading(false);
    }
  };

  const maxTrendValue = Math.max(
    ...monthlyTrend.flatMap((m) => [m.reported, m.resolved]),
    1
  );

  // No district selected state
  if (!districtId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Community Statistics</h2>
          <p className="text-sm text-white/60">
            Transparency dashboard for your community
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-white/10 bg-white/5 p-8">
          <MapPin className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Select a District</h3>
          <p className="text-white/60 text-center">
            Choose a district from the dropdown above to view community statistics.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2 text-white/60">Loading statistics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Community Statistics
          </h2>
          <p className="text-sm text-white/60">
            {districtInfo ? `${districtInfo.district}, ${districtInfo.state}` : 'Transparency dashboard for our community'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {["week", "month", "quarter", "year"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-2 text-xs transition-colors",
                  timeRange === range
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
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/5">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
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
                  : "from-cyan-500/10 to-transparent"
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <Icon
                  className={cn(
                    "h-6 w-6",
                    stat.color === "rose"
                      ? "text-rose-400"
                      : stat.color === "emerald"
                      ? "text-emerald-400"
                      : stat.color === "violet"
                      ? "text-violet-400"
                      : "text-cyan-400"
                  )}
                />
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                )}
              </div>
              <p className="text-sm text-white/60">{stat.title}</p>
              <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-white/40">
                <span
                  className={
                    stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {stat.change}
                </span>{" "}
                {stat.period}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <Activity className="h-5 w-5 text-rose-400" />
            Monthly Trend
          </h3>
          <div className="flex h-48 items-end gap-3">
            {monthlyTrend.map((month) => (
              <div
                key={month.month}
                className="group flex flex-1 flex-col items-center gap-1"
              >
                <div className="relative flex w-full justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-rose-500/60 transition-all group-hover:bg-rose-500"
                    style={{
                      height: `${(month.reported / maxTrendValue) * 150}px`,
                    }}
                  />
                  <div
                    className="w-3 rounded-t bg-emerald-500/60 transition-all group-hover:bg-emerald-500"
                    style={{
                      height: `${(month.resolved / maxTrendValue) * 150}px`,
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

        {/* Category Breakdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <PieChart className="h-5 w-5 text-violet-400" />
            Issues by Category
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">{item.count}</span>
                    {item.trend === "up" && (
                      <TrendingUp className="h-3 w-3 text-rose-400" />
                    )}
                    {item.trend === "down" && (
                      <TrendingDown className="h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Community Leaderboard */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
            <Trophy className="h-5 w-5 text-amber-400" />
            Community Leaderboard
          </h3>
          <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.id || user._id || user.rank || index}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-3",
                    index < 3 ? "bg-white/10" : "bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{user.badge || (index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐')}</span>
                    <div>
                      <p className="font-medium text-white">{user.name || user.username || user.displayName || 'User'}</p>
                      <p className="text-xs text-white/40">
                        {user.verifications ?? user.verificationCount ?? 0} verifications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-amber-400">
                      {(user.points ?? user.score ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <button className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5">
            View Full Leaderboard
          </button>
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
                    Avg. Response
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-white/60">
                    Resolved
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-white/60">
                    Pending
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockDepartmentPerformance.map((dept, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="py-3 text-sm text-white">
                      {dept.department}
                    </td>
                    <td className="py-3 text-right text-sm text-white/60">
                      {dept.responseTime}
                    </td>
                    <td className="py-3 text-right text-sm text-emerald-400">
                      {dept.resolved}
                    </td>
                    <td className="py-3 text-right text-sm text-amber-400">
                      {dept.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Public Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">Improving</span>
          </div>
          <p className="text-sm text-white">
            Street lighting issues have decreased by <strong>23%</strong> this
            month compared to last month.
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-400">Focus Area</span>
          </div>
          <p className="text-sm text-white">
            <strong>Roads & Potholes</strong> remain the most reported category
            with 234 issues this month.
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-400" />
            <span className="font-medium text-violet-400">
              Community Impact
            </span>
          </div>
          <p className="text-sm text-white">
            <strong>1,234 community members</strong> actively contributed to
            issue reporting and verification.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CommunityStats;
