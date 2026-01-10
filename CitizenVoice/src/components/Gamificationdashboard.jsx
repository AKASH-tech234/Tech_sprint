/**
 * Gamification Dashboard
 * Displays outcome-driven reputation, community leaderboard, and progress
 * Theme: Dark with rose-violet accents
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RefreshCw,
  Info,
  Shield,
  Target,
  Zap,
  Loader2,
} from "lucide-react";
import { gamificationService } from "../services/gamificationService";
import { cn } from "../lib/utils";

// Suppress unused vars warning for motion (used in JSX)
void motion;

// Role badge colors
const ROLE_COLORS = {
  resident: "from-gray-500 to-gray-600",
  civic_helper: "from-blue-500 to-blue-600",
  community_validator: "from-purple-500 to-violet-600",
  civic_champion: "from-amber-500 to-yellow-500",
};

const ROLE_ICONS = {
  resident: "🏠",
  civic_helper: "🤝",
  community_validator: "✅",
  civic_champion: "🏆",
};

export default function GamificationDashboard({ districtId = null }) {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rpHistory, setRpHistory] = useState([]);
  const [roleInfo, setRoleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [profileData, historyData, rolesData] = await Promise.all([
        gamificationService.getUserProfile(districtId),
        gamificationService.getRPHistory(districtId, 10),
        gamificationService.getRoleProgression(),
      ]);

      setProfile(profileData);
      setRpHistory(historyData.history || []);
      setRoleInfo(rolesData);

      // Load community leaderboard if district is available
      if (districtId || profileData?.reputation?.districtId) {
        const lid = districtId || profileData.reputation.districtId;
        const leaderboardData =
          await gamificationService.getCommunityLeaderboard(lid, 10);
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (err) {
      console.error("Failed to load gamification data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [districtId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-white/60">Loading your reputation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-white/60">{error}</p>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-rose-500/20 px-4 py-2 text-rose-400 hover:bg-rose-500/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  const reputation = profile?.reputation || {};
  const legacy = profile?.legacy || {};
  const currentRP = reputation.totalRP || 0;
  const role = reputation.role || "resident";
  const roleDisplay = reputation.roleDisplayName || "Resident";
  const progress = gamificationService.getProgressToNextRole(currentRP);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Reputation</h1>
          <p className="text-sm text-white/60">
            Outcome-driven civic contribution tracking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* RP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-violet-500/10 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/60">Reputation Points</p>
              <h2 className="mt-1 text-4xl font-bold text-white">
                {currentRP}
              </h2>
              <p className="mt-2 text-sm text-white/40">RP</p>
            </div>
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-2xl",
                ROLE_COLORS[role]
              )}
            >
              {ROLE_ICONS[role]}
            </div>
          </div>

          {/* Progress to next role */}
          {!progress.achieved && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/60">
                <span>
                  Progress to{" "}
                  {gamificationService.getRoleInfo(progress.role).displayName}
                </span>
                <span>{progress.rpNeeded} RP needed</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500"
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Role Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/60">Current Role</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {roleDisplay}
              </h2>
              <p className="mt-2 text-xs text-white/40">
                {role === "civic_champion"
                  ? "Maximum role achieved!"
                  : "Complete verifications to advance"}
              </p>
            </div>
            <Shield className="h-8 w-8 text-violet-400" />
          </div>

          {/* Role progression dots */}
          <div className="mt-4 flex items-center gap-2">
            {[
              "resident",
              "civic_helper",
              "community_validator",
              "civic_champion",
            ].map((r, i) => (
              <div
                key={r}
                className={cn(
                  "h-3 w-3 rounded-full",
                  [
                    "resident",
                    "civic_helper",
                    "community_validator",
                    "civic_champion",
                  ].indexOf(role) >= i
                    ? "bg-gradient-to-r from-rose-500 to-violet-500"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>
        </motion.div>

        {/* Legacy Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/60">Activity Points</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {legacy.points || 0}
              </h2>
              <p className="mt-2 text-xs text-white/40">
                Level {legacy.level || 1} • {legacy.tier || "Bronze"}
              </p>
            </div>
            <Zap className="h-8 w-8 text-amber-400" />
          </div>

          {/* Badges count */}
          <div className="mt-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-white/40" />
            <span className="text-sm text-white/60">
              {legacy.badges?.length || 0} badges earned
            </span>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: "overview", label: "Overview", icon: Target },
          { id: "history", label: "RP History", icon: Clock },
          { id: "leaderboard", label: "Community", icon: Users },
        ].map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all",
              activeTab === id
                ? "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <TabIcon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            {/* Stats Grid */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Your Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
                  label="Issues Resolved"
                  value={reputation.stats?.issuesVerifiedResolved || 0}
                />
                <StatCard
                  icon={<Target className="h-5 w-5 text-blue-400" />}
                  label="Accurate Categories"
                  value={reputation.stats?.accurateCategorizations || 0}
                />
                <StatCard
                  icon={<Users className="h-5 w-5 text-violet-400" />}
                  label="Community Confirms"
                  value={reputation.stats?.communityConfirmedReports || 0}
                />
                <StatCard
                  icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
                  label="False Flags"
                  value={reputation.stats?.falseResolutionsFlagged || 0}
                />
              </div>
            </div>

            {/* RP Actions Info */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                How to Earn RP
              </h3>
              <div className="space-y-3">
                {roleInfo?.rpActions?.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="text-sm text-white/80">
                      {action.action}
                    </span>
                    <span className="font-semibold text-emerald-400">
                      +{action.points} RP
                    </span>
                  </div>
                ))}
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="text-xs text-white/40">
                    <Info className="mr-1 inline h-3 w-3" />
                    RP is only awarded after community verification
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">
              Recent RP Activity
            </h3>
            {rpHistory.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-white/40">
                No RP activity yet. Start contributing!
              </div>
            ) : (
              <div className="space-y-3">
                {rpHistory.map((event, i) => {
                  const actionInfo = gamificationService.getRPActionInfo(
                    event.eventType
                  );
                  return (
                    <div
                      key={event.id || i}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{actionInfo.icon}</span>
                        <div>
                          <p className="text-sm text-white">
                            {actionInfo.label}
                          </p>
                          {event.issueTitle && (
                            <p className="text-xs text-white/40">
                              {event.issueTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            event.points > 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          )}
                        >
                          {event.points > 0 ? "+" : ""}
                          {event.points} RP
                        </span>
                        <p className="text-xs text-white/40">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-white">
              Community Leaderboard
            </h3>
            {leaderboard.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-white/40">
                No community members yet
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((user, idx) => (
                  <div
                    key={user.userId || idx}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-4 py-3 transition-all",
                      idx === 0
                        ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
                        : idx === 1
                        ? "bg-gradient-to-r from-gray-400/10 to-gray-300/10"
                        : idx === 2
                        ? "bg-gradient-to-r from-amber-700/10 to-amber-600/10"
                        : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                          idx === 0
                            ? "bg-amber-500 text-black"
                            : idx === 1
                            ? "bg-gray-400 text-black"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-white/10 text-white"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <img
                        src={user.avatar || "/default-avatar.png"}
                        alt={user.username}
                        className="h-10 w-10 rounded-full border-2 border-white/20"
                        onError={(e) => {
                          e.target.src = "/default-avatar.png";
                        }}
                      />
                      <div>
                        <p className="font-medium text-white">
                          {user.username}
                        </p>
                        <p className="text-xs text-white/40">
                          {user.roleDisplayName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">
                        {user.totalRP}
                      </span>
                      <span className="text-white/40"> RP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-white/5 p-4 text-center">
      <div className="mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
