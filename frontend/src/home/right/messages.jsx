import React, { useEffect, useState, useRef, useCallback } from 'react'
import axios from 'axios'
import Message from './message'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket'

const LIMIT = 20;

function Messages({ refreshKey }) {
  const { selectedUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isFetchingRef = useRef(false); // blocks duplicate scroll fetches

  // scrollToBottom wrapped in useCallback so it doesnt change on every render
  const scrollToBottom = useCallback((behavior = "instant") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });
  }, []); // no deps — this function never changes

  // initial fetch when user selected or message sent
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setIsInitialLoad(true);
      setMessages([]);
      setSkip(0);
      setHasMore(true);

      try {
        const res = await axios.get(
          `http://localhost:5002/messages/${selectedUser._id}?skip=0`,
          { withCredentials: true }
        );
        const data = res.data.data;
        setMessages(data);

        // if returned less than limit, no older messages exist
        if (data.length < LIMIT) setHasMore(false);

      } catch (error) {
        console.log(error.response?.data?.message || "Failed to fetch messages");
      } finally {
        setIsInitialLoad(false); // mark initial load done
      }
    };

    fetchMessages();
  }, [selectedUser, refreshKey]);

  // scroll to bottom after initial load completes
  useEffect(() => {
    if (!isInitialLoad && messages.length > 0) {
      scrollToBottom("instant");
    }
  }, [isInitialLoad, messages.length, scrollToBottom]);

  // load older messages when user scrolls to very top
  const handleScroll = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollTop > 0) return; // not at top
    if (!hasMore) return; // no more messages
    if (isFetchingRef.current) return; // already fetching

    isFetchingRef.current = true;
    setIsLoadingOlder(true);

    const newSkip = skip + LIMIT;

    try {
      const res = await axios.get(
        `http://localhost:5002/messages/${selectedUser._id}?skip=${newSkip}`,
        { withCredentials: true }
      );

      const older = res.data.data;

      if (older.length < LIMIT) setHasMore(false);
      if (older.length === 0) return;

      const oldScrollHeight = container.scrollHeight;

      setMessages(prev => [...older, ...prev]); // add older messages on top
      setSkip(newSkip);

      // restore scroll position after older messages added above
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - oldScrollHeight;
      });

    } catch (error) {
      console.log("Failed to load older messages", error.response?.data?.message || error.message);

    } finally {
      setIsLoadingOlder(false);
      isFetchingRef.current = false; // allow next fetch
    }
  }, [skip, hasMore, selectedUser]);

  // real-time incoming message via socket
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      // only add if from currently selected user
      if (newMessage.senderId === selectedUser?._id) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom("smooth"); // smooth scroll for new message
      }
    });

    return () => socket.off("newMessage"); // cleanup on unmount
  }, [socket, selectedUser, scrollToBottom]);

  // scroll to bottom when I send a message
  useEffect(() => {
    if (refreshKey > 0) scrollToBottom("smooth");
  }, [refreshKey, scrollToBottom]);

  if (!selectedUser) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col gap-1 h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
    >
      {/* spinner shown while loading older messages */}
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* shown when all older messages loaded */}
      {!hasMore && messages.length > 0 && (
        <p className="text-gray-700 text-xs text-center py-2">
          Start of conversation
        </p>
      )}

      {/* empty state — no messages yet */}
      {messages.length === 0 && !isInitialLoad && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No messages yet. Say hi! 👋
        </p>
      )}
      

      {/* render all messages */}
      {messages.map((msg) => (
        <Message key={msg._id} message={msg} />
      ))}

      {/* invisible div at bottom — scroll target */}
      <div ref={bottomRef} />
    </div>
  )
}

export default Messages