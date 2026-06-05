import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { summarizeChat, getSmartReplies } from "../../services/aiService";
import useAuth from "../../context/useAuth";
import useTheme from "../../context/useTheme";

const SparkleIcon = () => (
  <svg
    width={13}
    height={13}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width={11}
    height={11}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width={11}
    height={11}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function SuggestionChip({ text, onClick, isDark, index }) {
  return (
    <button
      onClick={() => onClick(text)}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`chip-in text-[12px] px-3.5 py-1.5 rounded-full border
        font-medium whitespace-nowrap cursor-pointer transition-all duration-200
        ${
          isDark
            ? "border-violet-500/30 text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-400/50"
            : "border-indigo-400/40 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:border-indigo-500/50"
        }`}
    >
      {text}
    </button>
  );
}

function LoadingDots({ isDark }) {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            isDark ? "bg-violet-400" : "bg-indigo-400"
          }`}
          style={{
            animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function useTypewriter(fullText, isStreaming) {
  const [displayed, setDisplayed] = useState("");
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // Clear any running timer first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Not streaming — just show full text immediately via ref trick
    if (!isStreaming || !fullText) {
      indexRef.current = 0;
      // Schedule the reset outside the synchronous effect body
      timeoutRef.current = setTimeout(() => {
        setDisplayed(fullText || "");
      }, 0);
      return () => clearTimeout(timeoutRef.current);
    }

    // Streaming — reveal one word at a time
    const words = fullText.split(/\s+/).filter(Boolean);
    indexRef.current = 0;

    const tick = () => {
      const i = indexRef.current;

      if (i >= words.length) return;

      const word = words[i];
      indexRef.current = i + 1;

      setDisplayed((prev) => (prev ? `${prev} ${word}` : word));

      if (indexRef.current < words.length) {
        timeoutRef.current = setTimeout(tick, 40);
      }
    };

    // First word is also scheduled, never called synchronously
    timeoutRef.current = setTimeout(tick, 40);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fullText, isStreaming]);

  return displayed;
}

const getChatMode = (messages, lastMessage, authUserId) => {
  if (!messages || messages.length === 0) return "starter";
  if (!lastMessage) return null;

  const isLastMine =
    lastMessage.senderId?.toString() === authUserId?.toString();

  if (isLastMine) return "followup";
  if (lastMessage.message?.trim()) return "reply";

  return null;
};

const buildPrompt = (mode, lastMessage, otherUserName, contextText) => {
  if (mode === "starter") {
    return `You are helping someone start a conversation with "${
      otherUserName || "someone new"
    }".

Give exactly 3 short natural opening messages they could send first.

Rules:
- Casual and friendly texting style
- Each under 10 words
- Make them feel warm and easy to respond to
- Vary the tone: one playful, one curious, one simple
- NEVER use: "Hey there" "Greetings" "Hello friend"

Return ONLY this JSON:
{"suggestions": ["opener 1", "opener 2", "opener 3"]}`;
  }

  if (mode === "followup") {
    return `You are helping someone keep a conversation going with "${
      otherUserName || "them"
    }".

Recent conversation:
${contextText || "(no prior context)"}

Their last message was from YOU. Help continue the conversation.

Give exactly 3 short natural follow-up messages to send next.

Rules:
- Casual texting style
- Each under 12 words
- One adds new info, one asks something, one is light/fun
- Be specific to what was discussed
- NEVER use: "Sure" "Sounds good" "Okay" "Tell me more"

Return ONLY this JSON:
{"suggestions": ["followup 1", "followup 2", "followup 3"]}`;
  }

  return `You are helping someone reply to a chat message. Give exactly 3 short natural reply suggestions.

Conversation context:
${contextText || "(no prior context)"}

Latest message from ${otherUserName || "them"}:
"${lastMessage?.message || ""}"

Rules:
- Reply 1: warm and enthusiastic response
- Reply 2: curious follow-up question
- Reply 3: short and direct under 6 words
- Must be SPECIFIC to what is being discussed
- Casual natural texting style
- Under 12 words each
- NEVER use: "Sure" "Sounds good" "Okay" "Tell me more"

