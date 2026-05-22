import { useState } from "react";
import { AuthContext } from "./AuthContext";
import { useEffect } from "react";
import axios from "axios";


function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [selectedUser ,setSelectedUser] = useState(null);

   
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5002/users/currentUser",
          { withCredentials: true }
        );
        setAuthUser(res.data.data); //  restore user from cookie on refresh otherwise all message will be
      } catch (error) {                         // shown in one side bcz of undefined authUser id which get refreshed on every refresh
        setAuthUser(null); // not logged in
        console.log(error.response?.data?.message || "Failed to fetch current user");
      }
    };

    fetchCurrentUser();
  }, []); // runs once on app load

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser ,selectedUser , setSelectedUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;