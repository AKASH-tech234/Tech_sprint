// src/components/Dashboard/Shared/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { NotificationBell } from "../../NotificationBell";
import { issueService } from "../../../services/issueService";
import {
  Search,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Calendar,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";

export function Header({
  onMenuClick,
  showMenuButton = false,
  role = "citizen",
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("dashboardTheme") === "dark";
  });
  const [inspections, setInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);

  // Load upcoming inspections for officials
  useEffect(() => {
    if (role === "official" && showCalendar) {
      loadInspections();
    }
  }, [role, showCalendar]);

  const loadInspections = async () => {
    try {
      setInspectionsLoading(true);
      const response = await issueService.getInspections({ limit: 10 });
      setInspections(response.data?.inspections || []);
    } catch (err) {
      console.error("Error loading inspections:", err);
      setInspections([]);
    } finally {
      setInspectionsLoading(false);
    }
  };

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dashboardTheme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dashboardTheme", "light");
    }
  }, [darkMode]);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  const handleLogout = async () => {
    await logout();
    setShowProfile(false);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur-xl lg:px-6">
      {/* Left section - Menu button & Search */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-64 rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 lg:w-80"
            />
          </div>
        </form>
      </div>

      {/* Right section - Dark Mode, Notifications & Profile */}
      <div className="flex items-center gap-2">
        {/* Mobile search button */}
        <button className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden">
          <Search className="h-5 w-5" />
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Calendar/Inspections for Officials */}
        {role === "official" && (
          <div className="relative">
            <button
              onClick={() => {
                setShowCalendar(!showCalendar);
                setShowProfile(false);
              }}
              className="relative rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Scheduled Inspections"
            >
              <Calendar className="h-5 w-5" />
              {inspections.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {inspections.length > 9 ? "9+" : inspections.length}
                </span>
              )}
            </button>

            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    Scheduled Inspections
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {inspectionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                    </div>
                  ) : inspections.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-white/40">
                      No scheduled inspections
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {inspections.map((inspection) => (
                        <div
                          key={inspection._id}
                          className="rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => {
                            setShowCalendar(false);
                            navigate("/dashboard/official/assigned");
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {inspection.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    inspection.scheduledDate
                                  ).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {inspection.location?.address && (
                                <div className="mt-1 flex items-center gap-2 text-xs text-white/40">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">
                                    {inspection.location.address}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                                inspection.priority === "urgent"
                                  ? "bg-red-500/20 text-red-400"
                                  : inspection.priority === "high"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : inspection.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {inspection.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10 p-2">
                  <button
                    onClick={() => {
                      setShowCalendar(false);
                      navigate("/dashboard/official/assigned");
                    }}
                    className="w-full rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications - Using NotificationBell component */}
        <NotificationBell />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowCalendar(false);
            }}
            className="flex items-center gap-2 rounded-lg p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-500">
              <span className="text-sm font-semibold text-white">
                {user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <span className="hidden text-sm font-medium text-white md:block">
              {user?.username || "User"}
            </span>
            <ChevronDown className="hidden h-4 w-4 md:block" />
          </button>

          {/* Profile dropdown menu */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-white/10 px-3 py-2">
                <p className="text-sm font-medium text-white">
                  {user?.username || "User"}
                </p>
                <p className="text-xs text-white/60">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">
                  {user?.role || "citizen"}
                </span>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    navigate(`/dashboard/${role}/settings`);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              </div>
              <div className="border-t border-white/10 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProfile || showCalendar) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowProfile(false);
            setShowCalendar(false);
          }}
        />
      )}
    </header>
  );
}

export default Header;
