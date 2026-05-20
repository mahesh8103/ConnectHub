import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

function Signup() {
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
    const payload  = new FormData();
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
    } catch (error) {
        console.log(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative">

      {/* Animated Background */}
      <div className="absolute w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-3xl top-[-100px] left-[-100px] animate-pulse"></div>

      <div className="absolute w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl bottom-[-100px] right-[-100px] animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 z-10"
      >

        {/* Heading */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white mb-2"
          >
            ConnectHub
          </motion.h1>

          <p className="text-gray-300">
            Create your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div className="relative">
            <FaUser className="absolute top-4 left-4 text-gray-400" />

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400"
              required
            />
          </div>

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
          {/* Username */}
<div className="relative">
  <FaUser className="absolute top-4 left-4 text-gray-400" />
  <input
    type="text"
    name="username"
    value={formData.username}
    onChange={handleChange}
    placeholder="Username"
    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-gray-600 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400"
    required
  />
</div>

{/* Avatar */}
<div className="relative">
  <input
    type="file"
    accept="image/*"
    onChange={handleAvatarChange}
    className="w-full py-3 px-4 rounded-xl bg-white/10 border border-gray-600 text-gray-400"
    
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
            Create Account
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-cyan-400 hover:underline"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;