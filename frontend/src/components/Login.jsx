import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";
import axios from "axios";
import useAuth from "../context/useAuth";
import { toast } from 'react-toastify';

function Login() {
  const { setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = async (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5002/users/login", formData, { withCredentials: true });
      toast.success("Welcome Back!");
      setAuthUser(res.data.data.user);
      navigate("/chat"); // forward to chat page after successful login
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 overflow-hidden relative">

      {/* Background Blur */}
      <div className="absolute w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>
      <div className="absolute w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl top-[40%] left-[40%] animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 z-10"
      >

        {/* Heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl mb-3"
          >
            👋
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm">
            Login to continue chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="relative group">
            <FaEnvelope className="absolute top-4 left-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
              required
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <FaLock className="absolute top-4 left-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
              required
            />
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 transition-all text-white font-semibold text-sm shadow-lg shadow-violet-500/20 mt-2"
          >
            Login
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Don't have an account?{" "}
          <Link to="/" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors">
            Signup
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;