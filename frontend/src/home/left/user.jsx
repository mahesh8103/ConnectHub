import React from 'react'
import  useAuth  from '../../context/useAuth.js'

function User({ user }) {  // receive user prop
  const { selectedUser , setSelectedUser} = useAuth();
  
  const isSelected = selectedUser?._id === user._id;  //selecting ofr highlightingm
  
  return (
 <div
      onClick={() => setSelectedUser(user)}  //  click → store in context
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${isSelected ? 'bg-violet-500/20' : 'hover:bg-violet-500/10'}`}  //  highlight
    >
      <div className="relative">
        <img
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700"
          src={user.avatar}        //  real avatar
          alt={user.fullName}
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full"></span>
      </div>

      <div className="flex flex-col min-w-0">
        <h1 className="text-sm font-semibold text-gray-100">{user.fullName}</h1>
        <span className="text-xs text-gray-500 truncate">
          {user.username}
        </span>
      </div>

    </div>
  )
}

export default User