import React from 'react'
import Search from './search'
import Users from './users'
import Logout from './logout'
import useTheme from '../../context/useTheme'
import { IoSunny, IoMoon } from 'react-icons/io5'

function Left({ onUserSelect }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`w-full h-screen flex flex-col border-r transition-colors duration-300
      ${isDark
        ? 'bg-[#0f0f1a] text-gray-200 border-[#1e1e3a]'
        : 'bg-[#f0f4ff] text-gray-800 border-[#c7d2fe]'
      }`}>

      <div className={`px-5 py-5 border-b flex items-center justify-between transition-colors duration-300
        ${isDark ? 'border-[#1e1e3a]' : 'border-[#c7d2fe]'}`}>
        <h1 className="font-bold text-xl bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          💬 ConnectHub
        </h1>
        <button
          onClick={toggleTheme}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200
            ${isDark
              ? 'bg-[#1a1a2e] border-[#2e2e50] text-yellow-300 hover:bg-[#252545] hover:border-yellow-400/40'
              : 'bg-white border-[#c7d2fe] text-indigo-500 hover:bg-indigo-50 hover:border-indigo-300'
            }`}
          title="Toggle theme"
        >
          {isDark ? <IoSunny size={17} /> : <IoMoon size={17} />}
        </button>
      </div>

      <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-800">
        <Users searchQuery={searchQuery} onUserSelect={onUserSelect} />
      </div>

      <div className={`p-3 border-t transition-colors duration-300
        ${isDark ? 'border-[#1e1e3a]' : 'border-[#c7d2fe]'}`}>
        <Logout />
      </div>
    </div>
  )
}

export default Left