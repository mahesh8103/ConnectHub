import React, { useEffect, useState } from 'react'
import axios from 'axios'
import User from './user'

function Users() {
  const [users, setUsers] = useState([]);

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
    };

    fetchUsers();
  }, []); // [] = Without [], fetchUsers() would run every time the component re-renders — including after setUsers() is called — creating an infinite loop:
                        // fetch → setUsers → re-render → fetch → setUsers → re-render → 
                        //The [] says: "Only run once, never again" — which is exactly what you want for initial data loading.

  return (
    <div className="flex flex-col gap-1">
      {users.map((user) => (
        <User key={user._id} user={user} />  // pass each user as prop
      ))}
    </div>
  )
}

export default Users