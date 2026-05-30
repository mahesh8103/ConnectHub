import React from 'react'
import useAuth from '../../context/useAuth'
import useTheme from '../../context/useTheme'
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5'

const TimeRow = ({ timestamp, isMine, isDark, status }) => {
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderTick = () => {
    if (!isMine) return null;
    if (status === "seen") return <IoCheckmarkDone size={13} className="text-green-400 flex-shrink-0" />;
    if (status === "delivered") return <IoCheckmarkDone size={13} className="text-white/40 flex-shrink-0" />;
    return <IoCheckmark size={13} className="text-white/40 flex-shrink-0" />;
  };

  return (
    <span className="inline-flex items-center gap-0.5 ml-2 translate-y-[1px] flex-shrink-0 align-bottom">
      <span className={`text-[10px] leading-none whitespace-nowrap ${
        isMine ? 'text-white/50' : isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {formatTime(timestamp)}
      </span>
      {renderTick()}
    </span>
  );
};

function Message({ message }) {
  const { authUser } = useAuth();
  const { isDark } = useTheme();
  const isMine = message.senderId.toString() === authUser?._id.toString();

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    <div className={`flex mb-0.5 px-3 ${isMine ? 'justify-end' : 'justify-start'}`}>

      {/* IMAGE ONLY */}
      {isImageOnly && (
        <div className="relative cursor-pointer" onClick={() => window.open(message.image, '_blank')}>
          <img
            src={message.image}
            alt="shared"
            style={{ maxWidth: '220px', maxHeight: '220px', width: 'auto', height: 'auto' }}
            className={`object-cover block rounded-2xl ${isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <span className="text-[9px] leading-none text-white/90">{formatTime(message.createdAt)}</span>
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
          {/* Inline time trick: text + time in same flow */}
          <span className="inline">
            <span className="inline leading-[1.45]">{message.message}</span>
            <TimeRow timestamp={message.createdAt} isMine={isMine} isDark={isDark} status={message.status} />
          </span>
        </div>
      )}

      {/* IMAGE + TEXT */}
      {message.image && message.message && (
        <div
          style={{ maxWidth: '260px', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          className={`px-2 pt-2 pb-2 text-sm ${bubbleClass(isMineRounded)}`}
        >
          <img
            src={message.image}
            alt="shared"
            style={{ maxWidth: '100%', maxHeight: '200px', width: '100%', height: 'auto' }}
            className="object-cover block rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.image, '_blank')}
          />
          <span className="px-1 leading-[1.45] inline">
            <span className="inline">{message.message}</span>
            <TimeRow timestamp={message.createdAt} isMine={isMine} isDark={isDark} status={message.status} />
          </span>
        </div>
      )}

    </div>
  );
}

export default Message;