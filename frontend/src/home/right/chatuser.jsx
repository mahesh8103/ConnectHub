import React from 'react'
import useAuth from '../../context/useAuth.js'

function Chatuser() {
  const { selectedUser } = useAuth();

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur-md">
      <div className="relative">
        <img
          src={selectedUser.avatar}
          alt={selectedUser.fullName}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-violet-500/40"
        />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-gray-900 rounded-full"></span>
      </div>
      <div>
        <h1 className="text-base font-semibold text-white leading-tight">{selectedUser.fullName}</h1>
        <span className="text-xs text-emerald-400">online</span>
      </div>
    </div>
  )
}

export default Chatuser