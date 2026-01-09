// src/components/Dashboard/Shared/Sidebar.jsx
import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../context/AuthContext";
import {
  LayoutDashboard,
  FileEdit,
  ClipboardList,
  Map,
  Bell,
  Settings,
  Inbox,
  Users,
  BarChart3,
  Home,
  CheckCircle2,
  TrendingUp,
  X,
  MessageSquare,
  ClipboardCheck,
  User,
} from "lucide-react";

// Menu configurations by role
const menuConfig = {
  citizen: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/citizen" },
    {
      icon: FileEdit,
      label: "Report Issue",
      path: "/dashboard/citizen/report",
    },
    {
      icon: ClipboardList,
      label: "My Issues",
      path: "/dashboard/citizen/issues",
    },
    { icon: Map, label: "Community Map", path: "/dashboard/citizen/map" },
    {
      icon: Bell,
      label: "Notifications",
      path: "/dashboard/citizen/notifications",
    },
    { icon: Settings, label: "Settings", path: "/dashboard/citizen/settings" },
  ],
  official: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/official" },
    {
      icon: Inbox,
      label: "Assigned Issues",
      path: "/dashboard/official/assigned",
    },
    {
      icon: ClipboardCheck,
      label: "Review Queue",
      path: "/dashboard/official/review-queue",
      adminOnly: true,
    },
    { icon: Users, label: "Team Management", path: "/dashboard/official/team", adminOnly: true },
    {
      icon: MessageSquare,
      label: "Messages",
      path: "/dashboard/official/chat",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      path: "/dashboard/official/analytics",
    },
    { icon: Map, label: "Area Map", path: "/dashboard/official/map" },
    { icon: Settings, label: "Settings", path: "/dashboard/official/settings" },
  ],
  community: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/community" },
    { icon: Home, label: "Area Issues", path: "/dashboard/community/area" },
    {
      icon: CheckCircle2,
      label: "Verification Queue",
      path: "/dashboard/community/verify",
    },
    {
      icon: MessageSquare,
      label: "Community Chat",
      path: "/dashboard/community/chat",
    },
    {
      icon: TrendingUp,
      label: "Community Stats",
      path: "/dashboard/community/stats",
    },
    { icon: Map, label: "Public Map", path: "/dashboard/community/map" },
    {
      icon: Settings,
      label: "Settings",
      path: "/dashboard/community/settings",
    },
  ],
};

export function Sidebar({ isOpen, onClose, role = "citizen" }) {
  const location = useLocation();
  const { user } = useAuth();
  const isOfficialAdmin = !!user?.isOfficialAdmin;
  const menuItemsRaw = menuConfig[role] || menuConfig.citizen;
  const menuItems =
    role === 'official' && !isOfficialAdmin
      ? menuItemsRaw.filter((item) => !item.adminOnly)
      : menuItemsRaw;

  const isActive = (path) => {
    if (path === `/dashboard/${role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-white/10 bg-black/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo section */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            {/* Octagon Logo from Landing Page */}
            <div className="relative h-8 w-8">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-auto"
              >
                <polygon
                  points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                />
                <polygon
                  points="35,18 65,18 82,35 82,65 65,82 35,82 18,65 18,35"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-widest text-white uppercase" style={{ letterSpacing: "0.1em" }}>
              CITIZEN VOICE
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-rose-400" : "text-white/60"
                    )}
                  />
                  {item.label}
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-white/10 p-4">
          {/* Profile Link */}
          <NavLink
            to="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all mb-3",
              location.pathname === "/profile"
                ? "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
            {!user?.isProfileComplete && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500" />
            )}
          </NavLink>
          
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500">
              <span className="text-sm font-semibold text-white">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">
                {user?.username || "User"}
              </p>
              <p className="truncate text-xs text-white/60">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
