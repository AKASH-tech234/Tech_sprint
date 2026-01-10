/**
 * Floating AI Chat Button
 * A floating button that appears in the bottom-right corner
 * Opens a slide-up chat panel for quick AI queries
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot, User, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ragService } from "../../services/ragService";
import { cn } from "../../lib/utils";

// Quick suggestions for the mini chat
const MINI_SUGGESTIONS = [
  "Why is my issue delayed?",
  "How does verification work?",
  "Average resolution time?",
];

/**
 * Floating AI Chat Button with expandable chat panel
 */
export function FloatingAIButton({
  issueId,
  districtId,
  fullPagePath = "/dashboard/citizen/ai",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! Ask me anything about your issues or the platform.",
        },
      ]);
    }
  };

  const sendMessage = async (text) => {
    const query = text || input.trim();
    if (!query || isLoading) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: query },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await ragService.explain({
        query,
        issueId,
        districtId,
      });

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: result.data.answer,
            confidence: result.data.confidence,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              result.error?.message || "Sorry, I couldn't understand that.",
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
          content: "Something went wrong. Please try again.",
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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={toggleOpen}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          isOpen
            ? "bg-gray-800 hover:bg-gray-700"
            : "bg-gradient-to-r from-rose-500 to-violet-500 hover:shadow-xl hover:shadow-violet-500/20"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-rose-500/20">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-gray-500">Ask anything</p>
                </div>
              </div>
              <Link
                to={fullPagePath}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Maximize2 className="h-3 w-3" />
                Full view
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-rose-500 to-violet-500"
                        : "bg-violet-500/20"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3 w-3 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 text-violet-400" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-rose-500 to-violet-500 text-white"
                        : msg.error
                        ? "bg-red-500/10 border border-red-500/20 text-red-300"
                        : "bg-white/5 text-gray-200"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                    <Bot className="h-3 w-3 text-violet-400" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (show when messages are few) */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {MINI_SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingAIButton;
