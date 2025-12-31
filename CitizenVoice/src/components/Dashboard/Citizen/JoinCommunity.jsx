// src/components/Dashboard/Citizen/JoinCommunity.jsx
import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Users,
  ChevronDown,
  Loader2,
  CheckCircle,
  UserPlus,
  LogOut,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import indiaStatesDistricts from "../../../data/indianDistricts.json";
import { useAuth } from "../../../context/AuthContext";

// TODO: Backend Developer - Create these API endpoints:
// GET /api/communities - List all communities with filters
// GET /api/communities/search?state=X&district=Y - Search communities
// POST /api/communities/:id/join - Join a community
// POST /api/communities/:id/leave - Leave a community
// GET /api/user/communities - Get user's joined communities

export function JoinCommunity() {
  const { user } = useAuth();
  const [searchState, setSearchState] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("browse"); // browse | joined

  const states = Object.keys(indiaStatesDistricts).sort();
  const districts = searchState ? indiaStatesDistricts[searchState] : [];

  // Mock data - Replace with API calls
  useEffect(() => {
    // Mock communities based on district data
    const mockCommunities = [];
    Object.entries(indiaStatesDistricts).forEach(([state, districtList]) => {
      districtList.slice(0, 3).forEach((district) => {
        mockCommunities.push({
          id: `${state}-${district}`.replace(/\s/g, "-").toLowerCase(),
          name: `${district} Community`,
          district: district,
          state: state,
          memberCount: Math.floor(Math.random() * 500) + 50,
          issueCount: Math.floor(Math.random() * 100) + 10,
          isJoined: false,
          leader: {
            name: "Community Leader",
            avatar: null,
          },
          description: `Official community for ${district} district, ${state}. Join to stay updated on local issues and connect with fellow citizens.`,
        });
      });
    });
    setCommunities(mockCommunities.slice(0, 20));
  }, []);

  // Reset district when state changes
  useEffect(() => {
    setSearchDistrict("");
  }, [searchState]);

  // Filter communities based on search
  const filteredCommunities = communities.filter((community) => {
    if (searchState && community.state !== searchState) return false;
    if (searchDistrict && community.district !== searchDistrict) return false;
    return true;
  });

  const handleJoin = async (communityId) => {
    setActionLoading(communityId);
    try {
      // TODO: Replace with API call
      // await communityService.joinCommunity(communityId);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: true } : c))
      );
      setJoinedCommunities((prev) => [
        ...prev,
        communities.find((c) => c.id === communityId),
      ]);
    } catch (error) {
      console.error("Failed to join community:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (communityId) => {
    setActionLoading(communityId);
    try {
      // TODO: Replace with API call
      // await communityService.leaveCommunity(communityId);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCommunities((prev) =>
        prev.map((c) => (c.id === communityId ? { ...c, isJoined: false } : c))
      );
      setJoinedCommunities((prev) => prev.filter((c) => c.id !== communityId));
    } catch (error) {
      console.error("Failed to leave community:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Join Communities</h1>
        <p className="text-zinc-400">
          Connect with your local district communities to stay informed about
          issues and updates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "browse"
              ? "text-blue-400 border-blue-400"
              : "text-zinc-400 border-transparent hover:text-white"
          }`}
        >
          <Search className="w-4 h-4 inline mr-2" />
          Browse Communities
        </button>
        <button
          onClick={() => setActiveTab("joined")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "joined"
              ? "text-blue-400 border-blue-400"
              : "text-zinc-400 border-transparent hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          My Communities ({joinedCommunities.length})
        </button>
      </div>

      {activeTab === "browse" && (
        <>
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Filter by State
              </label>
              <div className="relative">
                <select
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {/* District Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Filter by District
              </label>
              <div className="relative">
                <select
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  disabled={!searchState}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-zinc-800/50 border border-zinc-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={handleJoin}
                onLeave={handleLeave}
                loading={actionLoading === community.id}
              />
            ))}
          </div>

          {filteredCommunities.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400">
                No communities found
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Try adjusting your search filters
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "joined" && (
        <div className="space-y-4">
          {joinedCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={{ ...community, isJoined: true }}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  loading={actionLoading === community.id}
                  showChat
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-400">
                You haven't joined any communities yet
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Browse and join communities to stay connected
              </p>
              <button
                onClick={() => setActiveTab("browse")}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
              >
                Browse Communities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Community Card Component
function CommunityCard({ community, onJoin, onLeave, loading, showChat }) {
  return (
    <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
            {community.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {community.district}, {community.state}
            </span>
          </div>
        </div>
        {community.isJoined && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Joined
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
        {community.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Users className="w-4 h-4" />
          <span>{community.memberCount} members</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <MessageCircle className="w-4 h-4" />
          <span>{community.issueCount} issues</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {community.isJoined ? (
          <>
            {showChat && (
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Open Chat
              </button>
            )}
            <button
              onClick={() => onLeave(community.id)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              Leave
            </button>
          </>
        ) : (
          <button
            onClick={() => onJoin(community.id)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Join Community
          </button>
        )}
      </div>
    </div>
  );
}

export default JoinCommunity;
