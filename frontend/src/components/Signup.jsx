import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);

  const handleAvatarChange = async (e) => {
    setAvatar(e.target.files[0]);
  };

  const handleChange = async (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("fullName", formData.fullName);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    payload.append("username", formData.username);
    if (avatar) {
      payload.append("avatar", avatar);
    }
    try {
      const res = await axios.post("http://localhost:5002/users/signup", payload,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      console.log(res.data);
      navigate("/login"); // forward to login page after successful signup
    } catch (error) {
      console.log(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 overflow-hidden relative">

      {/* Animated Background */}
      <div className="absolute w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>
      <div className="absolute w-[400px] h-[400px] bg-pink-600/15 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>
      <div className="absolute w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-3xl top-[50%] left-[50%] animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-8 z-10"
      >

        {/* Heading */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl mb-3"
          >
            💬
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2"
          >
            ConnectHub
          </motion.h1>
          <p className="text-gray-400 text-sm">Create your account and start chatting</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <div className="relative group">
            <FaUser className="absolute top-4 left-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
              required
            />
          </div>

          {/* Username */}
          <div className="relative group">
            <FaUser className="absolute top-4 left-4 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
              required
            />
          </div>

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

          {/* Avatar */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-800/60 border border-gray-700/60 text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-violet-600/30 file:text-violet-300 file:text-xs cursor-pointer"
            />
            <p className="text-gray-600 text-xs mt-1 pl-1">Optional — you can add later</p>
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 transition-all text-white font-semibold text-sm shadow-lg shadow-violet-500/20 mt-2"
          >
            Create Account
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 hover:underline transition-colors">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;