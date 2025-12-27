// src/components/Dashboard/Official/TeamManagement.jsx
import React, { useState } from "react";
import { cn } from "../../../lib/utils";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  BarChart3,
} from "lucide-react";

// Mock team data
const mockTeamMembers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@city.gov",
    phone: "+1 234 567 890",
    role: "Field Officer",
    avatar: "JD",
    status: "active",
    stats: {
      assigned: 8,
      completed: 45,
      avgTime: "2.3 days",
    },
    recentIssues: [
      { id: "ISS-001", title: "Pothole repair", status: "in-progress" },
      { id: "ISS-004", title: "Water leak", status: "under-review" },
    ],
  },
  {
    id: 2,
    name: "Sarah Wilson",
    email: "sarah.wilson@city.gov",
    phone: "+1 234 567 891",
    role: "Team Lead",
    avatar: "SW",
    status: "active",
    stats: {
      assigned: 3,
      completed: 67,
      avgTime: "1.8 days",
    },
    recentIssues: [
      { id: "ISS-003", title: "Garbage collection", status: "assigned" },
    ],
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike.chen@city.gov",
    phone: "+1 234 567 892",
    role: "Field Officer",
    avatar: "MC",
    status: "busy",
    stats: {
      assigned: 12,
      completed: 38,
      avgTime: "3.1 days",
    },
    recentIssues: [
      { id: "ISS-007", title: "Street light fix", status: "in-progress" },
      { id: "ISS-008", title: "Traffic signal", status: "in-progress" },
      { id: "ISS-009", title: "Road marking", status: "assigned" },
    ],
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@city.gov",
    phone: "+1 234 567 893",
    role: "Field Officer",
    avatar: "ED",
    status: "offline",
    stats: {
      assigned: 0,
      completed: 52,
      avgTime: "2.5 days",
    },
    recentIssues: [],
  },
];

const statusColors = {
  active: "bg-emerald-500",
  busy: "bg-amber-500",
  offline: "bg-gray-500",
};

export function TeamManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredMembers = mockTeamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate workload distribution
  const workloadData = mockTeamMembers.map((member) => ({
    name: member.name.split(" ")[0],
    assigned: member.stats.assigned,
    capacity: 15, // Max capacity
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-sm text-white/60">
            {mockTeamMembers.length} team members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-48 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none focus:border-rose-500/50"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Workload Distribution */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 className="h-5 w-5 text-rose-400" />
          Workload Distribution
        </h3>
        <div className="space-y-4">
          {workloadData.map((member) => (
            <div key={member.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white">{member.name}</span>
                <span className="text-white/60">
                  {member.assigned}/{member.capacity} issues
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    member.assigned / member.capacity > 0.8
                      ? "bg-rose-500"
                      : member.assigned / member.capacity > 0.5
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{
                    width: `${(member.assigned / member.capacity) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-rose-500/30"
          >
            {/* Member header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-lg font-semibold text-white">
                    {member.avatar}
                  </div>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0a0a]",
                      statusColors[member.status]
                    )}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-white">{member.name}</h4>
                  <p className="text-sm text-white/60">{member.role}</p>
                </div>
              </div>
              <button className="rounded p-1 text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Stats */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {member.stats.assigned}
                </p>
                <p className="text-xs text-white/40">Active</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {member.stats.completed}
                </p>
                <p className="text-xs text-white/40">Completed</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {member.stats.avgTime}
                </p>
                <p className="text-xs text-white/40">Avg Time</p>
              </div>
            </div>

            {/* Recent issues */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/40">Recent Issues</p>
              {member.recentIssues.length > 0 ? (
                member.recentIssues.slice(0, 2).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="text-xs text-white/60 line-clamp-1">
                      {issue.title}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs",
                        issue.status === "in-progress"
                          ? "bg-amber-500/20 text-amber-400"
                          : issue.status === "under-review"
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-blue-500/20 text-blue-400"
                      )}
                    >
                      {issue.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/20">No active issues</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-2xl font-semibold text-white">
                    {selectedMember.avatar}
                  </div>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0a0a0a]",
                      statusColors[selectedMember.status]
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedMember.name}
                  </h3>
                  <p className="text-white/60">{selectedMember.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Contact info */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="h-4 w-4" />
                {selectedMember.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="h-4 w-4" />
                {selectedMember.phone}
              </div>
            </div>

            {/* Performance stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <Clock className="mx-auto mb-2 h-5 w-5 text-amber-400" />
                <p className="text-xl font-bold text-white">
                  {selectedMember.stats.assigned}
                </p>
                <p className="text-xs text-white/40">Active Issues</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                <p className="text-xl font-bold text-white">
                  {selectedMember.stats.completed}
                </p>
                <p className="text-xs text-white/40">Completed</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <BarChart3 className="mx-auto mb-2 h-5 w-5 text-violet-400" />
                <p className="text-xl font-bold text-white">
                  {selectedMember.stats.avgTime}
                </p>
                <p className="text-xs text-white/40">Avg Resolution</p>
              </div>
            </div>

            {/* Current issues */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-white">
                Current Assignments
              </h4>
              <div className="space-y-2">
                {selectedMember.recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <div>
                      <p className="text-sm text-white">{issue.title}</p>
                      <p className="text-xs text-white/40">{issue.id}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded px-2 py-1 text-xs",
                        issue.status === "in-progress"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-violet-500/20 text-violet-400"
                      )}
                    >
                      {issue.status}
                    </span>
                  </div>
                ))}
                {selectedMember.recentIssues.length === 0 && (
                  <p className="py-4 text-center text-sm text-white/40">
                    No active assignments
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5">
                Message
              </button>
              <button className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 py-2 text-sm font-medium text-white">
                Assign Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Add Team Member
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60">Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Role</label>
                <select className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white">
                  <option value="field-officer">Field Officer</option>
                  <option value="team-lead">Team Lead</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60"
              >
                Cancel
              </button>
              <button className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 py-2 text-sm font-medium text-white">
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
