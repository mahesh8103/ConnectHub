import React, { useState, useRef, useEffect } from 'react'
import useAuth from '../../context/useAuth'
import useTheme from '../../context/useTheme'
import { IoCheckmark, IoCheckmarkDone, IoTrash, IoClose } from 'react-icons/io5'
import axios from 'axios'

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

// Time + tick component
const TimeRow = ({ timestamp, isMine, isDark, status }) => {
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

  const renderTick = () => {
    if (!isMine) return null;
    if (status === "seen")
      return <IoCheckmarkDone size={13} className="text-green-400 flex-shrink-0" />;
    if (status === "delivered")
      return <IoCheckmarkDone size={13} className="text-white/40 flex-shrink-0" />;
    return <IoCheckmark size={13} className="text-white/40 flex-shrink-0" />;
  };

  return (
    <span className="inline-flex items-center gap-0.5 ml-2 translate-y-[1px]
      flex-shrink-0 align-bottom">
      <span className={`text-[10px] leading-none whitespace-nowrap
        ${isMine ? 'text-white/50' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {formatTime(timestamp)}
      </span>
      {renderTick()}
    </span>
  );
};

// Reaction display - shows user's own reaction with highlight
const ReactionBar = ({ reactions, currentUserId, isDark, onReactionClick }) => {
  if (!reactions || reactions.length === 0) return null;

  // Group by emoji + track if current user reacted with it
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, byMe: false };
    }
    acc[r.emoji].count++;
    if (r.userId?.toString() === currentUserId?.toString()) {
      acc[r.emoji].byMe = true;
    }
    return acc;
  }, {});

  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {Object.entries(grouped).map(([emoji, { count, byMe }]) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            // Agar mera reaction hai → click karo → remove ho jaaye
            if (byMe) onReactionClick?.(emoji);
          }}
          className={`text-[11px] px-2 py-0.5 rounded-full border
            transition-all duration-150
            ${byMe
              ? isDark
                ? 'bg-violet-500/30 border-violet-400/60 hover:bg-violet-500/40 cursor-pointer'
                : 'bg-indigo-200 border-indigo-400 hover:bg-indigo-300 cursor-pointer'
              : isDark
                ? 'bg-white/10 border-white/10 cursor-default'
                : 'bg-gray-100 border-gray-200 cursor-default'}`}
          title={byMe ? "Click to remove your reaction" : ""}
        >
          {emoji}{count > 1 ? ` ${count}` : ''}
        </button>
      ))}
    </div>
  );
};

function Message({ message, onDelete, onReact }) {
  const { authUser } = useAuth();
  const { isDark } = useTheme();
  const isMine = message.senderId?.toString() === authUser?._id?.toString();

  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef(null);
  const menuRef = useRef(null);

  // Mobile long press
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  // Desktop right click
  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowMenu(true);
  };

  // Click outside to close
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    // Small delay to prevent immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5002/messages/${message._id}/delete`,
        { withCredentials: true }
      );
      onDelete?.(message._id);
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
    setShowMenu(false);
  };

  const handleReact = async (emoji) => {
    try {
      const res = await axios.post(
        `http://localhost:5002/messages/${message._id}/react`,
        { emoji },
        { withCredentials: true }
      );
      onReact?.(message._id, res.data.data.reactions);
    } catch (err) {
      console.error("React failed:", err.message);
    }
    setShowMenu(false);
  };

  // Deleted message UI
  if (message.isDeleted) {
    return (
      <div className={`flex mb-0.5 px-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
        <div className={`px-3 py-2 rounded-2xl text-xs italic
          ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}
          ${isDark
            ? 'bg-[#1a1a2e]/60 text-gray-500 border border-white/5'
            : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  const bubbleClass = (rounded = 'br') => [
    isMine
      ? isDark
        ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-[0_2px_16px_rgba(109,40,217,0.4)]'
        : 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)]'
      : isDark
        ? 'bg-[#1a1a2e]/90 text-gray-100 border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
        : 'bg-white text-gray-800 border border-indigo-100 shadow-[0_2px_8px_rgba(99,102,241,0.10)]',
    `rounded-2xl ${rounded === 'br' ? 'rounded-br-sm' : 'rounded-bl-sm'}`
  ].join(' ');

  const isImageOnly = message.image && !message.message;
  const isMineRounded = isMine ? 'br' : 'bl';

  return (
    <div
      className={`flex flex-col mb-0.5 px-3 ${isMine ? 'items-end' : 'items-start'}`}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative group">

        {/* IMAGE ONLY */}
        {isImageOnly && (
          <div
            className="relative cursor-pointer"
            onClick={() => window.open(message.image, '_blank')}
          >
            <img
              src={message.image}
              alt="shared"
              style={{ maxWidth: '220px', maxHeight: '220px' }}
              className={`object-cover block rounded-2xl
                ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1
              bg-black/50 rounded-full px-2 py-0.5 backdrop-blur-sm">
              <span className="text-[9px] leading-none text-white/90">
                {new Date(message.createdAt).toLocaleTimeString([],
                  { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isMine && (message.status === "seen"
                ? <IoCheckmarkDone size={11} className="text-green-400" />
                : <IoCheckmarkDone size={11} className="text-white/50" />
              )}
            </div>
          </div>
        )}

        {/* TEXT ONLY */}
        {message.message && !message.image && (
          <div
            style={{ maxWidth: '320px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            className={`px-3 py-[7px] text-sm leading-[1.45] ${bubbleClass(isMineRounded)}`}
          >
            <span className="inline">
              <span className="inline leading-[1.45]">{message.message}</span>
              <TimeRow
                timestamp={message.createdAt}
                isMine={isMine}
                isDark={isDark}
                status={message.status}
              />
            </span>
          </div>
        )}

        {/* IMAGE + TEXT */}
        {message.image && message.message && (
          <div
            style={{ maxWidth: '260px', wordBreak: 'break-word' }}
            className={`px-2 pt-2 pb-2 text-sm ${bubbleClass(isMineRounded)}`}
          >
            <img
              src={message.image}
              alt="shared"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
              className="object-cover block rounded-xl mb-2 cursor-pointer"
              onClick={() => window.open(message.image, '_blank')}
            />
            <span className="px-1 leading-[1.45] inline">
              <span className="inline">{message.message}</span>
              <TimeRow
                timestamp={message.createdAt}
                isMine={isMine}
                isDark={isDark}
                status={message.status}
              />
            </span>
          </div>
        )}

        {/* Hover button - SIRF DESKTOP - opacity 0 by default, hover pe dikhe */}
        {/* hidden on mobile (md:block) - mobile par long press use karo */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className={`hidden md:flex absolute top-1/2 -translate-y-1/2
            ${isMine ? '-left-8' : '-right-8'}
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            w-7 h-7 items-center justify-center rounded-full text-base
            ${isDark
              ? 'bg-[#1a1a2e] hover:bg-[#252548] border border-white/10'
              : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'}`}
          title="React or delete"
        >
          😊
        </button>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`absolute z-50 rounded-xl shadow-2xl overflow-hidden
              ${isMine ? 'right-0' : 'left-0'} bottom-full mb-2
              ${isDark
                ? 'bg-[#1e1e3a] border border-white/10'
                : 'bg-white border border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Emoji row */}
            <div className={`flex gap-1 px-3 py-2.5
              ${isMine ? 'border-b' : 'border-b'}
              ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-xl hover:scale-125 transition-transform duration-150
                    cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Delete button - only for own messages */}
            {isMine && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                  text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <IoTrash size={14} />
                Delete message
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reactions bar with click to remove */}
      <ReactionBar
        reactions={message.reactions}
        currentUserId={authUser?._id}
        isDark={isDark}
        onReactionClick={handleReact}
      />
    </div>
  );
}

export default Message;