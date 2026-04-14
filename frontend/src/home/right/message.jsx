import React from 'react'

function Message() {
  return (
    <div className="space-y-2">

      <div className="chat chat-start">
        <div className="chat-bubble bg-teal-500 text-black shadow-md">
          That's never been done in the history of the Jedi.
        </div>
      </div>

      <div className="chat chat-end">
        <div className="chat-bubble bg-blue-500 text-white shadow-md">
          Calm down, Anakin.
        </div>
      </div>

    </div>
  )
}

export default Message