import React from 'react'
import { IoSearch, IoCloseCircle } from 'react-icons/io5'

function Search({ searchQuery, setSearchQuery }) {
  return (
    <div className="px-4 py-3">
      <div className={`flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-2.5 border transition-all duration-200
        ${searchQuery ? 'border-violet-500/50' : 'border-gray-700/60'}`}
      >
        <IoSearch className={`text-lg flex-shrink-0 transition-colors duration-200
          ${searchQuery ? 'text-violet-400' : 'text-gray-500'}`}
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="bg-transparent outline-none text-sm text-gray-200 w-full placeholder-gray-500"
        />

        {/* clear button — only shows when something typed */}
        {searchQuery && (
          <IoCloseCircle
            onClick={() => setSearchQuery("")}
            className="text-gray-500 hover:text-gray-300 text-lg flex-shrink-0 cursor-pointer transition-colors"
          />
        )}
      </div>
    </div>
  )
}

export default Search