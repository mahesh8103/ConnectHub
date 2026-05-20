import { useState } from "react";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;