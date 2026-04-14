import React from 'react'
import Search from './search'
import Users from './users'
import Logout from './logout'

function Left() {
  return (
    <div className="w-[30%] h-screen bg-gray-900/80 backdrop-blur-xl text-gray-200 flex flex-col border-r border-gray-800">

      <h1 className="font-extrabold text-2xl px-5 py-4 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
        💬 Chat
      </h1>

      <Search />

      <div className="mx-4 border-t border-gray-800/40"></div>

      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-700">
        <Users />
      </div>

      <div className="p-3 border-t border-gray-800/40">
        <Logout />
      </div>

    </div>
  )
}

export default Left