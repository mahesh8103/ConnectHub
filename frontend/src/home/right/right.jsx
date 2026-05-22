import React from 'react'
import Chatuser from './chatuser'
import Messages from './messages'
import Type from './type'
import useAuth from '../../context/useAuth'
import { useState, useCallback } from 'react'

function Right() {
  const { selectedUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleMessageSent = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // No user selected → show one clean message in center
  if (!selectedUser) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-transparent">
        <p className="text-4xl mb-3">💬</p>
        <h2 className="text-white text-xl font-semibold">Welcome to ConnectHub</h2>
        <p className="text-gray-500 text-sm mt-2">Select a user to start chatting</p>
      </div>
    );
  }

  // User selected → show full chat UI
  return (
    <div className="flex-1 h-screen flex flex-col bg-transparent">
      <Chatuser />
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-gray-700">
        <Messages refreshKey={refreshKey} />     
      </div>
      <div className="p-4 border-t border-gray-800 bg-white/5 backdrop-blur-md">
        <Type onMessageSent={handleMessageSent} />   
      </div>
    </div>
  )
}

export default Right