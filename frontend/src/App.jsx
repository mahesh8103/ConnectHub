import React from 'react'
import { Routes, Route } from "react-router-dom";
import Signup from './components/Signup'
import Login from './components/Login'
import Left from './home/left/left'
import Right from './home/right/right'
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/chat" element={
        <ProtectedRoute>
          <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">
            <Left />
            <Right />
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App