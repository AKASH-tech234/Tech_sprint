/**
 * Notification Context
 * Manages push notifications and real-time socket notifications
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./Authcontext";
import { pushNotificationService } from "../services/pushNotificationService";
import { notificationService } from "../services/notificationService";
import io from "socket.io-client";

const NotificationContext = createContext(null);

// Get socket URL from environment or default to localhost
const getSocketUrl = () => {
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Remove /api suffix if present to get base URL
    return apiUrl.replace(/\/api\/?$/, "");
  }
  return "http://localhost:3000";
};

const SOCKET_URL = getSocketUrl();
console.log("🌐 Socket URL configured:", SOCKET_URL);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await notificationService.getNotifications(1, 50);
      const dbNotifications = response.data?.notifications || [];

      // Transform DB notifications to match our format
      const transformed = dbNotifications.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        issueId: n.relatedIssue?.issueId || n.metadata?.issueId,
        status: n.metadata?.status,
        timestamp: new Date(n.createdAt),
        read: n.isRead,
        dbId: n._id, // Keep reference to DB id for marking as read
      }));

      setNotifications(transformed);
      setUnreadCount(response.data?.unreadCount || 0);
      console.log("📥 Fetched notifications from DB:", transformed.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // Initialize push notifications
  useEffect(() => {
    const initPush = async () => {
      if (!pushNotificationService.isSupported()) {
        console.log("Push notifications not supported");
        return;
      }

      try {
        // Check if already subscribed
        const existingSubscription =
          await pushNotificationService.getSubscription();
        if (existingSubscription) {
          setPushEnabled(true);
          console.log("✅ Push notifications already enabled");
        }
      } catch (error) {
        console.error("Error checking push subscription:", error);
      }
    };

    initPush();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      console.log("⚠️ No user, skipping socket connection");
      return;
    }

    // Use user.id (from backend) or user._id as fallback
    const userId = user.id || user._id;

    console.log("🔌 Initializing socket connection for user:", userId);
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      console.log("🔗 Joining user room:", userId);
      socketInstance.emit("join", userId);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    // Listen for issue status update notifications
    socketInstance.on("issueStatusUpdate", (data) => {
      console.log("📢 Issue status update received:", data);

      const notification = {
        id: data.notificationId || Date.now(),
        dbId: data.notificationId,
        type: "issue_status_update",
        title: data.title || "Issue Status Updated",
        message: data.message,
        issueId: data.issueId,
        status: data.status,
        timestamp: new Date(),
        read: false,
      };

      console.log("💾 Adding notification to state:", notification);
      setNotifications((prev) => {
        // Avoid duplicates by checking if notification already exists
        const exists = prev.some((n) => n.dbId === data.notificationId);
        if (exists) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission is granted
      if (Notification.permission === "granted") {
        console.log("🔔 Showing browser notification");
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: `issue-${data.issueId}`,
        });
      } else if (Notification.permission === "default") {
        // Request permission on first notification
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
              tag: `issue-${data.issueId}`,
            });
          }
        });
      }
    });

    // Listen for general notifications
    socketInstance.on("notification", (data) => {
      console.log("📢 Notification received:", data);

      const notification = {
        id: Date.now(),
        type: data.type || "general",
        title: data.title,
        message: data.message,
        issueId: data.issueId,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notification, ...prev]);

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.type,
        });
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Enable push notifications
  const enablePushNotifications = useCallback(async () => {
    try {
      const permitted = await pushNotificationService.requestPermission();
      if (!permitted) {
        throw new Error("Notification permission denied");
      }

      await pushNotificationService.registerServiceWorker();
      await pushNotificationService.subscribe();

      setPushEnabled(true);
      console.log("✅ Push notifications enabled");

      return true;
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
      return false;
    }
  }, []);

  // Disable push notifications
  const disablePushNotifications = useCallback(async () => {
    try {
      await pushNotificationService.unsubscribe();
      setPushEnabled(false);
      console.log("✅ Push notifications disabled");
      return true;
    } catch (error) {
      console.error("Failed to disable push notifications:", error);
      return false;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id) => {
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Also update in database if it has a dbId
      const notification = notifications.find((n) => n.id === id);
      if (notification?.dbId) {
        try {
          await notificationService.markAsRead(notification.dbId);
          console.log(
            "✅ Notification marked as read in DB:",
            notification.dbId
          );
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
    },
    [notifications]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
      console.log("✅ All notifications marked as read in DB");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Clear all notifications (local only)
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Refresh notifications from database
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    pushEnabled,
    enablePushNotifications,
    disablePushNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}

export default NotificationContext;
