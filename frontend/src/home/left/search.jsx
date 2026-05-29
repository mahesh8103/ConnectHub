import React from 'react'
import { IoSearch, IoCloseCircle } from 'react-icons/io5'
import useTheme from '../../context/useTheme'
function Search({ searchQuery, setSearchQuery }) {
  const { isDark } = useTheme();

  return (
    <div className="px-4 py-3">
      <div className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border transition-all duration-200
        ${isDark
          ? `bg-[#1a1a2e]/70 ${searchQuery ? 'border-violet-500/50' : 'border-[#2a2a4a]/60'}`
          : `bg-white ${searchQuery ? 'border-indigo-400/70' : 'border-indigo-200/80'}`
        }`}>

        <IoSearch className={`text-lg flex-shrink-0 transition-colors duration-200
          ${searchQuery
            ? isDark ? 'text-violet-400' : 'text-indigo-500'
            : isDark ? 'text-gray-500' : 'text-gray-400'
          }`} />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className={`bg-transparent outline-none text-sm w-full transition-colors duration-200
            ${isDark ? 'text-gray-200 placeholder-gray-600' : 'text-gray-700 placeholder-gray-400'}`}
        />

        {searchQuery && (
          <IoCloseCircle
            onClick={() => setSearchQuery("")}
            className={`text-lg flex-shrink-0 cursor-pointer transition-colors
              ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          />
        )}
      </div>
    </div>
  )
}

export default Search