// src/pages/Dashboard/CommunityDashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DashboardLayout } from "../../components/Dashboard/Shared/DashboardLayout";
import { StatsCard } from "../../components/Dashboard/Shared/StatsCard";
import { AreaIssues } from "../../components/Dashboard/Community/areaissue";
import { VerificationPanel } from "../../components/Dashboard/Community/verificationpanel";
import { VerificationQueue } from "../../components/Dashboard/Community/VerificationQueue";
import { CommunityStats } from "../../components/Dashboard/Community/communitystats";
import HeatmapViewer from "../../components/Dashboard/Shared/HeatmapViewer";
import { issueService } from "../../services/issueService";
import { verificationService } from "../../services/verificationService";
import { userService } from "../../services/userService";
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
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Dashboard Home Component
function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    areaIssues: 0,
    resolutionRate: 0,
    activeMembers: 0,
    verifiedCount: 0,
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [topIssues, setTopIssues] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [
        issuesResponse,
        profileResponse,
        unverifiedResponse,
      ] = await Promise.all([
        issueService.getIssues({ limit: 50 }).catch(err => ({ data: { issues: [] } })),
        userService.getProfile().catch(err => null),
        verificationService.getUnverifiedIssues().catch(err => ({ data: { issues: [] } })),
      ]);

      // Process issues data
      const allIssues = issuesResponse?.data?.issues || [];
      
      // Calculate stats
      const activeIssues = allIssues.filter(i => 
        ['reported', 'acknowledged', 'in-progress'].includes(i.status)
      );
      const resolvedIssues = allIssues.filter(i => i.status === 'resolved');
      const resolutionRate = allIssues.length > 0 
        ? Math.round((resolvedIssues.length / allIssues.length) * 100) 
        : 0;
      
      // Get top issues by upvotes
      const sortedByUpvotes = [...allIssues]
        .sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0))
        .slice(0, 5);
      
      // Get recent issues
      const recentSorted = [...allIssues]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

      // Get pending verifications (issues needing community verification)
      const pendingIssues = unverifiedResponse?.data?.issues || 
        allIssues.filter(i => i.status === 'reported' || i.status === 'resolved');

      setStats({
        areaIssues: allIssues.length,
        resolutionRate,
        activeMembers: 1234, // This would come from a community stats API
        verifiedCount: resolvedIssues.length,
      });
      
      setTopIssues(sortedByUpvotes);
      setRecentIssues(recentSorted);
      setPendingVerifications(pendingIssues.slice(0, 5));
      
      // Set user profile
      if (profileResponse) {
        setUserProfile(profileResponse.data || profileResponse);
      }

      // Generate recent activity from issues
      const activity = generateRecentActivity(allIssues);
      setRecentActivity(activity);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Generate recent activity from issues
  const generateRecentActivity = (issues) => {
    const activities = [];
    const sortedIssues = [...issues].sort((a, b) => 
      new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    sortedIssues.slice(0, 10).forEach(issue => {
      const timeDiff = Date.now() - new Date(issue.updatedAt || issue.createdAt).getTime();
      const timeAgo = formatTimeAgo(timeDiff);

      if (issue.status === 'resolved') {
        activities.push({
          id: `resolved-${issue._id}`,
          type: "verification",
          message: `Issue "${issue.title?.substring(0, 30)}..." was resolved`,
          time: timeAgo,
          icon: CheckCircle2,
          color: "emerald",
        });
      } else if (issue.status === 'reported') {
        activities.push({
          id: `reported-${issue._id}`,
          type: "report",
          message: `New issue: ${issue.title?.substring(0, 35)}...`,
          time: timeAgo,
          icon: FileText,
          color: "rose",
        });
      }
    });

    return activities.slice(0, 6);
  };

  const formatTimeAgo = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2 text-white/60">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <p className="mt-2 text-white/60">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-rose-400 hover:bg-rose-500/30"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

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
          <button
            onClick={fetchDashboardData}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2">
            <Award className="h-5 w-5 text-violet-400" />
            <div>
              <p className="text-sm font-medium text-violet-400">
                {user?.username || "Community Member"}
              </p>
              <p className="text-xs text-violet-300">
                {userProfile?.isProfileComplete ? "Profile Complete ✓" : "Complete Profile"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Area Issues"
          value={stats.areaIssues}
          icon={FileText}
          color="rose"
          trend="up"
          trendValue={8}
        />
        <StatsCard
          title="Resolution Rate"
          value={`${stats.resolutionRate}%`}
          icon={CheckCircle2}
          color="emerald"
          trend="up"
          trendValue={5}
        />
        <StatsCard
          title="Active Members"
          value={stats.activeMembers.toLocaleString()}
          icon={Users}
          color="violet"
          trend="up"
          trendValue={12}
        />
        <StatsCard
          title="Issues Resolved"
          value={stats.verifiedCount}
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
            {pendingVerifications.length > 0 ? (
              pendingVerifications.slice(0, 3).map((issue) => (
                <div
                  key={issue._id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      issue.status === 'resolved' 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {issue.status?.charAt(0).toUpperCase() + issue.status?.slice(1)}
                    </span>
                    <span className="text-sm text-white truncate max-w-[180px]">
                      {issue.title}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate("/dashboard/community/verify")}
                    className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs text-rose-400 hover:bg-rose-500/30"
                  >
                    Verify
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-white/40">
                No pending verifications
              </div>
            )}
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
            {topIssues.length > 0 ? (
              topIssues.slice(0, 3).map((issue, index) => (
                <div
                  key={issue._id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-xs font-semibold text-rose-400">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white truncate max-w-[200px]">{issue.title}</p>
                      <p className="text-xs text-white/40">{issue.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-rose-400">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">{issue.upvotes?.length || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-white/40">
                No issues found
              </div>
            )}
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
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => {
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
            })
          ) : (
            <div className="text-center py-4 text-white/40">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Area Heatmap Placeholder */}
      {/* District-Based Heatmap Preview */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">District Heatmap</h3>
            <p className="text-xs text-white/40">Issue density in your district</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/community/map")}
            className="flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
          >
            Open full map
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="h-64 rounded-lg overflow-hidden border border-white/10">
          <HeatmapViewer 
            userRole="community" 
            defaultCenter={[28.6139, 77.2090]}
            defaultZoom={12}
            height="256px"
            showControls={false}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-rose-500/10 p-3 text-center border border-rose-500/20">
            <p className="text-xs text-rose-400">High Priority</p>
            <p className="text-2xl font-bold text-rose-400">{recentIssues.filter(i => i.priority === 'high').length}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3 text-center border border-amber-500/20">
            <p className="text-xs text-amber-400">Medium Priority</p>
            <p className="text-2xl font-bold text-amber-400">{recentIssues.filter(i => i.priority === 'medium').length}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-3 text-center border border-emerald-500/20">
            <p className="text-xs text-emerald-400">Low Priority</p>
            <p className="text-2xl font-bold text-emerald-400">{recentIssues.filter(i => i.priority === 'low').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Map placeholder
function MapPage() {
  const CommunityHeatmap = React.lazy(() => import("../../components/Dashboard/Community/CommunityHeatmap"));
  
  return (
    <React.Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    }>
      <CommunityHeatmap />
    </React.Suspense>
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
        <Route path="verify" element={<VerificationQueue />} />
        <Route path="stats" element={<CommunityStats />} />
        <Route path="map" element={<MapPage />} />
        <Route path="heatmap" element={<MapPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
