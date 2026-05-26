import React from 'react'
import Search from './search'
import Users from './users'
import Logout from './logout'

function Left() {
  const [searchQuery, setSearchQuery] = React.useState("");
  return (
    <div className="w-[28%] h-screen bg-gray-950 text-gray-200 flex flex-col border-r border-gray-800/60">
      <div className="px-5 py-5 border-b border-gray-800/60">
        <h1 className="font-bold text-xl bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          💬 ConnectHub
        </h1>
      </div>
       <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-800">
        <Users searchQuery={searchQuery} />
      </div>

      <div className="p-3 border-t border-gray-800/60">
        <Logout />
      </div>
    </div>
  )
}

export default Left