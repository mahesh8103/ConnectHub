import React, { useState, useCallback } from 'react'
import Chatuser from './chatuser'
import Messages from './messages'
import Type from './type'
import useAuth from '../../context/useAuth'

function Right() {
  const { selectedUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMessageSent = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (!selectedUser) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-950">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-white text-lg font-semibold">Welcome to ConnectHub</h2>
        <p className="text-gray-500 text-sm mt-1">Select someone to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col bg-gray-950">
      <Chatuser />
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-800">
        <Messages refreshKey={refreshKey} />
      </div>
      <div className="px-4 py-4 border-t border-gray-800/60 bg-gray-950">
        <Type onMessageSent={handleMessageSent} />
      </div>
    </div>
  )
}

export default Right