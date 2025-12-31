// src/pages/Dashboard/OfficialDashboard.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/Dashboard/Shared/DashboardLayout";
import { StatsCard } from "../../components/Dashboard/Shared/StatsCard";
import { IssueManagement } from "../../components/Dashboard/Official/issuemanagment";
import { IssueDetailPage } from "../../components/Dashboard/Official/IssueDetailPage";
import { TeamManagement } from "../../components/Dashboard/Official/Teammanagement";
import { TeamChat } from "../../components/Dashboard/Official/TeamChat";
import { Analytics } from "../../components/Dashboard/Official/Analytics";
import { ReviewQueue } from "../../components/Dashboard/Official/ReviewQueue";
import HeatmapViewer from "../../components/Dashboard/Shared/HeatmapViewer";
import { issueService } from "../../services/issueService";
import { useAuth } from "../../context/Authcontext";
import {
  Inbox,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin,
  TrendingUp,
  Loader2,
  MessageSquare,
} from "lucide-react";

// Mock stats (fallback)
const mockStats = {
  pending: 23,
  assigned: 12,
  resolvedToday: 8,
  avgTime: "2.4 days",
  todayActivity: {
    received: 15,
    resolved: 8,
    inProgress: 12,
    escalated: 2,
  },
  priorityIssues: [
    {
      issueId: "ISS-005",
      title: "Traffic signal malfunction at Main & 5th",
      priority: "high",
      status: "reported",
      location: "Main & 5th Intersection",
      createdAt: "2 hours ago",
    },
    {
      issueId: "ISS-001",
      title: "Large pothole causing accidents",
      priority: "high",
      status: "in-progress",
      location: "123 Main Street",
      createdAt: "3 days ago",
    },
  ],
};

