import { useState } from "react";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [selectedUser ,setSelectedUser] = useState(null);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser ,selectedUser , setSelectedUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;