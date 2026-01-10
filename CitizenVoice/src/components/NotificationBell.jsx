// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  AlertCircle,
  MessageSquare,
  FileText,
  Settings,
} from "lucide-react";

export function NotificationBell() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    pushEnabled,
    enablePushNotifications,
    disablePushNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
  };

  const handleTogglePush = async () => {
    if (pushEnabled) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);

    // Navigate based on notification type
    if (notification.issueId) {
      navigate(`/dashboard/citizen/issues`);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "issue_verification":
        return <Check className="h-4 w-4 text-emerald-400" />;
      case "issue_status_update":
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case "issue_resolved":
        return <CheckCheck className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-white/60" />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now - notifDate) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-white/50">({unreadCount})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePush}
                className="text-xs text-white/50 hover:text-white transition-colors"
                title={
                  pushEnabled
                    ? "Disable push notifications"
                    : "Enable push notifications"
                }
              >
                <Settings className="h-4 w-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mb-2" />
                <p className="text-sm text-white/50">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-white/20 mb-2" />
                <p className="text-sm text-white/50">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                      !notification.read ? "bg-rose-500/5" : ""
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 items-center justify-center rounded-lg ${
                        !notification.read ? "bg-rose-500/20" : "bg-white/10"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.read
                            ? "text-white font-medium"
                            : "text-white/70"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-rose-500 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between">
              <button
                onClick={handleClearAll}
                className="text-xs text-white/50 hover:text-white/70 py-1"
              >
                Clear all
              </button>
              <span className="text-xs text-white/30">
                {pushEnabled ? "Push enabled" : "Push disabled"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
