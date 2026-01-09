import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  MessageSquare,
  X,
  Send,
  Mail,
  Phone,
  Briefcase,
  Activity,
  CheckCircle2,
  Building2,
  ChevronDown,
  ChevronRight,
  Construction,
  Droplets,
  Zap,
  Trash,
  HeartPulse,
  GraduationCap,
  Bus,
  TreePine,
  HelpCircle,
} from "lucide-react";
import { issueService } from "../../../services/issueService";
import { useAuth } from "../../../context/AuthContext";

// Department icons mapping (includes variations for matching)
const departmentIcons = {
  "Roads & Infrastructure": Construction,
  "roads & infrastructure": Construction,
  roads: Construction,
  "Water Supply": Droplets,
  "water supply": Droplets,
  water: Droplets,
  Electricity: Zap,
  electricity: Zap,
  Sanitation: Trash,
  sanitation: Trash,
  "Public Health": HeartPulse,
  "public health": HeartPulse,
  health: HeartPulse,
  Education: GraduationCap,
  education: GraduationCap,
  Transportation: Bus,
  transportation: Bus,
  transport: Bus,
  Environment: TreePine,
  environment: TreePine,
  Other: HelpCircle,
  other: HelpCircle,
};

// Uniform color scheme for all departments (keeping icons distinct)
const uniformColors = {
  bg: "from-rose-500/20 to-violet-500/20",
  border: "border-rose-500/30",
  icon: "text-rose-400",
  badge: "bg-gradient-to-r from-rose-500 to-violet-500",
};

// Helper to get icon for department (handles partial matches)
const getDeptIcon = (dept) => {
  if (!dept) return HelpCircle;
  const deptLower = dept.toLowerCase();
  if (departmentIcons[dept]) return departmentIcons[dept];
  if (departmentIcons[deptLower]) return departmentIcons[deptLower];
  // Partial match
  if (deptLower.includes("road")) return Construction;
  if (deptLower.includes("water")) return Droplets;
  if (deptLower.includes("electric")) return Zap;
  if (deptLower.includes("sanit")) return Trash;
  if (deptLower.includes("health")) return HeartPulse;
  if (deptLower.includes("educ")) return GraduationCap;
  if (deptLower.includes("transport")) return Bus;
  if (deptLower.includes("environ")) return TreePine;
  return HelpCircle;
};

// Helper to get uniform colors for all departments
const getDeptColorsHelper = (dept) => {
  return uniformColors;
};

const TeamManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "field-officer",
    department: "",
  });

  // Group members by department
  const membersByDepartment = useMemo(() => {
    const grouped = {};
    members.forEach((member) => {
      const dept = member.department || "Other";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(member);
    });
    return grouped;
  }, [members]);

  // Get department stats
  const departmentStats = useMemo(() => {
    const stats = {};
    Object.entries(membersByDepartment).forEach(([dept, deptMembers]) => {
      stats[dept] = {
        totalMembers: deptMembers.length,
        totalAssigned: deptMembers.reduce(
          (sum, m) => sum + (m.stats?.assigned || 0),
          0
        ),
        totalCompleted: deptMembers.reduce(
          (sum, m) => sum + (m.stats?.completed || 0),
          0
        ),
      };
    });
    return stats;
  }, [membersByDepartment]);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Initialize expanded state when members load
  useEffect(() => {
    const initialExpanded = {};
    Object.keys(membersByDepartment).forEach((dept) => {
      initialExpanded[dept] = false; // Start collapsed
    });
    setExpandedDepartments(initialExpanded);
  }, [members]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await issueService.getTeamMembers();
      setMembers(response.data?.members || []);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await issueService.addTeamMember(newMember);
      setMembers([...members, response.data.member]);
      setShowAddModal(false);
      setNewMember({
        name: "",
        email: "",
        phone: "",
        role: "field-officer",
        department: "",
      });

      if (response.data.member.tempPassword) {
        alert(
          `Team member added!\n\nTemp Password: ${response.data.member.tempPassword}\n\nShare this securely.`
        );
      }
    } catch (error) {
      alert(error.message || "Failed to add team member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (
      !confirm(
        "Remove this team member? This will delete their account and unassign all issues."
      )
    )
      return;

    try {
      await issueService.removeTeamMember(memberId);
      setMembers(members.filter((m) => m._id !== memberId));
    } catch (error) {
      alert(error.message || "Failed to remove team member");
    }
  };

  const openChat = (member) => {
    navigate("/dashboard/official/chat", { state: { member } });
  };

  const toggleDepartment = (dept) => {
    setExpandedDepartments((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const getDeptColors = (dept) => getDeptColorsHelper(dept);

  if (!user?.isOfficialAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
          <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-300">
            Only team leaders can access team management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl flex items-center gap-3">
            <Users className="w-7 h-7" />
            Team Management
          </h1>
          <p className="text-white/60 mt-1">
            Manage your team members organized by department
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/official/chat")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            <MessageSquare className="w-4 h-4" />
            Open Messages
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-rose-500/25"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Department Summary Cards */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(departmentStats).map(([dept, stats]) => {
            const colors = getDeptColors(dept);
            const DeptIcon = getDeptIcon(dept);
            return (
              <motion.div
                key={dept}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer transition-all hover:bg-white/10 hover:scale-105"
                onClick={() => {
                  const element = document.getElementById(
                    `dept-${dept.replace(/\s+/g, "-")}`
                  );
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center mb-2">
                  <DeptIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-white/60 truncate">{dept}</p>
                <p className="text-xl font-bold text-white">
                  {stats.totalMembers}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-white/40" />
          <h3 className="mb-2 text-xl font-semibold text-white">
            No Team Members
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 px-6 py-3 text-sm font-medium text-white"
          >
            Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(membersByDepartment).map(([dept, deptMembers]) => {
            const colors = getDeptColors(dept);
            const stats = departmentStats[dept];
            const isExpanded = expandedDepartments[dept];

            return (
              <motion.div
                key={dept}
                id={`dept-${dept.replace(/\s+/g, "-")}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                {/* Department Header */}
                {(() => {
                  const DeptIcon = getDeptIcon(dept);
                  return (
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
                      onClick={() => toggleDepartment(dept)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center">
                          <DeptIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            {dept}
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                              {deptMembers.length}{" "}
                              {deptMembers.length === 1 ? "member" : "members"}
                            </span>
                          </h2>
                          <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-amber-400" />
                              {stats.totalAssigned} assigned
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {stats.totalCompleted} completed
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-white" />
                      </motion.div>
                    </div>
                  );
                })()}

                {/* Department Members */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deptMembers.map((member) => (
                          <motion.div
                            key={member._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 transition-all hover:border-rose-500/30 hover:bg-white/5"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold">
                                  {member.avatar ||
                                    member.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="text-sm font-semibold text-white">
                                    {member.name}
                                  </h3>
                                  <p className="text-xs text-white/40 capitalize">
                                    {member.role?.replace("-", " ")}
                                  </p>
                                </div>
                              </div>
                              {member.unreadMessages > 0 && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                                  {member.unreadMessages}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1 mb-3 text-xs text-white/60">
                              <div className="flex items-center gap-2 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  {member.phone}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                                <p className="text-lg font-bold text-amber-400">
                                  {member.stats?.assigned || 0}
                                </p>
                                <p className="text-xs text-white/40">
                                  Assigned
                                </p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                                <p className="text-lg font-bold text-emerald-400">
                                  {member.stats?.completed || 0}
                                </p>
                                <p className="text-xs text-white/40">Done</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => openChat(member)}
                                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 px-3 py-2 text-xs font-medium text-white transition-all hover:shadow-lg"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Message
                              </button>
                              <button
                                onClick={() => handleRemoveMember(member._id)}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-400 transition-all hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Add Team Member
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email*
                  </label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({ ...newMember, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-rose-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) =>
                      setNewMember({ ...newMember, role: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="field-officer">Field Officer</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="inspector">Inspector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department
                  </label>
                  <select
                    value={newMember.department}
                    onChange={(e) =>
                      setNewMember({ ...newMember, department: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="" className="bg-slate-800">
                      Select Department
                    </option>
                    <option
                      value="Roads & Infrastructure"
                      className="bg-slate-800"
                    >
                      Roads & Infrastructure
                    </option>
                    <option value="Water Supply" className="bg-slate-800">
                      Water Supply
                    </option>
                    <option value="Electricity" className="bg-slate-800">
                      Electricity
                    </option>
                    <option value="Sanitation" className="bg-slate-800">
                      Sanitation
                    </option>
                    <option value="Public Health" className="bg-slate-800">
                      Public Health
                    </option>
                    <option value="Education" className="bg-slate-800">
                      Education
                    </option>
                    <option value="Transportation" className="bg-slate-800">
                      Transportation
                    </option>
                    <option value="Environment" className="bg-slate-800">
                      Environment
                    </option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <AnimatePresence></AnimatePresence>
    </div>
  );
};

export { TeamManagement };
