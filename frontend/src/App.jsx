import React from 'react'
import Left from './home/left/left'
import Right from './home/right/right'
import Signup from './components/Signup'

// function App() {
//   return (
//     // <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
//     //   <Left />
//     //   <Right />
//     // </div>
    
//   )
// }


import { Routes, Route } from "react-router-dom";
import Login from './components/Login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}


export default App