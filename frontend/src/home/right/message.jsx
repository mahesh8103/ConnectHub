import React from 'react'
import useAuth from '../../context/useAuth'

function Message({ message }) {
  const { authUser } = useAuth();

  const isMine = message.senderId === authUser?._id; // did I send this?

  return (
    <div className={`chat ${isMine ? 'chat-end' : 'chat-start'}`}>
      <div className={`chat-bubble shadow-md
        ${isMine ? 'bg-blue-500 text-white' : 'bg-teal-500 text-black'}`}
      >
        {message.message}
      </div>
    </div>
  )
}

export default Message