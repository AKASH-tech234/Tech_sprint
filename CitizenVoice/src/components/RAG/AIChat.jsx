/**
 * AI Chat Interface
 * Full-page chat interface for the RAG transparency system
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Bot,
  User,
  Trash2,
  HelpCircle,
  ArrowDown,
  Info,
} from "lucide-react";
import { ragService } from "../../services/ragService";
import { cn } from "../../lib/utils";

// Suggested quick questions
const QUICK_QUESTIONS = [
  {
    label: "How does reporting work?",
    query: "What happens after I report an issue? What are the steps?",
  },
  {
    label: "Typical resolution time?",
    query: "How long do issues typically take to get resolved?",
  },
  {
    label: "Department performance",
    query: "How well are departments performing in resolving issues?",
  },
  {
    label: "Verification process",
    query: "How does the community verification process work?",
  },
];

/**
 * Single chat message component
 */
function ChatMessage({ message, isLast }) {
  const isUser = message.role === "user";
  const isError = message.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-gradient-to-br from-rose-500 to-violet-500"
            : "bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Sparkles className="h-4 w-4 text-violet-400" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white"
              : isError
              ? "bg-red-500/10 border border-red-500/20 text-red-300"
              : "bg-white/5 border border-white/10 text-gray-200"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Metadata for AI responses */}
        {!isUser && message.metadata && (
          <div className="flex items-center gap-3 px-2 text-xs text-gray-500">
            {message.metadata.confidence && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  message.metadata.confidence === "high"
                    ? "text-green-500"
                    : message.metadata.confidence === "medium"
                    ? "text-yellow-500"
                    : "text-gray-500"
                )}
              >
                {message.metadata.confidence === "high" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {message.metadata.confidence} confidence
              </span>
            )}
            {message.metadata.cached && (
              <span className="text-gray-500">cached</span>
            )}
          </div>
        )}

        {/* Disclaimer */}
        {!isUser && !isError && isLast && message.metadata?.disclaimer && (
          <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10 px-3 py-2 max-w-full">
            <Info className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-500/80">
              {message.metadata.disclaimer}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Main AI Chat component
 */
export function AIChat({ issueId, districtId }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI assistant for CitizenVoice. I can help explain issue statuses, delays, department performance, and how the system works. What would you like to know?",
      metadata: {},
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  // Send message
  const sendMessage = async (text) => {
    const query = text || input.trim();
    if (!query || isLoading) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await ragService.explain({
        query,
        issueId,
        districtId,
      });

      // Add AI response
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: result.data.answer,
            metadata: {
              confidence: result.data.confidence,
              sources: result.data.sources,
              disclaimer: result.data.disclaimer,
              cached: result.data.cached,
            },
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              result.error?.message ||
              "Sorry, I couldn't process your question. Please try again.",
            error: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Please try again later.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question.query);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content:
          "Chat cleared. How can I help you with your civic issues today?",
        metadata: {},
      },
    ]);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-950 to-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-gray-400">
              Ask about issues, delays & performance
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/30">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg hover:bg-violet-600 transition-colors"
          >
            <ArrowDown className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Questions (show when chat is mostly empty) */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-6 pb-3">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q)}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about issues, delays, or performance..."
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-gray-500">
          AI provides explanations only, not official status updates
        </p>
      </div>
    </div>
  );
}

export default AIChat;
