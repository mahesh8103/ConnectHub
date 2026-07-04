import React, { useState, useEffect, useRef } from 'react'
import { IoSend, IoAttach, IoCloseCircle } from 'react-icons/io5'
import axios from 'axios'
import useAuth from '../../context/useAuth'
import useSocket from '../../context/useSocket.js'
import { toast } from 'react-toastify'

function Type({ onMessageSent, suggestionText, onSuggestionUsed }) {
  const { selectedUser } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (suggestionText && suggestionText.trim() !== "") {
      setMessage(suggestionText);
      onSuggestionUsed?.();
    }
  }, [suggestionText]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    if (!selected.type.startsWith("image/")) {
      toast.error("Only images are supported");
      return;
    }

    setImage(selected);
    setImagePreview(URL.createObjectURL(selected));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!message.trim() && !image) return;
    if (sending) return;
    setSending(true);

    try {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket?.emit("stopTyping", { receiverId: selectedUser._id });

      const formData = new FormData();
      if (message.trim()) formData.append("message", message);
      if (image) formData.append("image", image);

      await axios.post(
        `http://localhost:5002/messages/${selectedUser._id}`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onMessageSent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket?.emit("typing", { receiverId: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stopTyping", { receiverId: selectedUser._id });
    }, 800);
  };

  return (
    <div className="flex flex-col gap-2 px-2">
      {imagePreview && (
        <div className="relative ml-2 w-fit">
          <div className="relative w-24 h-24">
            <img
              src={imagePreview}
              alt="preview"
              className="w-24 h-24 object-cover rounded-xl"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 text-gray-400 hover:text-white"
            >
              <IoCloseCircle size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
          title="Attach image"
        >
          <IoAttach size={20} className="text-gray-400" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          type="text"
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-5 py-3 rounded-full bg-gray-800/80 border border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm text-gray-100 placeholder-gray-500"
        />

        <button
          onClick={handleSend}
          disabled={sending || (!message.trim() && !image)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all duration-200 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          <IoSend size={17} className="text-white translate-x-[1px]" />
        </button>
      </div>
    </div>
  );
}

export default Type;