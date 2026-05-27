import React, { useState } from 'react'
import { IoSend } from 'react-icons/io5'
import axios from 'axios'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket.js'
import { toast } from 'react-toastify';

function Type({ onMessageSent }) {
  const { selectedUser } = useAuth();
  const { socket } = useSocket();  
  const [message, setMessage] = useState("");
  const typingTimeoutRef = React.useRef(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      socket?.emit("stopTyping", { receiverId: selectedUser._id });
      await axios.post(
        `http://localhost:5002/messages/${selectedUser._id}`,
        { message },
        { withCredentials: true }
      );
      setMessage("");
      onMessageSent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket?.emit("typing", { receiverId: selectedUser._id });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stopTyping", { receiverId: selectedUser._id });
    }, 800);
  };

  return (
    <div className="flex items-center gap-3 px-2">
      <input
        type="text"
        value={message}
        onChange={handleTyping}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        className="flex-1 px-5 py-3 rounded-full bg-gray-800/80 border border-gray-700/60
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
        text-sm text-gray-100 placeholder-gray-500"
      />
      <button
        onClick={handleSend}
        className="w-11 h-11 flex items-center justify-center rounded-full
        bg-violet-600 hover:bg-violet-500 active:scale-95
        transition-all duration-200 shadow-lg shadow-violet-500/20"
      >
        <IoSend size={17} className="text-white translate-x-[1px]" />
      </button>
    </div>
  )
}

export default Type