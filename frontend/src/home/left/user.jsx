import React from 'react'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket';

function User({ user }) {
  const { selectedUser, setSelectedUser } = useAuth();
  const { onlineUsers } = useSocket(); 

  const isOnline = onlineUsers.includes(user._id);
  const isSelected = selectedUser?._id === user._id;

  return (
    <div
      onClick={() => setSelectedUser(user)}
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

      <div className="flex flex-col min-w-0">
        <h1 className="text-sm font-semibold text-gray-100">{user.fullName}</h1>
        <span className={`text-xs truncate ${isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
          {isOnline ? 'online' : 'offline'}
        </span>
      </div>
    </div>
  )
}

export default User