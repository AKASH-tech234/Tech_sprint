// src/components/Dashboard/Community/CommunityChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { communityChatService } from '../../../services/communityChatService';
import { parseDistrictId } from '../../../services/districtService';
import { 
  Send, 
  Loader2, 
  MessageCircle, 
  ThumbsUp, 
  Heart, 
  Smile,
  AlertCircle,
  MapPin,
  RefreshCw,
  Share2
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export function CommunityChat({ districtId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Parse district info for display
  const districtInfo = parseDistrictId(districtId);

  // Fetch messages on mount and when districtId changes
  useEffect(() => {
    if (districtId) {
      fetchMessages();
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [districtId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (loadMore = false) => {
    if (!districtId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const options = { limit: 50 };
      if (loadMore && messages.length > 0) {
        options.before = messages[0].createdAt;
      }
      
      const response = await communityChatService.getMessages(districtId, options);
      
      if (loadMore) {
        setMessages(prev => [...response.messages, ...prev]);
      } else {
        setMessages(response.messages || []);
      }
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !districtId || sending) return;
    
    try {
      setSending(true);
      setError(null);
      
      const response = await communityChatService.sendTextMessage(districtId, newMessage.trim());
      
      if (response.message) {
        setMessages(prev => [...prev, response.message]);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId, reaction) => {
    try {
      await communityChatService.reactToMessage(messageId, reaction);
      // Refetch messages to update reactions
      fetchMessages();
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const formatTime = (timestamp) => {
    return communityChatService.formatTime(timestamp);
  };

  // No district selected state
  if (!districtId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 rounded-xl border border-white/10 bg-white/5 p-8">
        <MapPin className="h-12 w-12 text-white/40 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Select a District</h3>
        <p className="text-white/60 text-center">
          Choose a district from the dropdown above to join the local community chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-white/10 bg-white/5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5 text-rose-400" />
          <div>
            <h3 className="font-semibold text-white">Community Chat</h3>
            <p className="text-xs text-white/60">
              {districtInfo.district}, {districtInfo.state}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchMessages()}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4 text-white/60", loading && "animate-spin")} />
        </button>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load More Button */}
        {hasMore && !loading && (
          <button
            onClick={() => fetchMessages(true)}
            className="w-full py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Load older messages...
          </button>
        )}

        {/* Loading State */}
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-rose-400" />
          </div>
        )}

        {/* Empty State */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/60">No messages yet</p>
            <p className="text-white/40 text-sm">Be the first to start the conversation!</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          const isOwn = msg.sender?._id === user?._id;
          
          return (
            <div
              key={msg._id}
              className={cn(
                "flex gap-3",
                isOwn ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {msg.sender?.avatar ? (
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-rose-400">
                      {msg.sender?.username?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white/80">
                    {msg.sender?.displayName || msg.sender?.username || 'User'}
                  </span>
                  <span className="text-xs text-white/40">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                <div
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    isOwn 
                      ? "bg-rose-500 text-white rounded-tr-sm" 
                      : "bg-white/10 text-white rounded-tl-sm"
                  )}
                >
                  {/* Issue Share */}
                  {msg.type === 'issue_share' && msg.sharedIssue && (
                    <div className="mb-2 p-2 rounded-lg bg-black/20">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-3 w-3 text-white/60" />
                        <span className="text-xs text-white/60">Shared Issue</span>
                      </div>
                      <p className="text-sm font-medium mt-1">{msg.sharedIssue.title}</p>
                      <span className="text-xs text-white/60">{msg.sharedIssue.issueId}</span>
                    </div>
                  )}

                  {/* Image */}
                  {msg.type === 'image' && msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Shared image"
                      className="rounded-lg max-w-full mb-2"
                    />
                  )}

                  {/* Text */}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                </div>

                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {msg.reactions.slice(0, 3).map((r, i) => (
                      <span key={i} className="text-xs">
                        {r.reaction === 'like' ? '👍' : r.reaction === 'helpful' ? '💡' : '❤️'}
                      </span>
                    ))}
                    {msg.reactions.length > 3 && (
                      <span className="text-xs text-white/40">+{msg.reactions.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Quick Reactions (for others' messages) */}
                {!isOwn && (
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReaction(msg._id, 'like')}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <ThumbsUp className="h-3 w-3 text-white/40" />
                    </button>
                    <button
                      onClick={() => handleReaction(msg._id, 'support')}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      <Heart className="h-3 w-3 text-white/40" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={cn(
              "p-2 rounded-full transition-colors",
              newMessage.trim() && !sending
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "bg-white/10 text-white/40"
            )}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommunityChat;
