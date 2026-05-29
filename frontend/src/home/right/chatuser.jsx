import React, { useState, useEffect } from 'react'
import useAuth from '../../context/useAuth.js'
import useSocket from '../../context/useSocket.js';
import useTheme from '../../context/useTheme'
function Chatuser() {
  const { selectedUser } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const { isDark } = useTheme();
  const [isTyping, setIsTyping] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

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

  return (
    <div className={`flex items-center gap-4 px-6 py-4 border-b backdrop-blur-md transition-colors duration-300
      ${isDark
        ? 'border-[#1e1e3a] bg-[#0f0f1a]/80'
        : 'border-[#c7d2fe] bg-white/80'
      }`}>

      <div className="relative">
        <img
          src={selectedUser.avatar}
          alt={selectedUser.fullName}
          className={`w-11 h-11 rounded-full object-cover ring-2
            ${isDark ? 'ring-violet-500/40' : 'ring-indigo-400/50'}`}
        />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 rounded-full transition-colors duration-300
          ${isDark ? 'border-[#0f0f1a]' : 'border-white'}
          ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}
        />
      </div>

      <div>
        <h1 className={`text-base font-semibold leading-tight
          ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {selectedUser.fullName}
        </h1>

        {isTyping ? (
          <div className="flex items-center gap-1">
            <span className={`text-xs ${isDark ? 'text-violet-400' : 'text-indigo-500'}`}>typing</span>
            <div className="flex gap-[2px] items-center mt-0.5">
              <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:0ms]
                ${isDark ? 'bg-violet-400' : 'bg-indigo-500'}`} />
              <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:150ms]
                ${isDark ? 'bg-violet-400' : 'bg-indigo-500'}`} />
              <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:300ms]
                ${isDark ? 'bg-violet-400' : 'bg-indigo-500'}`} />
            </div>
          </div>
        ) : (
          <span className={`text-xs transition-colors duration-300
            ${isOnline
              ? 'text-emerald-400'
              : isDark ? 'text-gray-500' : 'text-gray-400'
            }`}>
            {isOnline ? 'online' : 'offline'}
          </span>
        )}
      </div>
    </div>
  )
}

export default Chatuser