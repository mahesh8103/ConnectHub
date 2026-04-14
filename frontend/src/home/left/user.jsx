import React from 'react'

function User() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/10 cursor-pointer transition-all">

      <div className="relative">
        <img
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-700"
          src="https://img.daisyui.com/images/profile/demo/gordon@192.webp"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-black rounded-full"></span>
      </div>

      <div className="flex flex-col min-w-0">
        <h1 className="text-sm font-semibold text-gray-100">Mahesh Yadav</h1>
        <span className="text-xs text-gray-500 truncate">
          maheshyadav8103@gmail.com
        </span>
      </div>

    </div>
  )
}

export default User