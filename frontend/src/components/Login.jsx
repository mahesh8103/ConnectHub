import React, { useState } from "react";
import { Link ,useNavigate} from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";
import axios from "axios";  
import useAuth from "../context/useAuth";

function Login() {
    const { setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = async(e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
       try {
         const res = await axios.post("http://localhost:5002/users/login", formData, { withCredentials: true });
         console.log(res.data);
         setAuthUser(res.data.data.user); 
         navigate("/chat");   // forward to chat page after successful login
       } catch (error) {
          console.log(error.response?.data?.message || "Login failed");
       }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">

      {/* Background Blur */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>

      <div className="absolute w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 z-10"
      >

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Welcome Back
          </h1>

          <p className="text-gray-300">
            Login to continue chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute top-4 left-4 text-gray-400" />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute top-4 left-4 text-gray-400" />

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold text-lg"
          >
            Login
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/"
            className="text-cyan-400 hover:underline"
          >
            Signup
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;