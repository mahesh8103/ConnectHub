import React from 'react'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket';

function User({ user , unreadCount, onUserSelect }) {
  const { selectedUser, setSelectedUser } = useAuth();
  const { onlineUsers } = useSocket(); 

  const isOnline = onlineUsers.includes(user._id);
  const isSelected = selectedUser?._id === user._id;

  const handleClick = () =>{
    setSelectedUser(user);
    onUserSelect?.(); 
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
        transition-[background-color,border-color] duration-150 ease-in-out
        border
        ${isSelected 
          ? 'bg-violet-500/20 border-violet-500/30' 
          : 'border-transparent hover:bg-gray-800/60'
        }`}
    >
      <div className="relative">
        <img
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700"
          src={user.avatar}
          alt={user.fullName}
        />
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-gray-950 rounded-full
          ${isOnline ? 'bg-emerald-400' : 'bg-gray-600'}`}
        />
      </div>
       
       {/*  min-w-0 + flex-1 so text truncates properly on mobile */}
      <div className="flex flex-col min-w-0 flex-1">
        <h1 className="text-sm font-semibold text-gray-100 truncate">{user.fullName}</h1>
         <span className="text-xs text-gray-500 truncate">
          @{user.username}
        </span>
      </div>

      {/*  added ml-auto and flex-shrink-0 so badge always visible on mobile */}
      {unreadCount > 0 && (
        <div className="ml-auto flex-shrink-0 min-w-[20px] h-5 bg-violet-500 rounded-full flex items-center justify-center px-1">
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  )
}

export default User