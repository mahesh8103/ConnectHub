import React from 'react'
import Left from './home/left/left'
import Right from './home/right/right'

function App() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
      <Left />
      <Right />
    </div>
  )
}

export default App