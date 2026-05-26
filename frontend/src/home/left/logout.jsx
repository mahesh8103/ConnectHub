import React from 'react'
import { IoLogOutOutline } from 'react-icons/io5'
import axios from 'axios'
import useAuth from '../../context/useAuth'
import { useNavigate } from 'react-router-dom'

function Logout() {
  const navigate = useNavigate();
   const { authUser, setAuthUser } = useAuth();

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5002/users/logout",
        {},
        { withCredentials: true }
      );
      setAuthUser(null);  // to clear user from context
      navigate('/login');  // to navigate to loginpage after loggingout
    } catch (error) {
      console.log(error.response?.data?.message || "Logout failed");
    }
  }

return (
    <div className="flex items-center gap-3 p-2">
      {/* logged in user info */}
      <img
        src={authUser?.avatar}
        alt={authUser?.fullName}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/40 flex-shrink-0"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-gray-100 truncate">{authUser?.fullName}</span>
        <span className="text-xs text-gray-500 truncate">@{authUser?.username}</span>
      </div>

      {/* logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1 text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-all flex-shrink-0"
        title="Logout"
      >
        <IoLogOutOutline size={20} />
      </button>
    </div>
  )
}

export default Logout