/**
 * AskAI Component
 * Button and modal for asking AI explanations about issues
 */

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Info,
} from "lucide-react";
import { ragService, formatCategory } from "../../services/ragService";
import { cn } from "../../lib/utils";

// Suppress motion unused warning
void motion;

/**
 * Main AskAI Button Component
 */
export function AskAIButton({
  issueId,
  districtId,
  category,
  status,
  variant = "default",
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [ragEnabled, setRagEnabled] = useState(true);

  // Check if RAG is available
  const checkRagStatus = useCallback(async () => {
    const status = await ragService.getStatus();
    setRagEnabled(status?.data?.configured ?? false);
  }, []);

  const handleOpen = () => {
    checkRagStatus();
    setIsOpen(true);
  };

  // Don't render if RAG is not enabled
  if (!ragEnabled) {
    return null;
  }

  const buttonVariants = {
    default:
      "text-rose-400 hover:text-rose-300 text-sm flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors",
    compact:
      "text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10",
    prominent:
      "bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:from-rose-500/30 hover:to-violet-500/30 transition-all border border-rose-500/30",
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(buttonVariants[variant], className)}
        title="Ask AI for explanation"
      >
        <Sparkles className="w-4 h-4" />
        {variant !== "compact" && <span>Ask AI</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <AskAIModal
            onClose={() => setIsOpen(false)}
            issueId={issueId}
            districtId={districtId}
            category={category}
            status={status}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * AI Explanation Modal
 */
function AskAIModal({ onClose, issueId, districtId, category, status }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Suggested questions based on context
  const suggestions = [
    issueId &&
      status === "reported" && {
        label: "Why is this pending?",
        query: `Why is issue ${issueId} still pending?`,
      },
    issueId &&
      status === "in-progress" && {
        label: "When will it be resolved?",
        query: `When is issue ${issueId} likely to be resolved?`,
      },
    category && {
      label: `Is this delay normal?`,
      query: `Is this delay normal for ${formatCategory(category)} issues?`,
    },
    category && {
      label: `Similar issues nearby?`,
      query: `Have there been similar ${formatCategory(
        category
      )} issues reported recently?`,
    },
    {
      label: "How does the process work?",
      query: "What happens after an issue is reported?",
    },
  ].filter(Boolean);

  const askQuestion = async (questionText) => {
    const q = questionText || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await ragService.explain({
        query: q,
        issueId,
        districtId,
      });

      if (result.success) {
        setResponse(result.data);
      } else {
        setError(result.error?.message || "Unable to get explanation");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.query);
    askQuestion(suggestion.query);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-violet-500/20">
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Ask AI</h3>
              <p className="text-xs text-gray-400">
                Get explanations about your issue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Issue Context */}
          {issueId && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-white/5 text-sm">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Asking about:</span>
              <span className="text-white font-medium">{issueId}</span>
              {status && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    status === "resolved"
                      ? "bg-green-500/20 text-green-400"
                      : status === "in-progress"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  )}
                >
                  {status}
                </span>
              )}
            </div>
          )}

          {/* Suggested Questions */}
          {!response && !loading && suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-sm rounded-full bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Query Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about this issue..."
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-violet-400 animate-pulse" />
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Analyzing your question...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => askQuestion()}
                  className="text-xs text-red-300 hover:text-red-200 mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-4">
              {/* Answer */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500/20 to-violet-500/20">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence & Sources */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {response.confidence === "high" && (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      High confidence
                    </span>
                  )}
                  {response.confidence === "medium" && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Clock className="w-3 h-3" />
                      Medium confidence
                    </span>
                  )}
                  {response.confidence === "low" && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <AlertCircle className="w-3 h-3" />
                      Limited data
                    </span>
                  )}
                </div>
                {response.sources?.length > 0 && (
                  <span className="text-gray-500">
                    Based on {response.sources.length} source
                    {response.sources.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400/80">
                  {response.disclaimer ||
                    "This is an AI-generated explanation based on historical data and may not reflect real-time status."}
                </p>
              </div>

              {/* Ask Another */}
              <button
                onClick={() => {
                  setResponse(null);
                  setQuery("");
                }}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
              >
                Ask another question
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/2">
          <p className="text-xs text-gray-500 text-center">
            Powered by AI • Explanations only, not official status
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Inline AI Insight Component (for embedding in issue cards)
 */
export function AskAIInline({ issueId, districtId, category }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    if (insight || loading) return;

    setLoading(true);
    try {
      const result = await ragService.explain({
        query: `Briefly explain the current status of issue ${issueId}`,
        issueId,
        districtId,
      });

      if (result.success) {
        setInsight(result.data?.answer?.substring(0, 150) + "...");
      }
    } catch (err) {
      // Silent fail for inline component
    } finally {
      setLoading(false);
    }
  };

  if (!insight && !loading) {
    return (
      <button
        onClick={fetchInsight}
        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
      >
        <Sparkles className="w-3 h-3" />
        Get AI insight
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-400 mt-2 p-2 rounded bg-white/5">
      <Sparkles className="w-3 h-3 inline mr-1 text-rose-400" />
      {insight}
    </div>
  );
}

export default AskAIButton;
