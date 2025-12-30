// src/components/Dashboard/Official/TeamManagement.jsx
import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { issueService } from "../../../services/issueService";

// Mock team data (fallback)
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
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "field-officer",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Backend team - Implement team members endpoint:
      // GET /api/officials/team
      // Response: { members: [...] }
      
      // Uncomment when backend is ready:
      // const response = await issueService.getTeamMembers();
      // const members = response.data?.members || [];
      // setTeamMembers(members.length > 0 ? members : mockTeamMembers);
      
      // Using mock data until backend is ready
      await new Promise(resolve => setTimeout(resolve, 600));
      setTeamMembers(mockTeamMembers);
    } catch (err) {
      console.error("Error loading team members:", err);
      setError(err.message || "Failed to load team members");
      setTeamMembers(mockTeamMembers); // Use mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      (member.name || member.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate workload distribution
  const workloadData = teamMembers.map((member) => ({
    name: (member.name || member.username || "Unknown").split(" ")[0],
    assigned: member.stats?.assigned || 0,
    capacity: 15, // Max capacity
  }));

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert("Please fill in all required fields (Name and Email)");
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Backend team - Implement add team member endpoint:
      // POST /api/officials/team
      // Body: { name, email, phone, role }
      
      // Uncomment when backend is ready:
      // const response = await issueService.addTeamMember(newMember);
      // setTeamMembers([...teamMembers, response.data.member]);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add new member to local state
      const newMemberData = {
        id: teamMembers.length + 1,
        _id: `${teamMembers.length + 1}`,
        ...newMember,
        username: newMember.name,
        avatar: newMember.name.substring(0, 2).toUpperCase(),
        status: "active",
        stats: {
          assigned: 0,
          completed: 0,
          avgTime: "0 days",
        },
        recentIssues: [],
      };
      
      setTeamMembers([...teamMembers, newMemberData]);
      setShowAddModal(false);
      setNewMember({ name: "", email: "", phone: "", role: "field-officer" });
      console.log("Team member added successfully:", newMemberData);
    } catch (err) {
      console.error("Error adding team member:", err);
      alert("Failed to add team member. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      // TODO: Backend team - Implement remove team member endpoint:
      // DELETE /api/officials/team/:memberId
      
      // Uncomment when backend is ready:
      // await issueService.removeTeamMember(memberId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTeamMembers(teamMembers.filter((m) => (m.id || m._id) !== memberId));
      setSelectedMember(null);
      console.log("Team member removed successfully");
    } catch (err) {
      console.error("Error removing team member:", err);
      alert("Failed to remove team member. Please try again.");
    }
  };

  const handleSendMessage = (member) => {
    // TODO: Backend team - Implement messaging endpoint:
    // POST /api/officials/message
    // Body: { recipientId, message }
    
    alert(`Messaging feature will be implemented by the backend team.\n\nRecipient: ${member.name || member.username}`);
  };

  const handleAssignIssueToMember = (member) => {
    // TODO: This could navigate to issue management with member pre-selected
    alert(`Issue assignment feature coming soon for ${member.name || member.username}`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-white/60">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Management</h2>
          <p className="text-sm text-white/60">
            {teamMembers.length} team members
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
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const memberName = member.name || member.username || "Unknown";
            const memberAvatar = member.avatar || memberName.substring(0, 2).toUpperCase();
            const memberRole = member.role || member.officialDetails?.designation || "Team Member";
            const memberStatus = member.status || "active";
            
            return (
              <div
                key={member.id || member._id}
                onClick={() => setSelectedMember(member)}
                className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-rose-500/30"
              >
                {/* Member header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-lg font-semibold text-white">
                        {memberAvatar}
                      </div>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0a0a0a]",
                          statusColors[memberStatus]
                        )}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{memberName}</h4>
                      <p className="text-sm text-white/60">{memberRole}</p>
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
                  {member.stats?.assigned || 0}
                </p>
                <p className="text-xs text-white/40">Active</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {member.stats?.completed || 0}
                </p>
                <p className="text-xs text-white/40">Completed</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-lg font-semibold text-white">
                  {member.stats?.avgTime || "N/A"}
                </p>
                <p className="text-xs text-white/40">Avg Time</p>
              </div>
            </div>

            {/* Recent issues */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-white/40">Recent Issues</p>
              {member.recentIssues && member.recentIssues.length > 0 ? (
                member.recentIssues.slice(0, 2).map((issue) => (
                  <div
                    key={issue.id || issue._id}
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
                          : issue.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-400"
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
            );
          })
        ) : (
          <div className="col-span-3 text-center py-12">
            <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No team members found</p>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (() => {
        const memberName = selectedMember.name || selectedMember.username || "Unknown";
        const memberAvatar = selectedMember.avatar || memberName.substring(0, 2).toUpperCase();
        const memberRole = selectedMember.role || selectedMember.officialDetails?.designation || "Team Member";
        const memberStatus = selectedMember.status || "active";
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500 text-2xl font-semibold text-white">
                      {memberAvatar}
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#0a0a0a]",
                        statusColors[memberStatus]
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {memberName}
                    </h3>
                    <p className="text-white/60">{memberRole}</p>
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
                  {selectedMember.email || "No email provided"}
                </div>
                {selectedMember.phone && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Phone className="h-4 w-4" />
                    {selectedMember.phone}
                  </div>
                )}
              </div>

              {/* Performance stats */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <Clock className="mx-auto mb-2 h-5 w-5 text-amber-400" />
                  <p className="text-xl font-bold text-white">
                    {selectedMember.stats?.assigned || 0}
                  </p>
                  <p className="text-xs text-white/40">Active Issues</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                  <p className="text-xl font-bold text-white">
                    {selectedMember.stats?.completed || 0}
                  </p>
                  <p className="text-xs text-white/40">Completed</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <BarChart3 className="mx-auto mb-2 h-5 w-5 text-violet-400" />
                  <p className="text-xl font-bold text-white">
                    {selectedMember.stats?.avgTime || "N/A"}
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
                  {selectedMember.recentIssues && selectedMember.recentIssues.length > 0 ? (
                    selectedMember.recentIssues.map((issue) => (
                      <div
                        key={issue.id || issue._id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div>
                          <p className="text-sm text-white">{issue.title}</p>
                          <p className="text-xs text-white/40">{issue.id || issue.issueId}</p>
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
                    ))
                  ) : (
                    <p className="py-4 text-center text-sm text-white/40">
                      No active assignments
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => handleSendMessage(selectedMember)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors"
                >
                  Message
                </button>
                <button 
                  onClick={() => handleAssignIssueToMember(selectedMember)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 py-2 text-sm font-medium text-white hover:scale-105 transition-transform"
                >
                  Assign Issue
                </button>
              </div>
              
              {/* Remove Member Button */}
              <button
                onClick={() => handleRemoveMember(selectedMember.id || selectedMember._id)}
                className="mt-3 w-full rounded-lg border border-rose-500/30 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                Remove from Team
              </button>
            </div>
          </div>
        );
      })()}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Add Team Member
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60">Name *</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-rose-500/50"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Email *</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-rose-500/50"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-rose-500/50"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60">Role</label>
                <select 
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-rose-500/50 cursor-pointer"
                >
                  <option value="field-officer">Field Officer</option>
                  <option value="team-lead">Team Lead</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewMember({ name: "", email: "", phone: "", role: "field-officer" });
                }}
                disabled={saving}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddMember}
                disabled={saving}
                className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 py-2 text-sm font-medium text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
