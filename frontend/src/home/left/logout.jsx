import React from 'react'
import { IoLogOutOutline } from 'react-icons/io5'

function Logout() {
  return (
    <button className="flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg w-full transition-all">
      <IoLogOutOutline size={20} />
      <span className="text-sm">Logout</span>
    </button>
  )
}

export default Logout