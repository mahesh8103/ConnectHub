import React from 'react'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket';
import useTheme from '../../context/useTheme'
function User({ user, unreadCount, onUserSelect }) {
  const { selectedUser, setSelectedUser } = useAuth();
  const { onlineUsers } = useSocket();
  const { isDark } = useTheme();

  const isOnline = onlineUsers.includes(user._id);
  const isSelected = selectedUser?._id === user._id;

  const handleClick = () => {
    setSelectedUser(user);
    onUserSelect?.();
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ease-in-out border
        ${isSelected
          ? isDark
            ? 'bg-violet-600/20 border-violet-500/30'
            : 'bg-indigo-100/80 border-indigo-400/40'
          : isDark
            ? 'border-transparent hover:bg-[#1a1a2e]/70'
            : 'border-transparent hover:bg-indigo-50/80'
        }`}
    >
      <div className="relative">
        <img
          className={`w-10 h-10 rounded-full object-cover ring-2
            ${isDark ? 'ring-[#2a2a4a]' : 'ring-indigo-200'}`}
          src={user.avatar}
          alt={user.fullName}
        />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 rounded-full
          ${isDark ? 'border-[#0f0f1a]' : 'border-[#f0f4ff]'}
          ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}
        />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <h1 className={`text-sm font-semibold truncate
          ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          {user.fullName}
        </h1>
        <span className={`text-xs truncate
          ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          @{user.username}
        </span>
      </div>

      {unreadCount > 0 && (
        <div className={`ml-auto flex-shrink-0 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1
          ${isDark ? 'bg-violet-500' : 'bg-indigo-500'}`}>
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  )
}

export default User