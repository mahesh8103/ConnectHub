import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Message from './message'
import useAuth from '../../context/useAuth'

function Messages({ refreshKey }) {
  const { selectedUser } = useAuth();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!selectedUser) return; // don't fetch if no user selected

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5002/messages/${selectedUser._id}`,
          { withCredentials: true }
        );
        setMessages(res.data.data);
      } catch (error) {
        console.log(error.response?.data?.message || "Failed to fetch messages");
      }
    };

    fetchMessages();
  }, [selectedUser, refreshKey]); // re-runs every time selectedUser or refreshKey changes

  
  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm text-center mt-4">No messages yet. Say hi! 👋</p>
      ) : (
        messages.map((msg) => (
          <Message key={msg._id} message={msg} />
        ))
      )}
    </div>
  )
}

export default Messages