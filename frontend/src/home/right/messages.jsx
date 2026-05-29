import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  //store selectedUser in ref so socket always has latest value
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  //  scroll only after DOM painted using double rAF
  const scrollToBottom = useCallback((behavior = "auto") => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior });
        }
      });
    });
  }, []);

  // fetch last 20 messages when user selected
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      setIsInitialLoad(true);
      setMessages([]);
      setSkip(0);
      setHasMore(true);
      isFetchingRef.current = false;

      try {
        const res = await axios.get(
          //  always pass skip=0 explicitly
          `http://localhost:5002/messages/${selectedUser._id}?skip=0`,
          { withCredentials: true }
        );
        const data = res.data.data;
        setMessages(data);
        await axios.post(
          `http://localhost:5002/messages/${selectedUser._id}/seen`,
           {},
           { withCredentials: true }
    );
        if (data.length < LIMIT) setHasMore(false);
      } catch (error) {
        console.log(error.response?.data?.message || "Failed to fetch messages");
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchMessages();
  }, [selectedUser]); // removed refreshKey from here, handled separately

  // scroll to bottom ONLY after isInitialLoad becomes false
  // double rAF ensures DOM is fully painted before scrolling
  useEffect(() => {
    if (!isInitialLoad) {
      scrollToBottom("auto");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoad]);

  //handle refreshKey (message sent) separately
  useEffect(() => {
    if (refreshKey > 0 && selectedUser) {
      const fetchLatest = async () => {
        try {
          const res = await axios.get(
            `http://localhost:5002/messages/${selectedUser._id}?skip=0`,
            { withCredentials: true }
          );
          const data = res.data.data;
          setMessages(data);
          setSkip(0);
          if (data.length < LIMIT) setHasMore(false);
          // scroll after message sent
          setTimeout(() => scrollToBottom("smooth"), 100);
        } catch (error) {
          console.log("Failed to refresh messages", error.response?.data?.message || "");
        }
      };
      fetchLatest();
    }
  }, [refreshKey]); // eslint-disable-line

  // load older messages on scroll to top
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
      if (older.length === 0) return;

      const oldScrollHeight = container.scrollHeight;

      setMessages(prev => [...older, ...prev]);
      setSkip(newSkip);

      //  restore scroll position after older messages added
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - oldScrollHeight;
          }
        });
      });

    } catch (error) {
      console.log("Failed to load older messages", error.response?.data?.message || "");
    } finally {
      setIsLoadingOlder(false);
      isFetchingRef.current = false;
    }
  }, [skip, hasMore, selectedUser]);

  //  use selectedUserRef in socket listener to avoid stale closure
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const currentSelectedUser = selectedUserRef.current;
      if (newMessage.senderId === currentSelectedUser?._id) {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, scrollToBottom]);
   //  listen for delivered and seen status updates
useEffect(() => {
  if (!socket) return;

  // when my messages get delivered
  socket.on("messagesDelivered", ({ to }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.senderId === to?.toString() ? msg :
        msg.status === "sent" ? { ...msg, status: "delivered" } : msg
      )
    );
  });

  // when my messages get seen
  socket.on("messagesSeen", ({ by }) => {
    setMessages(prev =>
      prev.map(msg => ({ ...msg, status: "seen" }))
    );
  });

  return () => {
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
  };
}, [socket]);
  // format date level for separator

  const formatDateLabel = (date)=>{
       const today = new Date();
       const yesterday = new Date();
       yesterday.setDate(yesterday.getDate()-1);
        if(date.toDateString() === today.toDateString()) return "Today";
        if(date.toDateString() === yesterday.toDateString()) return "Yesterday";
        else {
          return date.toLocaleDateString([],
            { month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }
          )
        }
  }

  //insert date separators

   const groupMessagesByDate = (msgs) => {
    const result = [];
    let lastDateStr = null;

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toDateString();

      // if date changed from previous message → insert separator
      if (dateStr !== lastDateStr) {
        result.push({
          type: "separator",
          date: msgDate,
          key: `sep-${dateStr}`,
        });
        lastDateStr = dateStr;
      }
       result.push({
        type: "message",
        data: msg,
        key: msg._id,
      });
    });

    return result;
  };

const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages);
}, [messages]);  

  if (!selectedUser) return null;

  
return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col gap-1 h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
    >
      {/* loading older spinner */}
      {isLoadingOlder && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}

      {/* start of conversation */}
      {!hasMore && messages.length > 0 && (
        <p className="text-gray-700 text-xs text-center py-2">
          Start of conversation
        </p>
      )}

      {/* empty state */}
      {messages.length === 0 && !isInitialLoad && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No messages yet. Say hi! 👋
        </p>
      )}

      {/* render messages with date separators */}
      {groupedMessages.map((item) => {
        if (item.type === "separator") {
          return (
            <div key={item.key} className="flex items-center gap-3 my-3">
              {/* left line */}
              <div className="flex-1 h-px bg-gray-800" />
              {/* date label */}
              <span className="text-[11px] text-gray-500 font-medium px-2 flex-shrink-0">
                {formatDateLabel(item.date)}
              </span>
              {/* right line */}
              <div className="flex-1 h-px bg-gray-800" />
            </div>
          );
        }
        return <Message key={item.key} message={item.data} />;
      })} 

      {/* scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}

export default Messages