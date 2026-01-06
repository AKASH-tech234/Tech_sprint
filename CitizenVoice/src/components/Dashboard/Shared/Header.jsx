// src/components/Dashboard/Shared/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { NotificationBell } from "../../NotificationBell";
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
} from "lucide-react";

export function Header({ onMenuClick, showMenuButton = false, role = "citizen" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('dashboardTheme') === 'dark';
  });

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dashboardTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dashboardTheme', 'light');
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

        {/* Notifications - Using NotificationBell component */}
        <NotificationBell />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
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
                    navigate('/profile');
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
      {showProfile && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowProfile(false)}
        />
      )}
    </header>
  );
}

export default Header;