// Dashboard Home Component
function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOfficialAdmin = !!user?.isOfficialAdmin;
  const [priorityFilter, setPriorityFilter] = useState("high");
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Only load team members if user is an admin
    if (isOfficialAdmin) {
      loadTeamMembers();
    } else {
      setTeamLoading(false);
    }
  }, [isOfficialAdmin]);

  const loadTeamMembers = async () => {
    try {
      setTeamLoading(true);
      const response = await issueService.getTeamMembers();
      const members = response.data?.members || [];
      setTeamMembers(members);
    } catch (err) {
      console.error("Error loading team members:", err);
      setTeamMembers([]);
    } finally {
      setTeamLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await issueService.getOfficialStats();
      setStats(response.data || mockStats);
    } catch (err) {
      console.error("Error loading stats:", err);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = (issue) => {
    // Navigate to issue management with the issue pre-selected
    navigate("/dashboard/official/assigned", { state: { selectedIssue: issue } });
  };

  const handleQuickAction = (action) => {
    alert(`${action} functionality coming soon.`);
  };

  // Filter priority issues based on selected filter
  const priorityIssues = stats.priorityIssues || [];
  const filteredPriorityIssues = priorityIssues.filter((issue) => {
    if (priorityFilter === "high") return issue.priority === "high";
    if (priorityFilter === "overdue") return false; // TODO: Add overdue logic
    if (priorityFilter === "new") return issue.status === "reported";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Floating Message Button */}
      <button
        onClick={() => navigate("/dashboard/official/chat")}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all hover:scale-110"
        title="Open Messages"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Official Dashboard 🏛️
        </h1>
        <p className="text-white/60">
          Manage and resolve community issues efficiently.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pending Issues"
          value={loading ? "..." : stats.pending}
          icon={Inbox}
          color="amber"
          onClick={() => navigate("/dashboard/official/assigned")}
        />
        <StatsCard
          title="Assigned to Me"
          value={loading ? "..." : stats.assigned}
          icon={Users}
          color="violet"
          onClick={() => navigate("/dashboard/official/assigned")}
        />
        <StatsCard
          title="Resolved Today"
          value={loading ? "..." : stats.resolvedToday}
          icon={CheckCircle2}
          color="emerald"
          trend="up"
          trendValue={15}
          onClick={() => navigate("/dashboard/official/analytics")}
        />
        <StatsCard
          title="Avg. Resolution Time"
          value={loading ? "..." : stats.avgTime}
          icon={Clock}
          color="cyan"
          trend="up"
          trendValue={8}
          onClick={() => navigate("/dashboard/official/analytics")}
        />
      </div>

      {/* Priority Queue */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Priority Queue</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setPriorityFilter("high")}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                priorityFilter === "high"
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              High Priority
            </button>
            <button 
              onClick={() => setPriorityFilter("overdue")}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                priorityFilter === "overdue"
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              Overdue
            </button>
            <button 
              onClick={() => setPriorityFilter("new")}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                priorityFilter === "new"
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              New
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {filteredPriorityIssues.length > 0 ? (
            filteredPriorityIssues.map((issue) => (
              <div
                key={issue._id || issue.issueId}
                className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 transition-all hover:bg-rose-500/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">{issue.issueId}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          issue.status === "reported"
                            ? "bg-gray-500/20 text-gray-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </div>
                    <h4 className="font-medium text-white">{issue.title}</h4>
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {typeof issue.location === 'string' ? issue.location : issue.location?.address || 'Unknown'}
                      </span>
                      <span>•</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleTakeAction(issue)}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-rose-600"
                >
                  Take Action
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-white/40">
              No issues in this category
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Activity */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Today's Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Issues Received</span>
              <span className="font-semibold text-white">{loading ? "..." : stats.todayActivity?.received || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Issues Resolved</span>
              <span className="font-semibold text-emerald-400">{loading ? "..." : stats.todayActivity?.resolved || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">In Progress</span>
              <span className="font-semibold text-amber-400">{loading ? "..." : stats.todayActivity?.inProgress || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Escalated</span>
              <span className="font-semibold text-rose-400">{loading ? "..." : stats.todayActivity?.escalated || 0}</span>
            </div>
          </div>
        </div>

        {/* Team Status - Only show for admin users */}
        {isOfficialAdmin && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="h-5 w-5 text-violet-400" />
                Team Status
              </h3>
              <button
                onClick={() => navigate("/dashboard/official/team")}
                className="flex items-center gap-1 text-sm text-rose-400 hover:text-rose-300"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {teamLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-4 text-white/40 text-sm">
                  No team members yet
                </div>
              ) : (
                teamMembers.slice(0, 4).map((member) => (
                  <div
                    key={member._id || member.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-xs font-medium text-white">
                          {(member.name || member.username || "??")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a0a0a] ${
                            member.status === "active"
                              ? "bg-emerald-500"
                              : member.status === "busy" || (member.stats?.assigned > 10)
                              ? "bg-amber-500"
                              : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-white">{member.name || member.username}</span>
                    </div>
                    <span className="text-sm text-white/40">
                      {member.stats?.assigned || 0} tasks
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Create Work Order", icon: "📋" },
            { label: "Schedule Inspection", icon: "🔍" },
            { label: "Request Resources", icon: "📦" },
            { label: "Generate Report", icon: "📊" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.label)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-rose-500/30 hover:bg-white/10 hover:scale-105"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-white">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Map placeholder
function MapPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Official Area Management Map
          </h1>
          <p className="text-sm text-white/60">
            Monitor and manage issues across your jurisdiction
          </p>
        </div>
      </div>
      <HeatmapViewer 
        userRole="official" 
        defaultCenter={[28.6139, 77.2090]}
        defaultZoom={12}
        height="calc(100vh - 250px)"
      />
    </div>
  );
}

// Settings placeholder
function SettingsPage() {
  const [department, setDepartment] = React.useState("Roads & Infrastructure");
  const [notifications, setNotifications] = React.useState({
    newAssignments: true,
    statusUpdates: true,
    teamMessages: true,
    dailySummary: true,
  });
  const [saving, setSaving] = React.useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    
    // TODO: Backend team - Implement settings endpoint:
    // PATCH /api/officials/settings
    // Body: { department, notifications }
    
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!\n\nNote: Backend integration pending.");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Official Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60">
              Notification Preferences
            </label>
            <div className="mt-2 space-y-2">
              {[
                { key: "newAssignments", label: "New issue assignments" },
                { key: "statusUpdates", label: "Status updates" },
                { key: "teamMessages", label: "Team messages" },
                { key: "dailySummary", label: "Daily summary" },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [item.key]: e.target.checked,
                      })
                    }
                    className="rounded border-white/20 bg-white/5 text-rose-500 cursor-pointer"
                  />
                  <span className="text-sm text-white/80">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Official Dashboard with routes
export default function OfficialDashboard() {
  return (
    <DashboardLayout role="official">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="assigned" element={<IssueManagement />} />
        <Route path="issue/:issueId" element={<IssueDetailPage />} />
        <Route path="review-queue" element={<ReviewQueue />} />
        <Route path="team" element={<TeamManagement />} />
        <Route path="chat" element={<TeamChat />} />
        <Route path="chat/:memberId" element={<TeamChat />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="map" element={<MapPage />} />
        <Route path="heatmap" element={<MapPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}
