import React, { useState } from 'react'
import { IoArrowBack, IoCamera } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import useAuth from '../context/useAuth'
import { motion } from 'framer-motion'

function Profile() {
  const { authUser, setAuthUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    username: authUser?.username || "",
    email: authUser?.email || "",
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(authUser?.avatar);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);


  // password change state
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });

   const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  NEW — compresses image using canvas API
  // canvas draws the image at reduced size and exports as compressed blob
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // max dimensions — resize if larger
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // scale down proportionally
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          } else {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // export as jpeg with 0.8 quality (80%) — good balance
        canvas.toBlob(
          (blob) => {
            // convert blob back to File object
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.8 // quality 0-1
        );
      };

      // load original image
      img.src = URL.createObjectURL(file);
    });
  };

 const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
      if (file.size > 1 * 1024 * 1024) { 
    const compressed = await compressImage(file);
    setAvatar(compressed);
    setAvatarPreview(URL.createObjectURL(compressed));
  } else {
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }
};

  const handleUpdateProfile = async () => {
    const isUnchanged =
      formData.fullName === authUser?.fullName &&
      formData.username === authUser?.username &&
      formData.email === authUser?.email;

    if (isUnchanged) {
      toast.warn("First update something!");
      return;
    }
    setProfileLoading(true);
    try {
      const res = await axios.patch(
        "http://localhost:5002/users/updateAccount",
        formData,
        { withCredentials: true }
      );
      setAuthUser(res.data.data);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateAvatar = async () => {
     if (!avatar) {
      toast.warn("Please select a new image first");
      return;
    }
    setAvatarLoading(true);
    const payload = new FormData();
    payload.append("avatar", avatar);
    try {
      const res = await axios.patch(
        "http://localhost:5002/users/updateAvatar",
        payload,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setAuthUser(res.data.data);
      toast.success("Avatar updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Avatar update failed");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      toast.error("Both fields are required");
      return;
    }
    if (passwords.oldPassword === passwords.newPassword) {
      toast.warn("New password must be different from current password");
      return;
    }
    
    setPasswordLoading(true);
    try {
      await axios.post(
        "http://localhost:5002/users/changePassword",
        passwords,
        { withCredentials: true }
      );
      toast.success("Password changed successfully");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-800/60">
        <button onClick={() => navigate("/chat")} className="text-gray-400 hover:text-white transition-colors">
          <IoArrowBack size={22} />
        </button>
        <h1 className="text-lg font-semibold">Profile Settings</h1>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 flex flex-col gap-8">

        {/* avatar section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={avatarPreview}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-500/40"
            />
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-violet-500 transition-colors">
              <IoCamera size={14} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          {avatar && (
            <button
              onClick={handleUpdateAvatar}
              disabled={avatarLoading}
              className="text-sm px-4 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-full transition-colors disabled:opacity-50"
            >
              {avatarLoading ? "Uploading..." : "Save Avatar"}
            </button>
          )}
        </div>

        {/* profile info */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account Info</h2>

          {["fullName", "username", "email"].map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 capitalize">{field}</label>
              <input
                type={field === "email" ? "email" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          ))}

          <button
            onClick={handleUpdateProfile}
            disabled={profileLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* change password */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Change Password</h2>

          <input
            type="password"
            placeholder="Current password"
            value={passwords.oldPassword}
            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
            className="px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <input
            type="password"
            placeholder="New password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            className="px-4 py-2.5 rounded-xl bg-gray-800/60 border border-gray-700/60 text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50"
          />

          <button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-all border border-gray-700 disabled:opacity-50"
          >
            {passwordLoading ? "Changing..." : "Change Password"}
          </button>
        </div>

      </div>
    </div>
  )
}

export default Profile