import React from 'react'
import { IoLogOutOutline } from 'react-icons/io5'
import axios from 'axios'
import useAuth from '../../context/useAuth'
import { useNavigate } from 'react-router-dom'

function Logout() {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

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
    <button className="flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg w-full transition-all" onClick={handleLogout}>
      <IoLogOutOutline size={20} />
      <span className="text-sm">Logout</span>
    </button>
  )
}

export default Logout