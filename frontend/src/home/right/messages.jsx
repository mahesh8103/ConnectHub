import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import Message from "./message";
import useAuth from "../../context/useAuth";
import useSocket from "../../context/useSocket";

const LIMIT = 20;

function Messages({
  refreshKey,
  onLastMessage,
  onMessagesUpdate,
  scrollToMessageId,
  onScrollComplete,
}) {
  const { selectedUser, authUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isFetchingRef = useRef(false);
  const selectedUserRef = useRef(selectedUser);
  const onLastMessageRef = useRef(onLastMessage);
  const onMessagesUpdateRef = useRef(onMessagesUpdate);
  const messageRefs = useRef({});
  const authUserIdRef = useRef(authUser?._id);
  const activeRequestRef = useRef(0);

  useEffect(() => {
    authUserIdRef.current = authUser?._id;
  }, [authUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    onLastMessageRef.current = onLastMessage;
  }, [onLastMessage]);

  useEffect(() => {
    onMessagesUpdateRef.current = onMessagesUpdate;
  }, [onMessagesUpdate]);

  const scrollToBottom = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior });
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!scrollToMessageId) return;
    const el = messageRefs.current[scrollToMessageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(scrollToMessageId);
      setTimeout(() => {
        setHighlightedId(null);
        onScrollComplete?.();
      }, 2000);
    } else {
      onScrollComplete?.();
    }
  }, [scrollToMessageId, onScrollComplete]);

  useEffect(() => {
    if (!selectedUser) return;

    const requestId = ++activeRequestRef.current;

    const fetchMessages = async () => {
      setIsInitialLoad(true);
      setMessages([]);
      setSkip(0);
      setHasMore(true);
      isFetchingRef.current = false;

      try {
        const res = await axios.get(
          `http://localhost:5002/messages/${selectedUser._id}?skip=0`,
          { withCredentials: true }
        );

        if (requestId !== activeRequestRef.current) return;

        const data = res.data.data;
        setMessages(data);
        onMessagesUpdateRef.current?.(data);

        if (data.length > 0) {
          onLastMessageRef.current?.(data[data.length - 1]);
        }

        await axios.post(
          `http://localhost:5002/messages/${selectedUser._id}/seen`,
          {},
          { withCredentials: true }
        );

        if (data.length < LIMIT) setHasMore(false);
      } catch (error) {
        console.error(
          error.response?.data?.message || "Failed to fetch messages"
        );
      } finally {
        if (requestId === activeRequestRef.current) {
          setIsInitialLoad(false);
        }
      }
    };

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!isInitialLoad) {
      scrollToBottom("auto");
    }
  }, [isInitialLoad, scrollToBottom]);

  useEffect(() => {
    if (!refreshKey || refreshKey === 0 || !selectedUser) return;

    const requestId = ++activeRequestRef.current;

    const fetchLatest = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5002/messages/${selectedUser._id}?skip=0`,
          { withCredentials: true }
        );

        if (requestId !== activeRequestRef.current) return;

        const data = res.data.data;
        setMessages(data);
        onMessagesUpdateRef.current?.(data);

        if (data.length > 0) {
          onLastMessageRef.current?.(data[data.length - 1]);
        }

        setSkip(0);
        if (data.length < LIMIT) setHasMore(false);
        setTimeout(() => scrollToBottom("smooth"), 80);
      } catch (error) {
        console.error("Failed to refresh messages", error);
      }
    };

    fetchLatest();
  }, [refreshKey]);

  const handleScroll = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) return;
    if (!hasMore) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoadingOlder(true);

    const newSkip = skip + LIMIT;

    try {
      const res = await axios.get(
        `http://localhost:5002/messages/${selectedUserRef.current._id}?skip=${newSkip}`,
        { withCredentials: true }
      );
      const older = res.data.data;
      if (older.length < LIMIT) setHasMore(false);
      if (older.length === 0) return;

      const oldScrollHeight = container.scrollHeight;

      setMessages((prev) => {
        const updated = [...older, ...prev];
        onMessagesUpdateRef.current?.(updated);
        return updated;
      });

      setSkip(newSkip);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }
        });
      });
    } catch (error) {
      console.error("Failed to load older messages", error);
    } finally {
      setIsLoadingOlder(false);
      isFetchingRef.current = false;
    }
  }, [skip, hasMore]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const currentSelectedUser = selectedUserRef.current;
      if (String(newMessage.senderId) === String(currentSelectedUser?._id)) {
        setMessages((prev) => {
          const updated = [...prev, newMessage];
          onMessagesUpdateRef.current?.(updated);
          return updated;
        });
        onLastMessageRef.current?.(newMessage);
        setTimeout(() => scrollToBottom("smooth"), 50);

        axios
          .post(
            `http://localhost:5002/messages/${currentSelectedUser._id}/seen`,
            {},
            { withCredentials: true }
          )
          .catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;

    const handleDelivered = ({ messageIds = [] }) => {
      if (!messageIds.length) return;
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(String(msg._id))
            ? { ...msg, status: "delivered" }
            : msg
        )
      );
    };

    const handleSeen = ({ messageIds = [] }) => {
      if (!messageIds.length) return;
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(String(msg._id))
            ? { ...msg, status: "seen" }
            : msg
        )
      );
    };

    socket.on("messagesDelivered", handleDelivered);
    socket.on("messagesSeen", handleSeen);

    return () => {
      socket.off("messagesDelivered", handleDelivered);
      socket.off("messagesSeen", handleSeen);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, message: "", image: "" }
            : msg
        )
      );
    };

    const handleMessageReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    };

    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReacted", handleMessageReacted);

    return () => {
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReacted", handleMessageReacted);
    };
  }, [socket]);

  const handleDelete = useCallback((messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId
          ? { ...msg, isDeleted: true, message: "", image: "" }
          : msg
      )
    );
  }, []);

  const handleReact = useCallback((messageId, reactions) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === messageId ? { ...msg, reactions } : msg
      )
    );
  }, []);

  const formatDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupMessagesByDate = (msgs) => {
    const result = [];
    let lastDateStr = null;
    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toDateString();
      if (dateStr !== lastDateStr) {
        result.push({
          type: "separator",
          date: msgDate,
          key: `sep-${dateStr}`,
        });
        lastDateStr = dateStr;
      }
      result.push({ type: "message", data: msg, key: msg._id });
    });
    return result;
  };

  const groupedMessages = useMemo(
    () => groupMessagesByDate(messages),
    [messages]
  );

  if (!selectedUser) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col gap-1 h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
    >
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <p className="text-gray-700 text-xs text-center py-2">
          Start of conversation
        </p>
      )}

      {messages.length === 0 && !isInitialLoad && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No messages yet. Say hi!
        </p>
      )}

      {groupedMessages.map((item) => {
        if (item.type === "separator") {
          return (
            <div key={item.key} className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[11px] text-gray-500 font-medium px-2 flex-shrink-0">
                {formatDateLabel(item.date)}
              </span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
          );
        }

        const isHighlighted = item.data._id === highlightedId;

        return (
          <div
            key={item.key}
            ref={(el) => {
              if (el) messageRefs.current[item.data._id] = el;
            }}
            style={{
              borderRadius: "12px",
              transition: "background 0.3s ease",
              background: isHighlighted
                ? "rgba(139, 92, 246, 0.15)"
                : "transparent",
              outline: isHighlighted
                ? "1px solid rgba(139,92,246,0.3)"
                : "none",
            }}
          >
            <Message
              message={item.data}
              onDelete={handleDelete}
              onReact={handleReact}
            />
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

export default Messages;