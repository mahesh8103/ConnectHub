import React, { useState, useEffect, useRef, useCallback } from 'react'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket'
import useTheme from '../../context/useTheme'
import { IoSearch, IoClose, IoSparklesOutline } from 'react-icons/io5'

function Chatuser({
  onSearch,
  onClearSearch,
  isSearching,
  onSummarize,        
}) {
  const { selectedUser } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const { isDark } = useTheme();
  const [isTyping, setIsTyping] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const onSearchRef = useRef(onSearch);
  const onClearSearchRef = useRef(onClearSearch);

  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);
  useEffect(() => { onClearSearchRef.current = onClearSearch; }, [onClearSearch]);

  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!socket) return;
    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(true);
    };
    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedUser?._id) setIsTyping(false);
    };
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    return () => {
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
    };
  }, [socket, selectedUser]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        onSearchRef.current?.(searchQuery.trim());
      } else {
        onClearSearchRef.current?.();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    onClearSearchRef.current?.();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && searchOpen) handleCloseSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, handleCloseSearch]);

  return (
    <div className={`border-b backdrop-blur-md transition-colors duration-300
      ${isDark ? 'border-[#1e1e3a] bg-[#0f0f1a]/80' : 'border-[#c7d2fe] bg-white/80'}`}>

      {/* Single header row - avatar + name + actions */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* User info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img
              src={selectedUser.avatar}
              alt={selectedUser.fullName}
              className={`w-10 h-10 rounded-full object-cover ring-2
                ${isDark ? 'ring-violet-500/40' : 'ring-indigo-400/50'}`}
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 rounded-full
              ${isDark ? 'border-[#0f0f1a]' : 'border-white'}
              ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}
            />
          </div>

          <div className="min-w-0">
            <h1 className={`text-sm font-semibold leading-tight truncate
              ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {selectedUser.fullName}
            </h1>
            {isTyping ? (
              <div className="flex items-center gap-1">
                <span className={`text-[10px] ${isDark ? 'text-violet-400' : 'text-indigo-500'}`}>
                  typing
                </span>
                <div className="flex gap-[2px] items-center mt-0.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className={`w-1 h-1 rounded-full animate-bounce
                        ${isDark ? 'bg-violet-400' : 'bg-indigo-500'}`}
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span className={`text-[10px]
                ${isOnline ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {isOnline ? 'online' : 'offline'}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - Summarize + Search */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Summarize button - icon only with tooltip */}
          <button
            onClick={onSummarize}
            className={`w-8 h-8 flex items-center justify-center rounded-full
              transition-all duration-200
              ${isDark
                ? 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/10'
                : 'text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title="Summarize chat with AI"
          >
            <IoSparklesOutline size={17} />
          </button>

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className={`w-8 h-8 flex items-center justify-center rounded-full
              transition-all duration-200
              ${isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/10'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            title="Search messages"
          >
            <IoSearch size={17} />
          </button>
        </div>
      </div>

      {/* Search bar - slide down when open */}
      <div style={{
        maxHeight: searchOpen ? '60px' : '0px',
        opacity: searchOpen ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
        overflow: 'hidden',
      }}>
        <div className="px-4 pb-2.5">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border
            ${isDark
              ? 'bg-[#1a1a2e]/80 border-violet-500/30'
              : 'bg-indigo-50 border-indigo-300/50'}`}>
            <IoSearch size={14}
              className={isDark ? 'text-violet-400' : 'text-indigo-400'} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this conversation..."
              className={`flex-1 bg-transparent outline-none text-xs
                ${isDark
                  ? 'text-gray-200 placeholder-gray-600'
                  : 'text-gray-700 placeholder-gray-400'}`}
            />
            {isSearching && (
              <div className="w-3 h-3 border-2 border-violet-500
                border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <button
              onClick={handleCloseSearch}
              className={`flex-shrink-0
                ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <IoClose size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatuser;