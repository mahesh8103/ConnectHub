import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IoLogOutOutline } from 'react-icons/io5'
import useAuth from "../../context/useAuth";
import { toast } from 'react-toastify';
import useTheme from '../../context/useTheme'
function Logout() {
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();
  const { isDark } = useTheme();

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
    <div className={`group flex items-center gap-3 p-2.5 rounded-2xl border transition-all duration-300 cursor-default
      ${isDark
        ? 'bg-gradient-to-r from-[#13132b]/80 to-[#1a1a35]/40 border-white/5 hover:border-violet-500/20 hover:from-[#1e1040]/40 hover:to-[#13132b]/60'
        : 'bg-gradient-to-r from-indigo-50 to-white border-indigo-100 hover:border-indigo-300/60 hover:from-indigo-100 hover:to-indigo-50'
      }`}>

      <div className="relative flex-shrink-0">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 blur-[6px] opacity-40 group-hover:opacity-70 transition-opacity duration-300`} />
        <img
          src={authUser?.avatar}
          alt={authUser?.fullName}
          onClick={() => navigate("/profile")}
          className={`relative w-10 h-10 rounded-full object-cover ring-2 transition-all duration-300
            ${isDark ? 'ring-violet-500/60 group-hover:ring-violet-400/80' : 'ring-indigo-400/70 group-hover:ring-indigo-500/90'}`}
        />
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-gray-950 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className={`text-sm font-semibold truncate bg-clip-text text-transparent bg-gradient-to-r
          ${isDark ? 'from-gray-100 to-gray-300' : 'from-gray-700 to-gray-900'}`}>
          {authUser?.fullName}
        </span>
        <span className={`text-[11px] truncate font-medium tracking-wide
          ${isDark ? 'text-violet-400/70' : 'text-indigo-500/80'}`}>
          @{authUser?.username}
        </span>
      </div>

      <button
        onClick={handleLogout}
        title="Logout"
        className={`flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 border border-transparent transition-all duration-200 active:scale-95
          ${isDark
            ? 'text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)]'
            : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-300/40'
          }`}
      >
        <IoLogOutOutline size={18} />
      </button>
    </div>
  );
}

export default Logout;