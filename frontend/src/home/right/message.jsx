import React from 'react'
import useAuth from '../../context/useAuth'

function Message({ message }) {
  const { authUser } = useAuth();
  const isMine = message.senderId.toString() === authUser?._id.toString();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5 px-3`}>
      <div className={`
        relative inline-flex items-end gap-1.5
        max-w-[65%] px-3 py-2 text-sm
        ${isMine
          ? `bg-gradient-to-br from-violet-500 to-violet-700
             text-white rounded-2xl rounded-br-sm
             shadow-[0_2px_12px_rgba(139,92,246,0.35)]`
          : `bg-gray-800/90 text-gray-100
             rounded-2xl rounded-bl-sm
             border border-white/[0.06]
             shadow-[0_2px_8px_rgba(0,0,0,0.3)]`
        }
      `}>

        {/* Message text */}
        <span className="leading-relaxed break-words min-w-0">
          {message.message}
        </span>

        {/* Tiny timestamp — pinned to bottom right always */}
        <span className={`
          text-[9px] leading-none mb-[1px] flex-shrink-0 font-normal
          ${isMine ? 'text-white/40' : 'text-gray-600'}
        `}>
          {formatTime(message.createdAt)}
        </span>

      </div>
    </div>
  );
}

export default Message;