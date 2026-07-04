import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import axios from "axios";

function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5002/users/currentUser",
          { withCredentials: true }
        );
        setAuthUser(res.data.data);
      } catch {
        setAuthUser(null);
      }
    };
    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, selectedUser, setSelectedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;