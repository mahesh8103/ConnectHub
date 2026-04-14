import React from 'react'

function Chatuser() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/50 bg-white/5 backdrop-blur-md">

      <div className="avatar avatar-online">
        <div className="w-12 rounded-full ring ring-gray-700 ring-offset-2 ring-offset-black">
          <img src="https://img.daisyui.com/images/profile/demo/gordon@192.webp" />
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-white">mahesh yadav</h1>
        <span className="text-xs text-green-400">online</span>
      </div>

    </div>
  )
}

export default Chatuser