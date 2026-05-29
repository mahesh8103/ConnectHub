import React from 'react'
import useAuth from '../../context/useAuth'
import useTheme from '../../context/useTheme'
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5'

function Message({ message }) {
  const { authUser } = useAuth();
  const { isDark } = useTheme();
  const isMine = message.senderId.toString() === authUser?._id.toString();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImageOnly = message.image && !message.message;

  const wrapClass = "flex mb-0.5 px-3 " + (isMine ? "justify-end" : "justify-start");

  const bubbleClass = [
    "relative inline-flex items-end gap-1.5 max-w-[65%] text-sm",
    isImageOnly ? "overflow-hidden rounded-2xl" : "px-3 py-2",
    isMine
      ? isDark
        ? "bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-2xl rounded-br-sm shadow-[0_2px_16px_rgba(109,40,217,0.4)]"
        : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-[0_2px_12px_rgba(99,102,241,0.35)]"
      : isDark
        ? "bg-[#1a1a2e]/90 text-gray-100 rounded-2xl rounded-bl-sm border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        : "bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-indigo-100 shadow-[0_2px_8px_rgba(99,102,241,0.10)]"
  ].join(" ");

  const imgClass = "max-w-full cursor-pointer hover:opacity-95 transition-opacity block " +
    (isImageOnly ? "rounded-2xl" : "rounded-xl mb-1.5");

  const renderTick = () => {
    if (!isMine) return null;
    if (message.status === "seen") {
      return <IoCheckmarkDone size={15} className="text-green-500 flex-shrink-0" />;
    } else if (message.status === "delivered") {
      return <IoCheckmarkDone size={15} className="text-white/40 flex-shrink-0" />;
    } else {
      return <IoCheckmark size={15} className="text-white/40 flex-shrink-0" />;
    }
  };

  return (
    <div className={wrapClass}>
      <div className={bubbleClass}>

        {/* image */}
        {message.image && (
          <img
            src={message.image}
            alt="shared"
            className={imgClass}
            onClick={() => window.open(message.image, '_blank')}
          />
        )}

        {/* text */}
        {message.message && (
          <span className="leading-relaxed break-words min-w-0">
            {message.message}
          </span>
        )}

        {/* time + tick */}
        <div className={`flex items-center justify-end gap-1 mt-0.5
          ${isImageOnly ? 'px-2 pb-1' : ''}`}
        >
          <span className={`text-[9px] leading-none
            ${isMine ? 'text-white/40' : isDark ? 'text-gray-600' : 'text-gray-400'}`}
          >
            {formatTime(message.createdAt)}
          </span>
          {renderTick()}
        </div>

      </div>
    </div>
  );
}

export default Message;