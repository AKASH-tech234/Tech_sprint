// src/components/Dashboard/Official/TeamChat.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, MessageSquare, User, Search, 
  MoreVertical, Phone, Video, Loader2, Check, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const TeamChat = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if opened directly from team management (direct chat mode)
  const directChatMode = location.state?.member ? true : false;
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🟢 Socket connected');
      if (user?.id) {
        newSocket.emit('join', user.id);
      }
    });

    newSocket.on('receiveMessage', (message) => {
      console.log('📨 Received message via socket:', message);
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        
        return [...prev, {
          _id: message._id,
          from: { _id: message.senderId },
          to: { _id: message.receiverId },
          message: message.message,
          timestamp: message.createdAt,
          read: false,
        }];
      });
      
      // Update conversation list with new message
      setConversations(prev => prev.map(conv => {
        if (conv.recipientId === message.senderId || conv.recipientId === message.receiverId) {
          return {
            ...conv,
            lastMessage: message.message,
            lastMessageTime: message.createdAt,
            unreadCount: conv.recipientId === message.senderId ? (conv.unreadCount || 0) + 1 : conv.unreadCount
          };
        }
        return conv;
      }));
    });

    // Handle message sent confirmation
    newSocket.on('messageSent', (message) => {
      console.log('✅ Message sent confirmed via socket:', message);
      // Update pending message with confirmed data
      setMessages(prev => prev.map(msg => {
        if (msg.pending && msg.message === message.message && msg.to._id === message.receiverId) {
          return { ...msg, _id: message._id, pending: false };
        }
        return msg;
      }));
    });

    // Handle message errors
    newSocket.on('messageError', (error) => {
      console.error('❌ Message error:', error);
    });

    newSocket.on('userOnline', (userId) => {
      console.log('🟢 User online:', userId);
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('userOffline', (userId) => {
      console.log('🔴 User offline:', userId);
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Typing indicators
    newSocket.on('userTyping', ({ userId }) => {
      console.log('✍️ User typing:', userId);
      setTypingUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('userStoppedTyping', ({ userId }) => {
      console.log('⏹️ User stopped typing:', userId);
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Load conversations (team members for team leader, or team leader for team member)
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.recipientId);
    }
  }, [selectedConversation]);

  // Auto-select conversation from URL param or location state
  useEffect(() => {
    const memberFromState = location.state?.member;
    
    // If member is passed directly, create a temporary conversation and select it
    if (memberFromState && !selectedConversation) {
      const memberId = memberFromState.userId || memberFromState._id || memberFromState.id;
      
      // Check if conversation already exists
      const existingConv = conversations.find(c => 
        c.recipientId === memberId || 
        c.recipientId === memberFromState._id ||
        c.recipientId === memberFromState.userId ||
        c.email === memberFromState.email
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else if (memberId) {
        // Create a temporary conversation for immediate chat
        setSelectedConversation({
          recipientId: memberId,
          name: memberFromState.name || memberFromState.username,
          email: memberFromState.email,
          avatar: memberFromState.avatar || memberFromState.name?.slice(0, 2).toUpperCase(),
          role: memberFromState.role || memberFromState.designation,
          lastMessage: null,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        });
      }
    } else if (memberId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.recipientId === memberId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [conversations, memberId, location.state, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data?.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (recipientId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${recipientId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await fetch(`${API_BASE_URL}/messages/${recipientId}/mark-read`, {
          method: 'PATCH',
          credentials: 'include',
        });
        
        // Update unread count in conversations
        setConversations(prev => prev.map(conv => 
          conv.recipientId === recipientId ? { ...conv, unreadCount: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    // Optimistic update
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      from: { _id: user.id },
      to: { _id: selectedConversation.recipientId },
      message: messageText,
      timestamp: new Date().toISOString(),
      read: false,
      pending: true,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Use Socket.IO for real-time delivery (backend saves to DB)
      if (socket?.connected) {
        console.log('📤 Sending via Socket.IO:', { to: selectedConversation.recipientId, message: messageText });
        socket.emit('sendMessage', {
          senderId: user.id,
          receiverId: selectedConversation.recipientId,
          message: messageText,
        });
        
        // Update conversation list optimistically
        setConversations(prev => prev.map(conv => 
          conv.recipientId === selectedConversation.recipientId
            ? { ...conv, lastMessage: messageText, lastMessageTime: new Date().toISOString() }
            : conv
        ));
      } else {
        // Fallback to API if socket not connected
        console.log('📤 Sending via API (socket not connected)');
        const response = await fetch(`${API_BASE_URL}/messages/send`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: selectedConversation.recipientId,
            message: messageText,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update the temp message with real data
          setMessages(prev => prev.map(msg => 
            msg._id === tempMessage._id 
              ? { ...msg, _id: data.data?._id || msg._id, pending: false }
              : msg
          ));
          
          // Update conversation list
          setConversations(prev => prev.map(conv => 
            conv.recipientId === selectedConversation.recipientId
              ? { ...conv, lastMessage: messageText, lastMessageTime: new Date().toISOString() }
              : conv
          ));
        } else {
          throw new Error('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!socket?.connected || !selectedConversation) return;
    
    socket.emit('typing', {
      senderId: user.id,
      receiverId: selectedConversation.recipientId,
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        senderId: user.id,
        receiverId: selectedConversation.recipientId,
      });
    }, 2000);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isOnline = (recipientId) => onlineUsers.includes(recipientId);

  // Direct chat mode - show only the chat section (no sidebar)
  if (directChatMode && selectedConversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex h-screen">
          {/* Chat Area - Full Width */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {selectedConversation.avatar || selectedConversation.name?.slice(0, 2).toUpperCase()}
                    </div>
                    {isOnline(selectedConversation.recipientId) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedConversation.name}</h2>
                    <p className="text-sm text-gray-400">{selectedConversation.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-16 h-16 text-purple-400/50 mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.from?._id === user?.id;
                  return (
                    <motion.div
                      key={msg._id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md' 
                          : 'bg-white/10 text-white rounded-bl-md'
                      }`}>
                        <p>{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${isMe ? 'text-white/70 justify-end' : 'text-gray-400'}`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && (msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            {typingUsers.includes(selectedConversation.recipientId) && (
              <div className="px-4 py-2 text-sm text-purple-300 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span>{selectedConversation.name} is typing...</span>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex h-screen">
        {/* Conversations Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">Conversations</h1>
              </div>
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add team members from Team Management to start chatting
                </p>
                <button
                  onClick={() => navigate('/dashboard/official/team')}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                >
                  Go to Team Management
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.recipientId}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all text-left ${
                      selectedConversation?.recipientId === conv.recipientId ? 'bg-white/10' : ''
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {conv.avatar || conv.name?.slice(0, 2).toUpperCase()}
                      </div>
                      {isOnline(conv.recipientId) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white truncate">{conv.name}</h3>
                        <span className="text-xs text-gray-400">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[20px] h-5 flex items-center justify-center bg-purple-500 text-white text-xs rounded-full px-1.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {selectedConversation.avatar || selectedConversation.name?.slice(0, 2).toUpperCase()}
                      </div>
                      {isOnline(selectedConversation.recipientId) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">{selectedConversation.name}</h2>
                      <p className="text-xs text-gray-400">
                        {isOnline(selectedConversation.recipientId) ? 'Online' : selectedConversation.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                      <MessageSquare className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">Start a conversation</h3>
                    <p className="text-gray-400 text-sm">Send a message to {selectedConversation.name}</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.from?._id === user?.id || msg.sender === user?.id;
                    const showDate = idx === 0 || 
                      new Date(messages[idx - 1]?.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                    
                    return (
                      <div key={msg._id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md'
                                : 'bg-white/10 text-gray-200 rounded-bl-md'
                            } ${msg.pending ? 'opacity-70' : ''}`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                msg.pending ? (
                                  <Loader2 className="w-3 h-3 animate-spin opacity-70" />
                                ) : msg.read ? (
                                  <CheckCheck className="w-3 h-3 text-blue-300" />
                                ) : (
                                  <Check className="w-3 h-3 opacity-70" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicator */}
              {selectedConversation && typingUsers.includes(selectedConversation.recipientId) && (
                <div className="px-4 py-2 text-sm text-purple-300 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  <span>{selectedConversation.name} is typing...</span>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Team Chat</h2>
              <p className="text-gray-400 max-w-md">
                Select a conversation from the sidebar to start chatting with your team members
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { TeamChat };
