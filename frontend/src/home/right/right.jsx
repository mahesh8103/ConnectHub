import React from 'react'
import Chatuser from './chatuser'
import Messages from './messages'
import Type from './type'

function Right() {
  return (
    <div className="flex-1 h-screen flex flex-col bg-transparent">

      <Chatuser />

      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-700">
        <Messages />
      </div>

      <div className="p-4 border-t border-gray-800 bg-white/5 backdrop-blur-md">
        <Type />
      </div>

    </div>
  )
}

export default Right