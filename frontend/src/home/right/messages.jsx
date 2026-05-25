import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Message from './message'
import useAuth from '../../context/useAuth'
import { useRef } from 'react'
import useSocket from '../../context/useSocket';

function Messages({ refreshKey }) {
  const { selectedUser } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

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

  // listen for real-time incoming messages via socket
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (newMessage.senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });
    return () => socket.off("newMessage");
  }, [socket, selectedUser]);

  //  scroll to bottom whenever messages change
  useEffect(() => {
  setTimeout(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, 100); 
}, [messages]);

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm text-center mt-4">No messages yet. Say hi! 👋</p>
      ) : (
        messages.map((msg) => (
          <Message key={msg._id} message={msg} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default Messages