Return ONLY this JSON:
{"suggestions": ["reply 1", "reply 2", "reply 3"]}`;
};

const getModeLabel = (mode) => {
  if (mode === "starter") return "Start with";
  if (mode === "followup") return "Keep going";
  return "AI replies";
};

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState(null);

  const authUserIdRef = useRef(authUser?._id);
  const prevTriggerRef = useRef(0);
  const lastProcessedMsgId = useRef(null);
  const prevModeRef = useRef(null);
  const prevOtherUserRef = useRef(otherUserName);

  const currentAuthUserId = authUser?._id;
  const streamedSummary = useTypewriter(summary, isStreaming);

  useEffect(() => {
    authUserIdRef.current = authUser?._id;
  }, [authUser]);

  useEffect(() => {
    if (showSummary) {
      setTimeout(() => setSummaryVisible(true), 10);
    } else {
      setSummaryVisible(false);
    }
  }, [showSummary]);

  const closeSummary = useCallback(() => {
    setSummaryVisible(false);
    setIsStreaming(false);
    setTimeout(() => setShowSummary(false), 220);
  }, []);

  useEffect(() => {
    if (!showSummary) return;

    const handler = (e) => {
      if (e.key === "Escape") closeSummary();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSummary, closeSummary]);

  const buildSummaryPayload = useCallback(
    (msgs) =>
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

  const buildSuggestionContext = useCallback(
    (msgs) =>
      msgs.slice(-10).map((m) => ({
        senderName:
          m.senderId?.toString() === authUserIdRef.current?.toString()
            ? "You"
            : otherUserName || "Them",
        text: m.message || "",
      })),
    [otherUserName]
  );

  const chatMode = useMemo(
    () => getChatMode(messages, lastMessage, currentAuthUserId),
    [messages, lastMessage, currentAuthUserId]
  );

  const fetchSuggestions = useCallback(
    async (mode, msgs) => {
      if (!mode) return;

      setLoadingSuggestions(true);
      setSuggestions([]);
      setCurrentMode(mode);

      const contextMessages = buildSuggestionContext(msgs || []);
      const contextText = contextMessages
        .map((m) => `${m.senderName}: ${m.text}`)
        .filter(Boolean)
        .join("\n");

      const promptText = buildPrompt(
        mode,
        lastMessage,
        otherUserName,
        contextText
      );

      const triggerMessage =
        mode === "starter"
          ? `__starter__${otherUserName || "them"}`
          : lastMessage?.message || "";

      try {
        const data = await getSmartReplies(
          triggerMessage,
          otherUserName || "Them",
          contextMessages,
          promptText
        );

        const arr = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(arr.slice(0, 3));
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [buildSuggestionContext, lastMessage, otherUserName]
  );

  const fetchSummary = useCallback(
    async (msgs) => {
      if (!msgs || msgs.length === 0) {
        setSummaryError("No messages to summarize yet.");
        setShowSummary(true);
        return;
      }

      setLoadingSummary(true);
      setSummaryError("");
      setSummary("");
      setIsStreaming(false);

      try {
        const payload = buildSummaryPayload(msgs);
        const data = await summarizeChat(payload);
        const result = data.summary || "";

        setShowSummary(true);
        setLoadingSummary(false);

        setTimeout(() => {
          setSummary(result);
          setIsStreaming(true);
        }, 300);
      } catch {
        setSummaryError("Failed to summarize. Try again.");
        setShowSummary(true);
        setLoadingSummary(false);
      }
    },
    [buildSummaryPayload]
  );

  useEffect(() => {
    if (
      triggerSummarize > 0 &&
      triggerSummarize !== prevTriggerRef.current
    ) {
      prevTriggerRef.current = triggerSummarize;
      fetchSummary(messages);
    }
  }, [triggerSummarize, messages, fetchSummary]);

  useEffect(() => {
    const mode = getChatMode(messages, lastMessage, currentAuthUserId);

    if (otherUserName !== prevOtherUserRef.current) {
      prevOtherUserRef.current = otherUserName;
      prevModeRef.current = null;
      lastProcessedMsgId.current = null;
      setSuggestions([]);

      if (mode) fetchSuggestions(mode, messages);
      return;
    }

    if (mode === "starter") {
      if (prevModeRef.current !== "starter") {
        prevModeRef.current = "starter";
        fetchSuggestions("starter", messages);
      }
      return;
    }

    if (mode === "followup") {
      const lastId = lastMessage?._id;

      if (lastId && lastId !== lastProcessedMsgId.current) {
        lastProcessedMsgId.current = lastId;
        prevModeRef.current = "followup";
        fetchSuggestions("followup", messages);
      }
      return;
    }

    if (mode === "reply") {
      const lastId = lastMessage?._id;

      if (lastId && lastId !== lastProcessedMsgId.current) {
        lastProcessedMsgId.current = lastId;
        prevModeRef.current = "reply";
        fetchSuggestions("reply", messages);
      }
      return;
    }

    setSuggestions([]);
    prevModeRef.current = null;
  }, [
    lastMessage,
    messages,
    otherUserName,
    fetchSuggestions,
    currentAuthUserId,
  ]);

  const handleSuggestionClick = (suggestion) => {
    onSuggestionClick(suggestion);
    setSuggestions([]);
  };

  const barBg = isDark
    ? "bg-[#0c0c1d]/95 border-[#1e1e3a]"
    : "bg-white/90 border-indigo-100/80";

  const stillStreaming = isStreaming && streamedSummary !== summary;
  const showBar =
    loadingSuggestions || suggestions.length > 0 || chatMode !== null;

  return (
    <>
      {showBar && (
        <div
          className={`px-3 py-2 border-t flex items-center gap-2 flex-wrap
            ${barBg} backdrop-blur-sm`}
        >
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={`flex items-center gap-1 text-[11px] font-semibold
                ${isDark ? "text-violet-400" : "text-indigo-500"}`}
            >
              <SparkleIcon />
              {getModeLabel(currentMode || chatMode)}
            </span>

            {!loadingSuggestions && (
              <button
                onClick={() => fetchSuggestions(chatMode, messages)}
                className={`p-1 rounded-full transition-all duration-200
                  ${
                    isDark
                      ? "text-gray-500 hover:text-violet-400 hover:bg-violet-500/10"
                      : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"
                  }`}
                title="Refresh suggestions"
              >
                <RefreshIcon />
              </button>
            )}
          </div>

          <div
            className={`w-px h-3.5 flex-shrink-0 ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
          />

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
                  className={`ml-auto p-1 rounded-full ${
                    isDark
                      ? "text-gray-600 hover:text-gray-400"
                      : "text-gray-300 hover:text-gray-500"
                  }`}
                  title="Dismiss"
                >
                  <CloseIcon />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {loadingSummary && (
        <div
          className={`px-4 py-2.5 border-t flex items-center gap-2.5 ${barBg}`}
        >
          <div
            className={`w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0
              ${
                isDark
                  ? "border-violet-500 border-t-transparent"
                  : "border-indigo-400 border-t-transparent"
              }`}
          />
          <span
            className={`text-[12px] ${
              isDark ? "text-violet-400" : "text-indigo-500"
            }`}
          >
            Reading your conversation...
          </span>
        </div>
      )}

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
              ${
                isDark
                  ? "bg-[#0f0f22] border border-white/8"
                  : "bg-white border border-indigo-100"
              }`}
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

            <div className="px-5 py-5 max-h-[50vh] overflow-y-auto">
              {summaryError ? (
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl ${
                    isDark ? "bg-red-500/10" : "bg-red-50"
                  }`}
                >
                  <span className="text-red-400 text-lg">!</span>
                  <p className="text-red-400 text-[13px] leading-relaxed">
                    {summaryError}
                  </p>
                </div>
              ) : (
                <p
                  className={`text-[14px] leading-[1.85] min-h-[3rem] ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {streamedSummary}
                  {stillStreaming && (
                    <span
                      className={`inline-block w-[2px] h-[1em] ml-[2px] align-middle rounded-sm ${
                        isDark ? "bg-violet-400" : "bg-indigo-400"
                      }`}
                      style={{
                        animation: "cursorBlink 0.8s step-end infinite",
                      }}
                    />
                  )}
                </p>
              )}
            </div>

            <div
              className={`px-5 py-3.5 border-t flex items-center justify-between ${
                isDark ? "border-white/5" : "border-gray-100"
              }`}
            >
              <button
                onClick={() => fetchSummary(messages)}
                disabled={loadingSummary || stillStreaming}
                className={`text-[12px] flex items-center gap-1.5 transition-colors
                  disabled:opacity-40
                  ${
                    isDark
                      ? "text-violet-400 hover:text-violet-300"
                      : "text-indigo-500 hover:text-indigo-600"
                  }`}
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

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes chipIn {
          from { opacity: 0; transform: translateY(4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .chip-in {
          animation: chipIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
      `}</style>
    </>
  );
}

export default AICopilot;