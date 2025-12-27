// src/pages/Dashboard/CommunityDashboard.jsx
import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/Dashboard/Shared/DashboardLayout";
import { StatsCard } from "../../components/Dashboard/Shared/StatsCard";
import { AreaIssues } from "../../components/Dashboard/Community/areaissue";
import { VerificationPanel } from "../../components/Dashboard/Community/verificationpanel";
import { CommunityStats } from "../../components/Dashboard/Community/communitystats";
import {
  FileText,
  CheckCircle2,
  Users,
  TrendingUp,
  ArrowRight,
  MapPin,
  Award,
  Bell,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";

// Mock data
const mockStats = {
  areaIssues: 156,
  resolutionRate: 72,
  activeMembers: 1234,
  trend: "+12%",
};

const mockRecentActivity = [
  {
    id: 1,
    type: "verification",
    message: "Sarah K. verified issue #ISS-104 as resolved",
    time: "5 min ago",
    icon: CheckCircle2,
    color: "emerald",
  },
  {
    id: 2,
    type: "report",
    message: "New issue reported: Pothole on Oak Street",
    time: "15 min ago",
    icon: FileText,
    color: "rose",
  },
  {
    id: 3,
    type: "upvote",
    message: "Issue #ISS-101 received 10 new upvotes",
    time: "32 min ago",
    icon: ThumbsUp,
    color: "violet",
  },
  {
    id: 4,
    type: "comment",
    message: "Official responded to issue #ISS-089",
    time: "1 hour ago",
    icon: MessageCircle,
    color: "cyan",
  },
];

const mockTopIssues = [
  {
    id: "ISS-105",
    title: "Broken traffic signal at Main & 5th",
    upvotes: 156,
    status: "in-progress",
  },
  {
    id: "ISS-101",
    title: "Multiple potholes on Highway 7",
    upvotes: 89,
    status: "in-progress",
  },
  {
    id: "ISS-102",
    title: "Street lights out in residential area",
    upvotes: 67,
    status: "acknowledged",
  },
];

// Dashboard Home Component
function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Community Dashboard 🏘️
          </h1>
          <p className="text-white/60">
            Stay informed about issues in your community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2">
            <Award className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-sm font-medium text-violet-400">
                Reputation Score
              </p>
              <p className="text-xs text-violet-300">245 points ⭐</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Area Issues"
          value={mockStats.areaIssues}
          icon={FileText}
          color="rose"
          trend="up"
          trendValue={8}
        />
        <StatsCard
          title="Resolution Rate"
          value={`${mockStats.resolutionRate}%`}
          icon={CheckCircle2}
          color="emerald"
          trend="up"
          trendValue={5}
        />
        <StatsCard
          title="Active Members"
          value={mockStats.activeMembers.toLocaleString()}
          icon={Users}
          color="violet"
          trend="up"
          trendValue={12}
        />
        <StatsCard
          title="Monthly Trend"
          value={mockStats.trend}
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Queue Preview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Pending Verifications
            </h3>
            <button
              onClick={() => navigate("/dashboard/community/verify")}
              className="flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">
                    Resolved
                  </span>
                  <span className="text-sm text-white">
                    Issue #{100 + i} needs verification
                  </span>
                </div>
                <button className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/30">
                  Verify
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-white/40">
            Earn reputation points by verifying issue resolutions!
          </p>
        </div>

        {/* Top Issues */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <TrendingUp className="h-5 w-5 text-rose-400" />
              Top Community Issues
            </h3>
            <button
              onClick={() => navigate("/dashboard/community/area")}
              className="flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {mockTopIssues.map((issue, index) => (
              <div
                key={issue.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-xs font-semibold text-rose-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm text-white">{issue.title}</p>
                    <p className="text-xs text-white/40">{issue.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-rose-400">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm font-semibold">{issue.upvotes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Bell className="h-5 w-5 text-amber-400" />
          Recent Community Activity
        </h3>
        <div className="space-y-3">
          {mockRecentActivity.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    activity.color === "emerald"
                      ? "bg-emerald-500/20"
                      : activity.color === "rose"
                      ? "bg-rose-500/20"
                      : activity.color === "violet"
                      ? "bg-violet-500/20"
                      : "bg-cyan-500/20"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      activity.color === "emerald"
                        ? "text-emerald-400"
                        : activity.color === "rose"
                        ? "text-rose-400"
                        : activity.color === "violet"
                        ? "text-violet-400"
                        : "text-cyan-400"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.message}</p>
                  <p className="text-xs text-white/40">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area Heatmap Placeholder */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Area Heatmap</h3>
          <button
            onClick={() => navigate("/dashboard/community/map")}
            className="flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
          >
            Open full map
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/20">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 h-12 w-12 text-white/20" />
            <p className="text-white/40">Interactive heatmap coming soon</p>
            <p className="text-sm text-white/20">
              Shows issue density across neighborhoods
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map placeholder
function MapPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Public Map</h1>
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-16 w-16 text-white/20" />
          <p className="text-lg text-white/40">Community Issues Map</p>
          <p className="text-sm text-white/20">
            Integration with Leaflet/Mapbox coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

// Settings placeholder
function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Community Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60">Display Name</label>
            <input
              type="text"
              defaultValue="Community Member"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60">Neighborhood</label>
            <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
              <option>Downtown</option>
              <option>Northside</option>
              <option>Westend</option>
              <option>Eastside</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            "New issues in my area",
            "Issue status updates",
            "Verification requests",
            "Community milestones",
          ].map((item) => (
            <label key={item} className="flex items-center justify-between">
              <span className="text-white/80">{item}</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500 focus:ring-rose-500"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Privacy Settings
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-white/80">Show on leaderboard</span>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-white/80">Anonymous issue reporting</span>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

// Main Community Dashboard with routes
export default function CommunityDashboard() {
  return (
    <DashboardLayout role="community">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="area" element={<AreaIssues />} />
        <Route path="verify" element={<VerificationPanel />} />
        <Route path="stats" element={<CommunityStats />} />
        <Route path="map" element={<MapPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
