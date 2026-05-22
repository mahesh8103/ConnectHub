import React, { useState } from 'react'
import { IoSend } from 'react-icons/io5'
import axios from 'axios'
import useAuth from '../../context/useAuth'

function Type({ onMessageSent }) {
  const { selectedUser } = useAuth();
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    if (!message.trim()) return; // don't send empty message

    try {
      await axios.post(
        `http://localhost:5002/messages/${selectedUser._id}`,  
        { message },
        { withCredentials: true }
      );
      setMessage("");         // clear input after sending
      onMessageSent();        // tell Messages to refresh
    } catch (error) {
      console.log(error.response?.data?.message || "Failed to send message");
    }
  };

  // send on Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 px-4 py-3 rounded-2xl bg-gray-900/70 border border-gray-700 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        text-sm placeholder-gray-500 shadow-inner backdrop-blur-md text-white"
      />

      <button
        onClick={handleSend}
        className="group flex items-center gap-2 
        px-4 py-3 rounded-2xl 
        bg-gradient-to-r from-blue-500 to-cyan-500 
        hover:from-cyan-500 hover:to-blue-500 
        shadow-lg shadow-blue-500/20 
        hover:shadow-cyan-500/30
        transition-all duration-300
        active:scale-95"
      >
        <IoSend
          size={18}
          className="group-hover:translate-x-1 transition-transform duration-300"
        />
        <span className="text-sm font-semibold tracking-wide">Send</span>
      </button>
    </div>
  )
}

export default Type