import React from 'react'
import useAuth from '../../context/useAuth'

function Message({ message }) {
  const { authUser } = useAuth();

  const isMine = message.senderId.toString() === authUser?._id.toString(); // did I send this?

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed
        ${isMine
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {message.message}
      </div>
    </div>
  )
}

export default Message