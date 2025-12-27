// src/pages/Dashboard/CitizenDashboard.jsx
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DashboardLayout } from "../../components/Dashboard/Shared/DashboardLayout";
import { StatsCard } from "../../components/Dashboard/Shared/StatsCard";
import { IssueCard } from "../../components/Dashboard/Citizen/issuecard";
import { MyIssues } from "../../components/Dashboard/Citizen/myissue";
import { ReportIssue } from "../../components/Dashboard/Citizen/reportissue";
import { IssueMap } from "../../components/Dashboard/Citizen/IssueMap";
import { NearbyIssuesMap } from "../../components/Dashboard/Shared/NearbyIssuesMap";
import HeatmapViewer from "../../components/Dashboard/Shared/HeatmapViewer";
import {
  FileText,
  Clock,
  CheckCircle2,
  ThumbsUp,
  Plus,
  MapPin,
  ArrowRight,
  Bell,
  X,
  Camera,
} from "lucide-react";

// Mock data for dashboard
const mockStats = {
  totalIssues: 12,
  activeIssues: 5,
  resolutionRate: 68,
  totalUpvotes: 45,
};

const mockRecentIssues = [
  {
    id: "ISS-001",
    title: "Large pothole on Main Street",
    description: "There's a dangerous pothole near the intersection.",
    category: "pothole",
    priority: "high",
    status: "in-progress",
    location: { address: "123 Main Street" },
    upvotes: 24,
    comments: [{ id: 1 }],
    createdAt: "2024-12-20T10:30:00Z",
    updatedAt: "2024-12-24T15:45:00Z",
    images: [
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400",
    ],
  },
  {
    id: "ISS-002",
    title: "Broken street light at Oak Avenue",
    description: "Street light has been out for 3 days.",
    category: "streetlight",
    priority: "medium",
    status: "acknowledged",
    location: { address: "45 Oak Avenue" },
    upvotes: 12,
    comments: [],
    createdAt: "2024-12-22T08:00:00Z",
    updatedAt: "2024-12-23T09:15:00Z",
    images: [],
  },
  {
    id: "ISS-003",
    title: "Garbage overflow at Central Park",
    description: "Bins have been overflowing for days.",
    category: "garbage",
    priority: "medium",
    status: "reported",
    location: { address: "Central Park" },
    upvotes: 8,
    comments: [],
    createdAt: "2024-12-24T14:00:00Z",
    updatedAt: "2024-12-24T14:00:00Z",
    images: [],
  },
];

// Main Dashboard Home Component
function DashboardHome() {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [stats, setStats] = useState(mockStats);
  const [recentIssues, setRecentIssues] = useState(mockRecentIssues);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load issues from localStorage on mount and when refreshKey changes
  React.useEffect(() => {
    loadRecentIssues();
    updateStats();
  }, [refreshKey]);

  const loadRecentIssues = () => {
    /**
     * BACKEND API CALL: Get Recent Issues
     * Endpoint: GET /api/issues/recent?limit=6
     * Returns: { success: true, issues: [...] }
     */
    
    // Load from localStorage + mock data
    const userIssues = JSON.parse(localStorage.getItem('userIssues') || '[]');
    const allIssues = [...userIssues, ...mockRecentIssues];
    
    // Remove duplicates and sort by date
    const uniqueIssues = allIssues.filter((issue, index, self) =>
      index === self.findIndex((i) => i.id === issue.id)
    );
    uniqueIssues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take only first 6 for recent display
    setRecentIssues(uniqueIssues.slice(0, 6));
  };

  const updateStats = () => {
    /**
     * BACKEND API CALL: Get User Stats
     * Endpoint: GET /api/users/me/stats
     * Returns: { totalIssues, activeIssues, resolutionRate, totalUpvotes }
     */
    
    const userIssues = JSON.parse(localStorage.getItem('userIssues') || '[]');
    const totalUserIssues = userIssues.length;
    const activeUserIssues = userIssues.filter(i => 
      ['reported', 'acknowledged', 'in-progress'].includes(i.status)
    ).length;
    
    setStats({
      totalIssues: mockStats.totalIssues + totalUserIssues,
      activeIssues: mockStats.activeIssues + activeUserIssues,
      resolutionRate: mockStats.resolutionRate,
      totalUpvotes: mockStats.totalUpvotes + userIssues.reduce((sum, i) => sum + (i.upvotes || 0), 0),
    });
  };

  const handleViewIssue = (issue) => {
    /**
     * BACKEND API CALL: Get Issue Details
     * Endpoint: GET /api/issues/{issueId}
     * Navigate to issue detail page
     */
    console.log("View issue:", issue.id);
    // navigate(`/dashboard/citizen/issue/${issue.id}`);
  };

  const handleIssueCreated = (newIssue) => {
    console.log("✅ New issue created:", newIssue.id);
    
    // Trigger refresh by updating key
    setRefreshKey(prev => prev + 1);
    
    // Show success notification (optional - you can add a toast here)
    console.log("Dashboard refreshed with new issue");
  };

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back! 👋
          </h1>
          <p className="text-white/60">
            Here's what's happening with your reported issues.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-rose-500/25"
        >
          <Plus className="h-5 w-5" />
          Report Issue
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Issues"
          value={stats.totalIssues}
          icon={FileText}
          color="rose"
          trend="up"
          trendValue={12}
        />
        <StatsCard
          title="Active Issues"
          value={stats.activeIssues}
          icon={Clock}
          color="violet"
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
          title="Total Upvotes"
          value={stats.totalUpvotes}
          icon={ThumbsUp}
          color="amber"
          trend="up"
          trendValue={8}
        />
      </div>

      {/* Recent Issues */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent Issues</h2>
          <button
            onClick={() => navigate("/dashboard/citizen/issues")}
            className="flex items-center gap-1 text-sm text-rose-400 transition-colors hover:text-rose-300"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onView={handleViewIssue} />
          ))}
        </div>
      </div>

      {/* Map widget - Issues Near You */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Issues Near You</h2>
          <button
            onClick={() => navigate("/dashboard/citizen/map")}
            className="flex items-center gap-1 text-sm text-rose-400 transition-colors hover:text-rose-300"
          >
            Open full map
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[400px]">
          <NearbyIssuesMap role="citizen" compact={true} />
        </div>
      </div>

      {/* Report Issue Modal */}
      <ReportIssue
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={handleIssueCreated}
      />
    </div>
  );
}

