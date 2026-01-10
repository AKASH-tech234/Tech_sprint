/**
 * Push Notification Service
 * Handles browser push notifications for issue updates
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported in this browser");
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!this.isSupported()) {
      console.warn("Service workers not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      this.registration = registration;
      console.log("✅ Service Worker registered");
      return registration;
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      throw new Error("Service worker not registered");
    }

    try {
      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY || ""
          ),
        });
        console.log("✅ Push subscription created");
      }

      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error("❌ Push subscription failed:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      return;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log("✅ Push subscription removed");
    } catch (error) {
      console.error("❌ Unsubscribe failed:", error);
      throw error;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const subscription =
        await this.registration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error("❌ Failed to get subscription:", error);
      return null;
    }
  }

  /**
   * Show a local notification (fallback for when service worker is not available)
   */
  showLocalNotification(title, options = {}) {
    if (!this.isSupported()) {
      console.warn("Notifications not supported");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/logo.png",
        badge: "/badge.png",
        ...options,
      });
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
