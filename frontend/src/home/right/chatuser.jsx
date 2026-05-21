import React from 'react'
import  useAuth  from '../../context/useAuth.js'
function Chatuser() {
  const { selectedUser } = useAuth();

  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/50 bg-white/5 backdrop-blur-md">
      <div className="relative">
        <img
          src={selectedUser.avatar}
          alt={selectedUser.fullName}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full"></span>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-white">{selectedUser.fullName}</h1>
        <span className="text-xs text-green-400">online</span>
      </div>
    </div>
  )
}

export default Chatuser