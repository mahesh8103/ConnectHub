// frontend/src/home/right/AICopilot.jsx
// CREATE THIS NEW FILE

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { summarizeChat, getSmartReplies } from "../../services/aiService";
import useAuth from "../../context/useAuth";
import useTheme from "../../context/useTheme";

// ── Small icon components ─────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CloseIcon = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Suggestion chip component ─────────────────────────────────────────────────
function SuggestionChip({ text, onClick, isDark, index }) {
  return (
    <button
      onClick={() => onClick(text)}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`chip-in text-[12px] px-3.5 py-1.5 rounded-full border
        font-medium whitespace-nowrap cursor-pointer transition-all duration-200
        ${isDark
          ? "border-violet-500/30 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/50"
          : "border-indigo-400/40 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:border-indigo-500/50"
        }`}
    >
      {text}
    </button>
  );
}

// ── Loading dots ──────────────────────────────────────────────────────────────
function LoadingDots({ isDark }) {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-violet-400" : "bg-indigo-400"}`}
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  );
}

// ── Main AICopilot component ──────────────────────────────────────────────────
function AICopilot({
  messages,
  lastMessage,
  onSuggestionClick,
  triggerSummarize,
  otherUserName,
}) {
  const { authUser } = useAuth();
  const { isDark } = useTheme();

  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);

  const authUserIdRef = useRef(authUser?._id);
  const prevTriggerRef = useRef(0);
  const lastProcessedMsgId = useRef(null);

  useEffect(() => {
    authUserIdRef.current = authUser?._id;
  }, [authUser]);

  // Modal animation
  useEffect(() => {
    if (showSummary) {
      setTimeout(() => setSummaryVisible(true), 10);
    } else {
      setSummaryVisible(false);
    }
  }, [showSummary]);

  const closeSummary = useCallback(() => {
    setSummaryVisible(false);
    setTimeout(() => setShowSummary(false), 220);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!showSummary) return;
    const handler = (e) => { if (e.key === "Escape") closeSummary(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSummary, closeSummary]);

  // Build payload for summary API
  const buildSummaryPayload = useCallback((msgs) =>
    msgs.slice(-20).map((m) => ({
      senderName:
        m.senderId?.toString() === authUserIdRef.current?.toString()
          ? "You"
          : otherUserName || "Them",
      text: m.message || "",
      messageType: m.image ? "image" : "text",
    })),
    [otherUserName]
  );

  // Build context for suggestions API
  const buildSuggestionContext = useCallback((msgs) =>
    msgs.slice(-10).map((m) => ({
      senderName:
        m.senderId?.toString() === authUserIdRef.current?.toString()
          ? "You"
          : otherUserName || "Them",
      text: m.message || "",
    })),
    [otherUserName]
  );

  // Is last message from other person?
  const canSuggest = useMemo(() => {
    if (!lastMessage) return false;
    const isFromOther =
      lastMessage.senderId?.toString() !== authUserIdRef.current?.toString();
    return isFromOther && !!lastMessage.message?.trim();
  }, [lastMessage]);

  // Fetch summary
  const fetchSummary = useCallback(async (msgs) => {
    if (!msgs || msgs.length === 0) {
      setSummaryError("No messages to summarize yet.");
      setShowSummary(true);
      return;
    }

    setLoadingSummary(true);
    setSummaryError("");
    setSummary("");

    try {
      const payload = buildSummaryPayload(msgs);
      const data = await summarizeChat(payload);
      setSummary(data.summary || "");
      setShowSummary(true);
    } catch (error) {
      setSummaryError(
        error.response?.data?.message || "Failed to summarize. Try again."
      );
      setShowSummary(true);
    } finally {
      setLoadingSummary(false);
    }
  }, [buildSummaryPayload]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (messageText, msgs) => {
    if (!messageText?.trim()) return;

    setLoadingSuggestions(true);
    setSuggestions([]);

    try {
      const contextMessages = buildSuggestionContext(msgs || []);
      const data = await getSmartReplies(
        messageText,
        otherUserName || "Them",
        contextMessages
      );
      const arr = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(arr.slice(0, 3));
    } catch (error) {
      console.log("Suggestion error:", error.message);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [buildSuggestionContext, otherUserName]);

  // Trigger summary from parent button
  useEffect(() => {
    if (
      triggerSummarize > 0 &&
      triggerSummarize !== prevTriggerRef.current
    ) {
      prevTriggerRef.current = triggerSummarize;
      fetchSummary(messages);
    }
  }, [triggerSummarize, messages, fetchSummary]);

  // Auto suggestions when other person sends message
  useEffect(() => {
    if (!lastMessage) return;

    const isFromOther =
      lastMessage.senderId?.toString() !== authUserIdRef.current?.toString();

    if (!isFromOther) {
      setSuggestions([]);
      return;
    }

    if (!lastMessage.message?.trim()) return;

    if (lastMessage._id && lastMessage._id === lastProcessedMsgId.current) {
      return;
    }

    lastProcessedMsgId.current = lastMessage._id;
    fetchSuggestions(lastMessage.message, messages);
  }, [lastMessage, messages, fetchSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setSuggestions([]);
  };

  const barBg = isDark
    ? "bg-[#0c0c1d]/95 border-[#1e1e3a]"
    : "bg-white/90 border-indigo-100/80";

  return (
    <>
      {/* ── AI Reply Bar ──────────────────────────────────────────────────── */}
      {(canSuggest || loadingSuggestions || suggestions.length > 0) && (
        <div
          className={`px-3 py-2 border-t flex items-center gap-2 flex-wrap
            ${barBg} backdrop-blur-sm`}
        >
          {/* Label + refresh */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold
                ${isDark ? "text-violet-400" : "text-indigo-500"}`}
            >
              <SparkleIcon />
              AI replies
            </span>

            {!loadingSuggestions && canSuggest && (
              <button
                onClick={() => fetchSuggestions(lastMessage.message, messages)}
                className={`p-1 rounded-full transition-all duration-200
                  ${isDark
                    ? "text-gray-500 hover:text-violet-400 hover:bg-violet-500/10"
                    : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"}`}
                title="Refresh suggestions"
              >
                <RefreshIcon />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className={`w-px h-3.5 flex-shrink-0
            ${isDark ? "bg-white/10" : "bg-gray-200"}`}
          />

          {/* Dots or chips */}
          {loadingSuggestions ? (
            <LoadingDots isDark={isDark} />
          ) : (
            <>
              {suggestions.map((s, i) => (
                <SuggestionChip
                  key={`${s}-${i}`}
                  text={s}
                  onClick={handleSuggestionClick}
                  isDark={isDark}
                  index={i}
                />
              ))}

              {suggestions.length > 0 && (
                <button
                  onClick={() => setSuggestions([])}
                  className={`ml-auto p-1 rounded-full
                    ${isDark
                      ? "text-gray-600 hover:text-gray-400"
                      : "text-gray-300 hover:text-gray-500"}`}
                  title="Dismiss"
                >
                  <CloseIcon />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Summary Loading ───────────────────────────────────────────────── */}
      {loadingSummary && (
        <div
          className={`px-4 py-2.5 border-t flex items-center gap-2.5 ${barBg}`}
        >
          <div
            className={`w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0
              ${isDark
                ? "border-violet-500 border-t-transparent"
                : "border-indigo-400 border-t-transparent"}`}
          />
          <span
            className={`text-[12px]
              ${isDark ? "text-violet-400" : "text-indigo-500"}`}
          >
            Reading your conversation...
          </span>
        </div>
      )}

      {/* ── Summary Modal ─────────────────────────────────────────────────── */}
      {showSummary && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[6px]"
          style={{
            zIndex: 9999,
            opacity: summaryVisible ? 1 : 0,
            transition: "opacity 0.22s ease",
          }}
          onClick={closeSummary}
        >
          <div
            className={`w-[92%] max-w-[420px] rounded-2xl overflow-hidden shadow-2xl
              ${isDark
                ? "bg-[#0f0f22] border border-white/8"
                : "bg-white border border-indigo-100"}`}
            style={{
              transform: summaryVisible
                ? "translateY(0) scale(1)"
                : "translateY(12px) scale(0.97)",
              transition:
                "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease",
              opacity: summaryVisible ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <SparkleIcon />
                </div>
                <div>
                  <p className="text-white font-semibold text-[13px] leading-none">
                    Chat Summary
                  </p>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    Last 20 messages · AI generated
                  </p>
                </div>
              </div>
              <button
                onClick={closeSummary}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 max-h-[50vh] overflow-y-auto">
              {summaryError ? (
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl
                    ${isDark ? "bg-red-500/10" : "bg-red-50"}`}
                >
                  <span className="text-red-400 text-lg">⚠</span>
                  <p className="text-red-400 text-[13px] leading-relaxed">
                    {summaryError}
                  </p>
                </div>
              ) : (
                <p
                  className={`text-[14px] leading-[1.85]
                    ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {summary}
                </p>
              )}
            </div>

            {/* Footer */}
            <div
              className={`px-5 py-3.5 border-t flex items-center justify-between
                ${isDark ? "border-white/5" : "border-gray-100"}`}
            >
              <button
                onClick={() => fetchSummary(messages)}
                disabled={loadingSummary}
                className={`text-[12px] flex items-center gap-1.5 transition-colors
                  disabled:opacity-40
                  ${isDark
                    ? "text-violet-400 hover:text-violet-300"
                    : "text-indigo-500 hover:text-indigo-600"}`}
              >
                <RefreshIcon />
                Refresh
              </button>
              <button
                onClick={closeSummary}
                className="text-[12px] px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white hover:opacity-90 transition-opacity font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS ───────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes chipIn {
          from { opacity: 0; transform: translateY(4px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chip-in {
          animation: chipIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
      `}</style>
    </>
  );
}

export default AICopilot;