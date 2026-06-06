import React from 'react'
import useAuth from '../../context/useAuth'
import { IoClose } from 'react-icons/io5'

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

const formatDate = (ts) => {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

function SearchResults({ results, isSearching, onResultClick, onClose, isDark }) {
  const { authUser } = useAuth();

  return (
    <div
      className="absolute top-[120px] left-4 right-4 z-30 rounded-xl shadow-2xl
        max-h-[400px] overflow-hidden flex flex-col"
      style={{
        background: isDark ? '#0f0f1a' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)'}`,
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b
        ${isDark ? 'border-[#1e1e3a]' : 'border-gray-100'}`}>
        <p className={`text-[11px] font-semibold
          ${isDark ? 'text-violet-400' : 'text-indigo-500'}`}>
          {isSearching
            ? 'Searching...'
            : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
        </p>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors
            ${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                     : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
        >
          <IoClose size={14} />
        </button>
      </div>

      {/* Body - scrollable */}
      <div className="overflow-y-auto flex-1">

        {/* Loading */}
        {isSearching && (
          <div className="flex items-center justify-center gap-2 py-8">
            <div className="w-4 h-4 border-2 border-violet-500
              border-t-transparent rounded-full animate-spin" />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Searching...
            </span>
          </div>
        )}

        {/* No results */}
        {!isSearching && results.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-2xl mb-1">🔍</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No messages found
            </p>
          </div>
        )}

        {/* Results */}
        {!isSearching && results.map((msg) => {
          const isMine = msg.senderId?.toString() === authUser?._id?.toString();

          return (
            <button
              key={msg._id}
              onClick={() => onResultClick(msg._id)}
              className={`w-full px-4 py-2.5 flex items-start gap-3 text-left
                transition-colors duration-150 border-b
                ${isDark
                  ? 'border-[#1e1e3a] hover:bg-white/5'
                  : 'border-gray-100 hover:bg-indigo-50/60'}`}
            >
              <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5
                ${isMine
                  ? isDark ? 'bg-violet-500' : 'bg-indigo-500'
                  : 'bg-emerald-500'}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[10px] font-semibold
                    ${isMine
                      ? isDark ? 'text-violet-400' : 'text-indigo-500'
                      : 'text-emerald-500'}`}>
                    {isMine ? 'You' : 'Them'}
                  </span>
                  <span className={`text-[9px] flex-shrink-0 ml-2
                    ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {formatDate(msg.createdAt)} · {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className={`text-[12px] leading-snug truncate
                  ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {msg.message}
                </p>
              </div>

              <span className={`flex-shrink-0 text-xs mt-1
                ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchResults;