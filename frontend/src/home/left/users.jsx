import React, { useEffect, useState } from 'react'
import axios from 'axios'
import User from './user'
import useSocket from '../../context/useSocket.js';
import useAuth from '../../context/useAuth.js';

function Users({ searchQuery , onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({}); // { userId: count }
  const { socket } = useSocket();
  const { selectedUser } = useAuth();


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
      }
       finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // [] = Without [], fetchUsers() would run every time the component re-renders — including after setUsers() is called — creating an infinite loop:
                        // fetch → setUsers → re-render → fetch → setUsers → re-render → 
                        //The [] says: "Only run once, never again" — which is exactly what you want for initial data loading.

    useEffect(()=>{
      if(!socket) return;
      socket.on("newMessage",(newMessage)=>{
        if(newMessage.senderId!== selectedUser?._Id){
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
          }));
        }
      })
      return ()=> {
        socket.off("newMessage");
      }
    },[socket, selectedUser])

    useEffect(()=>{
      if (selectedUser) {
        setUnreadCounts(prev => ({
          ...prev,
          [selectedUser._id]: 0
        }));
      }
    }, [selectedUser])

    // filter users based on searchQuery — checks fullName and username
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true; // no query → show all
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
      {/* no results found */}
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-gray-600 text-sm">
            {searchQuery ? `No users found for "${searchQuery}"` : "No users found"}
          </p>
          {searchQuery && (
            <p className="text-gray-700 text-xs">Try a different name or username</p>
          )}
        </div>
      )}

      {filteredUsers.map((user) => (
        <User 
        key={user._id} 
        user={user} 
        onUserSelect = {onUserSelect}
        unreadCount={unreadCounts[user._id] || 0}
         />
      ))}
    </div>
  )
}

export default Users