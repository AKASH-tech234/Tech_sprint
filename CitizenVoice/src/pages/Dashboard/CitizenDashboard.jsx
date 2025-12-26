// src/pages/Dashboard/CitizenDashboard.jsx
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { DashboardLayout } from "../../components/Dashboard/Shared/DashboardLayout";
import { StatsCard } from "../../components/Dashboard/Shared/StatsCard";
import { IssueCard } from "../../components/Dashboard/Citizen/issuecard";
import { MyIssues } from "../../components/Dashboard/Citizen/myissue";
import { ReportIssue } from "../../components/Dashboard/Citizen/reportissue";
import {
  FileText,
  Clock,
  CheckCircle2,
  ThumbsUp,
  Plus,
  MapPin,
  ArrowRight,
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
  const [stats] = useState(mockStats);
  const [recentIssues, setRecentIssues] = useState(mockRecentIssues);

  const handleViewIssue = (issue) => {
    // TODO: Navigate to issue details page
    console.log("View issue:", issue.id);
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

      {/* Map widget placeholder */}
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
        <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 h-12 w-12 text-white/20" />
            <p className="text-white/40">Interactive map coming soon</p>
            <p className="text-sm text-white/20">
              Requires Leaflet/Mapbox integration
            </p>
          </div>
        </div>
      </div>

      {/* Report Issue Modal */}
      <ReportIssue
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => {
          // Refresh issues after successful report
          setRecentIssues((prev) => [...prev]);
        }}
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
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}

// Placeholder pages for routes
function ReportIssuePage() {
  const showModal = true;
  const navigate = useNavigate();

  return (
    <div>
      <ReportIssue
        isOpen={showModal}
        onClose={() => navigate("/dashboard/citizen")}
        onSuccess={() => navigate("/dashboard/citizen/issues")}
      />
    </div>
  );
}

function MapPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Community Map</h1>
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-16 w-16 text-white/20" />
          <p className="text-lg text-white/40">Interactive Map</p>
          <p className="text-sm text-white/20">
            Integration with Leaflet/Mapbox coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "Issue #ISS-001 status updated",
      message: "Your pothole report is now In Progress",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "New comment on your issue",
      message: "An official has responded to your report",
      time: "5 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "Issue resolved",
      message: "Street light repair has been completed",
      time: "1 day ago",
      unread: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <button className="text-sm text-rose-400 hover:text-rose-300">
          Mark all as read
        </button>
      </div>
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`rounded-lg border p-4 transition-colors ${
              notif.unread
                ? "border-rose-500/30 bg-rose-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{notif.title}</h3>
                <p className="text-sm text-white/60">{notif.message}</p>
                <p className="mt-1 text-xs text-white/40">{notif.time}</p>
              </div>
              {notif.unread && (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60">Email</label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Notifications
          </h2>
          <div className="space-y-3">
            {["Email notifications", "Push notifications", "SMS alerts"].map(
              (item) => (
                <label key={item} className="flex items-center justify-between">
                  <span className="text-white/80">{item}</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-white/20 bg-white/5 text-rose-500 focus:ring-rose-500"
                  />
                </label>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
