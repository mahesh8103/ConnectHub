import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IoLogOutOutline } from 'react-icons/io5'
import useAuth from "../../context/useAuth";
import { toast } from 'react-toastify';
import Profile from "../../components/Profile";

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
      setAuthUser(null);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  return (
    <div className="
      group flex items-center gap-3 p-2.5 rounded-2xl
      bg-gradient-to-r from-gray-900/80 to-gray-800/40
      border border-white/5
      hover:border-violet-500/20 hover:from-violet-950/40 hover:to-gray-900/60
      transition-all duration-300 cursor-default
    ">

      {/* Avatar with animated glow ring */}
      <div className="relative flex-shrink-0">
        <div className="
          absolute inset-0 rounded-full
          bg-gradient-to-tr from-violet-500 to-pink-500
          blur-[6px] opacity-40 group-hover:opacity-70
          transition-opacity duration-300
        " />
        <img
          src={authUser?.avatar}
          alt={authUser?.fullName}
          onClick={() => navigate("/profile")}
          className="
            relative w-10 h-10 rounded-full object-cover
            ring-2 ring-violet-500/60
            group-hover:ring-violet-400/80
            transition-all duration-300
          "
        />
        {/* Online dot */}
        <span className="
          absolute bottom-0 right-0
          w-2.5 h-2.5 rounded-full
          bg-emerald-400 border-2 border-gray-950
          shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]
        " />
      </div>

      {/* User info */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="
          text-sm font-semibold truncate
          bg-gradient-to-r from-gray-100 to-gray-300
          bg-clip-text text-transparent
        ">
          {authUser?.fullName}
        </span>
        <span className="text-[11px] text-violet-400/70 truncate font-medium tracking-wide">
          @{authUser?.username}
        </span>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        title="Logout"
        className="
          flex items-center justify-center
          w-8 h-8 rounded-xl flex-shrink-0
          text-gray-500
          hover:text-rose-400
          hover:bg-rose-500/10
          border border-transparent
          hover:border-rose-500/20
          hover:shadow-[0_0_12px_rgba(244,63,94,0.15)]
          transition-all duration-200
          active:scale-95
        "
      >
        <IoLogOutOutline size={18} />
      </button>

    </div>
  );
}

export default Logout;