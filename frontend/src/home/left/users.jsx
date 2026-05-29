import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import User from './user'
import useSocket from '../../context/useSocket'
import useAuth from '../../context/useAuth'

function Users({ searchQuery, onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { socket } = useSocket();
  const { selectedUser } = useAuth();

  // this fixes mobile unread count issue — stale closure was causing it
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5002/users/getAllUsers",
          { withCredentials: true }
        );
        setUsers(res.data.data);
      } catch (error) {
        console.log(error.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // fixes mobile unread count not updating
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const currentSelected = selectedUserRef.current;
      // only count if NOT from currently open chat
      if (newMessage.senderId !== currentSelected?._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket]); // no selectedUser in deps — using ref instead

  // clear unread when user selected
  useEffect(() => {
    if (selectedUser) {
      setUnreadCounts(prev => ({ ...prev, [selectedUser._id]: 0 }));
    }
  }, [selectedUser]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-2 py-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-3 bg-gray-800 rounded animate-pulse w-28" />
              <div className="h-2 bg-gray-800 rounded animate-pulse w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 px-2">
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-gray-600 text-sm">
            {searchQuery ? `No users found for "${searchQuery}"` : "No users found"}
          </p>
        </div>
      )}

      {filteredUsers.map((user) => (
        <User
          key={user._id}
          user={user}
          unreadCount={unreadCounts[user._id] || 0}
          onUserSelect={onUserSelect}
        />
      ))}
    </div>
  )
}

export default Users