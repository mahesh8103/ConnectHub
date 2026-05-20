import React from 'react'
import { Routes, Route } from "react-router-dom";
import Signup from './components/Signup'
import Login from './components/Login'
import Left from './home/left/left'
import Right from './home/right/right'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/chat" element={
        <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
          <Left />
          <Right />
        </div>
      } />
    </Routes>
  )
}

export default App