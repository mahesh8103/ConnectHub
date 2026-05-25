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
  const isFetchingRef = useRef(false);
  const prevScrollHeightRef = useRef(0); 

  const scrollToBottom = useCallback((behavior = "instant") => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    });
  }, []);

  
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
        if (data.length < LIMIT) setHasMore(false);

      } catch (error) {
        console.log(error.response?.data?.message || "Failed to fetch messages");
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchMessages();
  }, [selectedUser, refreshKey]);

  // scroll to bottom after initial load
  useEffect(() => {
    if (!isInitialLoad && messages.length > 0) {
      scrollToBottom("instant");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad]); 


  useEffect(() => {
    const container = containerRef.current;
    if (!container || prevScrollHeightRef.current === 0) return;
    container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0; 
  });

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
        `http://localhost:5002/messages/${selectedUser._id}?skip=${newSkip}`,
        { withCredentials: true }
      );

      const older = res.data.data;

      if (older.length < LIMIT) setHasMore(false);
      if (older.length === 0) {
        isFetchingRef.current = false;
        setIsLoadingOlder(false);
        return;
      }

      prevScrollHeightRef.current = container.scrollHeight;

      setMessages(prev => [...older, ...prev]);
      setSkip(newSkip);

    } catch (error) {
      console.log("Failed to load older messages", error.response?.data?.message || error.message);
    } finally {
      setIsLoadingOlder(false);
      isFetchingRef.current = false;
    }
  }, [skip, hasMore, selectedUser]);

  // real-time incoming message
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId === selectedUser?._id) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom("smooth");
      }
    });

    return () => socket.off("newMessage");
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
          No messages yet. Say hi! 👋
        </p>
      )}

      {messages.map((msg) => (
        <Message key={msg._id} message={msg} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}

export default Messages