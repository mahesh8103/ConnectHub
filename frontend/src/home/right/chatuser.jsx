import React, { useState, useEffect } from 'react'
import useAuth from '../../context/useAuth.js'
import useSocket from '../../context/useSocket.js';

function Chatuser() {
  const { selectedUser } = useAuth();
  const { onlineUsers, socket } = useSocket();
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
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-md">
      <div className="relative">
        <img
          src={selectedUser.avatar}
          alt={selectedUser.fullName}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-500/40"
        />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-gray-900 rounded-full
          transition-colors duration-300
          ${isOnline ? 'bg-emerald-400' : 'bg-gray-600'}`}
        />
      </div>

      <div>
        <h1 className="text-base font-semibold text-white leading-tight">
          {selectedUser.fullName}
        </h1>

        {isTyping ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-violet-400">typing</span>
            <div className="flex gap-[2px] items-center mt-0.5">
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          <span className={`text-xs transition-colors duration-300 ${isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
            {isOnline ? 'online' : 'offline'}
          </span>
        )}
      </div>
    </div>
  )
}

export default Chatuser