// src/components/Dashboard/Community/CommunityChat.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MoreVertical,
  Users,
  Settings,
  Image as ImageIcon,
  Smile,
  Loader2,
  MapPin,
  Clock,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

// TODO: Backend Developer - Create these API endpoints:
// GET /api/communities/:districtCode/messages - Get chat messages (paginated)
// POST /api/communities/:districtCode/messages - Send a message
// GET /api/communities/:districtCode/members - Get community members
// WebSocket: /ws/community/:districtCode - Real-time chat updates

export function CommunityChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState([]);
  const messagesEndRef = useRef(null);

  const district = user?.district;

  // Mock messages - Replace with API call
  useEffect(() => {
    // Simulate loading messages
    const mockMessages = [
      {
        id: 1,
        type: "announcement",
        sender: {
          id: "system",
          name: "Community Alert",
          avatar: null,
          role: "system",
        },
        content:
          "Welcome to the community chat! This is the official communication channel for your district.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 2,
        type: "text",
        sender: {
          id: "user1",
          name: "Rahul Sharma",
          avatar: null,
          role: "member",
        },
        content:
          "Has anyone reported the broken streetlight near the main market?",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 3,
        type: "text",
        sender: {
          id: "user2",
          name: "Priya Patel",
          avatar: null,
          role: "moderator",
        },
        content:
          "Yes, I reported it yesterday. It's been assigned to the municipal team.",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 4,
        type: "text",
        sender: {
          id: "user3",
          name: "Amit Kumar",
          avatar: null,
          role: "member",
        },
        content:
          "Great! Also, the pothole on MG Road is getting worse. Can someone verify if it's been reported?",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 5,
        type: "announcement",
        sender: {
          id: "leader",
          name: "Community Leader",
          avatar: null,
          role: "leader",
        },
        content:
          "📢 Reminder: Weekly community meeting tomorrow at 6 PM at the community hall. All members are welcome!",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    setTimeout(() => {
      setMessages(mockMessages);
      setMembers([
        { id: "1", name: "You", role: "leader", isOnline: true },
        { id: "2", name: "Rahul Sharma", role: "member", isOnline: true },
        { id: "3", name: "Priya Patel", role: "moderator", isOnline: false },
        { id: "4", name: "Amit Kumar", role: "member", isOnline: true },
        { id: "5", name: "Sneha Gupta", role: "member", isOnline: false },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      // TODO: Replace with API call
      // await communityService.sendMessage(district.districtCode, newMessage);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const message = {
        id: Date.now(),
        type: "text",
        sender: {
          id: user.id,
          name: user.username,
          avatar: user.avatar,
          role: "leader",
        },
        content: newMessage,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  if (!district?.isSet) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <MapPin className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          District Not Set
        </h2>
        <p className="text-zinc-400 max-w-md">
          You need to set your district before accessing the community chat.
          This will be done automatically when you first log in.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {district?.name} Community
            </h2>
            <p className="text-sm text-zinc-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {district?.name}, {district?.state}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {members.filter((m) => m.isOnline).length} online
            </span>
            <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender.id === user.id}
              formatTime={formatTime}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="hidden lg:flex w-72 flex-col rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members
          </h3>
          <span className="text-sm text-zinc-400">{members.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
                  {member.name.charAt(0)}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                    member.isOnline ? "bg-green-500" : "bg-zinc-500"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {member.name}
                </p>
                <p className="text-xs text-zinc-500 capitalize">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, isOwn, formatTime }) {
  const isAnnouncement = message.type === "announcement";

  if (isAnnouncement) {
    return (
      <div className="flex justify-center">
        <div className="max-w-lg px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
            <Megaphone className="w-4 h-4" />
            {message.sender.name}
          </div>
          <p className="text-sm text-white">{message.content}</p>
          <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex gap-3 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar */}
        {!isOwn && (
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
            {message.sender.name.charAt(0)}
          </div>
        )}

        {/* Message Content */}
        <div>
          {!isOwn && (
            <p className="text-xs text-zinc-400 mb-1 ml-1">
              {message.sender.name}
              {message.sender.role !== "member" && (
                <span className="ml-2 text-blue-400 capitalize">
                  ({message.sender.role})
                </span>
              )}
            </p>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isOwn
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-zinc-800 text-white rounded-bl-md"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>
          <p
            className={`text-xs text-zinc-500 mt-1 ${
              isOwn ? "text-right mr-1" : "ml-1"
            }`}
          >
            {formatTime(message.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CommunityChat;
