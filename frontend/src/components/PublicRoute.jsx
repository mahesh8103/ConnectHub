import useAuth from "../context/useAuth";
import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
    const { authUser } = useAuth();
    if(authUser) return  <Navigate to="/chat" />;
    return children;
}

export default PublicRoute;