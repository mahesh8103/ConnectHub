import React from 'react'
import { IoSearch } from 'react-icons/io5'

function Search() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-2 border border-gray-700">

        <IoSearch className="text-gray-400 text-lg" />

        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-sm text-gray-200 w-full"
        />

      </div>
    </div>
  )
}

export default Search