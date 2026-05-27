import React ,{useState} from 'react'
import { Routes, Route } from "react-router-dom";
import Signup from './components/Signup'
import Login from './components/Login'
import Left from './home/left/left'
import Right from './home/right/right'
import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';
import useAuth from './context/useAuth';

function App() {
  const { authUser } = useAuth();
  const [showChat, setShowChat] = useState(false);  
  // here if useState if false then showChat is false and if 
  // useState is true then showChat is true. By default it is false.
  
  if(authUser===undefined){ return null; }

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
  path="/chat"
  element={
    <ProtectedRoute>
      <div className="flex h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div
          className={`
            ${showChat ? "hidden" : "flex"}
            md:flex
            w-full
            md:w-[28%]
            lg:w-[24%]
            flex-shrink-0
          `}
        >
          <Left onUserSelect={() => setShowChat(true)} />
        </div>

        {/* RIGHT CHAT AREA */}
        <div
          className={`
            ${showChat ? "flex" : "hidden"}
            md:flex
            flex-1
            min-w-0
          `}
        >
          <Right onBack={() => setShowChat(false)} />
        </div>

      </div>
    </ProtectedRoute>
  }
/>
    </Routes>
  )
}

export default App