// Citizen Dashboard with nested routes
export default function CitizenDashboard() {
  return (
    <DashboardLayout role="citizen">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="issues" element={<MyIssues />} />
        <Route path="report" element={<ReportIssuePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}

// Placeholder pages for routes
function ReportIssuePage() {
  const showModal = true;
  const navigate = useNavigate();

  const handleSuccess = (newIssue) => {
    console.log("Issue created:", newIssue);
    navigate("/dashboard/citizen/issues");
  };

  return (
    <div>
      <ReportIssue
        isOpen={showModal}
        onClose={() => navigate("/dashboard/citizen")}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

function MapPage() {
  return <IssueMap />;
}

function HeatmapPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Issues Heatmap
          </h1>
          <p className="text-sm text-white/60">
            Visualize issue density in your area
          </p>
        </div>
      </div>
      <HeatmapViewer 
        userRole="citizen" 
        defaultCenter={[28.6139, 77.2090]}
        defaultZoom={12}
        height="calc(100vh - 250px)"
      />
    </div>
  );
}

function NotificationsPage() {
  const [notifications, setNotifications] = React.useState([
    {
      id: 1,
      type: "status_update",
      title: "Issue #ISS-001 status updated",
      message: "Your pothole report is now In Progress",
      issueId: "ISS-001",
      time: "2 hours ago",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unread: true,
      icon: "🔄",
    },
    {
      id: 2,
      type: "comment",
      title: "New comment on your issue",
      message: "An official has responded to your report",
      issueId: "ISS-001",
      time: "5 hours ago",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      unread: true,
      icon: "💬",
    },
    {
      id: 3,
      type: "resolution",
      title: "Issue resolved",
      message: "Street light repair has been completed",
      issueId: "ISS-002",
      time: "1 day ago",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      unread: false,
      icon: "✅",
    },
    {
      id: 4,
      type: "upvote",
      title: "Your issue gained traction",
      message: "5 citizens upvoted your report",
      issueId: "ISS-001",
      time: "2 days ago",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      unread: false,
      icon: "👍",
    },
    {
      id: 5,
      type: "assignment",
      title: "Issue assigned",
      message: "Your report has been assigned to the Public Works Department",
      issueId: "ISS-003",
      time: "3 days ago",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      unread: false,
      icon: "📋",
    },
  ]);

  const [filter, setFilter] = React.useState("all"); // all, unread, read

  const markAllAsRead = () => {
    /**
     * BACKEND API CALL: Mark All Notifications as Read
     * Endpoint: PUT /api/notifications/mark-all-read
     * Returns: { success: true, updated: number }
     */
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, unread: false }))
    );
  };

  const markAsRead = (id) => {
    /**
     * BACKEND API CALL: Mark Single Notification as Read
     * Endpoint: PUT /api/notifications/{id}/read
     * Returns: { success: true }
     */
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, unread: false } : notif))
    );
  };

  const deleteNotification = (id) => {
    /**
     * BACKEND API CALL: Delete Notification
     * Endpoint: DELETE /api/notifications/{id}
     * Returns: { success: true }
     */
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return notif.unread;
    if (filter === "read") return !notif.unread;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Notifications
          </h1>
          <p className="text-sm text-white/60">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {["all", "unread", "read"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab
                ? "border-b-2 border-rose-500 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 py-16">
            <Bell className="mb-4 h-16 w-16 text-white/20" />
            <p className="text-lg text-white/60">No notifications</p>
            <p className="text-sm text-white/40">
              {filter === "unread"
                ? "You're all caught up!"
                : filter === "read"
                ? "No read notifications yet"
                : "You'll see notifications here"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => notif.unread && markAsRead(notif.id)}
              className={`group relative cursor-pointer rounded-xl border p-4 transition-all hover:scale-[1.01] ${
                notif.unread
                  ? "border-rose-500/30 bg-rose-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20 text-2xl">
                  {notif.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {notif.title}
                      </h3>
                      <p className="mt-1 text-sm text-white/70">
                        {notif.message}
                      </p>
                      {notif.issueId && (
                        <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                          {notif.issueId}
                        </span>
                      )}
                    </div>
                    {notif.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                    <Clock className="h-3 w-3" />
                    {notif.time}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="shrink-0 rounded-lg p-2 text-white/40 opacity-0 transition-all hover:bg-rose-500/20 hover:text-rose-400 group-hover:opacity-100"
                  title="Delete notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: user?.username || "John Doe",
    email: user?.email || "john@example.com",
    phone: user?.phone || "+1 (555) 123-4567",
    address: user?.address || "123 Main Street, Anytown, USA",
    bio: user?.bio || "Active community member dedicated to improving local infrastructure.",
  });

  const handleSave = () => {
    /**
     * BACKEND API CALL: Update User Profile
     * Endpoint: PUT /api/users/me
     * Body: { username, email, phone, address, bio }
     * Returns: { success: true, user: {...} }
     */
    setIsEditing(false);
    console.log("Profile updated:", formData);
  };

  const stats = [
    { label: "Issues Reported", value: 12, icon: FileText },
    { label: "Issues Resolved", value: 8, icon: CheckCircle2 },
    { label: "Total Upvotes", value: 45, icon: ThumbsUp },
    { label: "Active Days", value: 23, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Profile</h1>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-4xl font-bold text-white">
                  {formData.username.charAt(0).toUpperCase()}
                </div>
                <button className="absolute bottom-0 right-0 rounded-full bg-rose-500 p-2 text-white shadow-lg transition-all hover:scale-110">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Name & Role */}
              <h2 className="text-xl font-bold text-white">
                {formData.username}
              </h2>
              <p className="text-sm text-white/60">{formData.email}</p>
              <span className="mt-2 inline-block rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-400">
                {user?.role?.toUpperCase() || "CITIZEN"}
              </span>

              {/* Bio */}
              <p className="mt-4 text-sm text-white/70">{formData.bio}</p>

              {/* Member Since */}
              <div className="mt-6 w-full rounded-lg bg-white/5 p-3">
                <p className="text-xs text-white/40">Member Since</p>
                <p className="font-semibold text-white">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details & Stats */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-rose-400" />
                    <p className="text-xs text-white/60">{stat.label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Profile Information */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  disabled={!isEditing}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none transition-colors focus:border-rose-500/50 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = React.useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    issueUpdates: true,
    communityDigest: true,
    marketingEmails: false,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    /**
     * BACKEND API CALL: Update Settings
     * Endpoint: PUT /api/users/me/settings
     * Body: settings object
     * Returns: { success: true }
     */
    console.log("Settings saved:", settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <button
          onClick={handleSave}
          className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
        >
          Save Changes
        </button>
      </div>

      <div className="space-y-4">
        {/* Notifications Settings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            {[
              {
                key: "emailNotifications",
                label: "Email Notifications",
                description: "Receive updates via email",
              },
              {
                key: "pushNotifications",
                label: "Push Notifications",
                description: "Browser push notifications",
              },
              {
                key: "smsAlerts",
                label: "SMS Alerts",
                description: "Text message notifications",
              },
              {
                key: "issueUpdates",
                label: "Issue Updates",
                description: "Updates on your reported issues",
              },
              {
                key: "communityDigest",
                label: "Community Digest",
                description: "Weekly summary of community activity",
              },
              {
                key: "marketingEmails",
                label: "Marketing Emails",
                description: "Product updates and news",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div>
                  <span className="font-medium text-white">{item.label}</span>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500 focus:ring-rose-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Privacy & Security
          </h2>
          <div className="space-y-3">
            <button className="w-full rounded-lg bg-white/5 px-4 py-3 text-left text-white transition-colors hover:bg-white/10">
              Change Password
            </button>
            <button className="w-full rounded-lg bg-white/5 px-4 py-3 text-left text-white transition-colors hover:bg-white/10">
              Two-Factor Authentication
            </button>
            <button className="w-full rounded-lg bg-white/5 px-4 py-3 text-left text-white transition-colors hover:bg-white/10">
              Download My Data
            </button>
            <button className="w-full rounded-lg bg-rose-500/20 px-4 py-3 text-left text-rose-400 transition-colors hover:bg-rose-500/30">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
