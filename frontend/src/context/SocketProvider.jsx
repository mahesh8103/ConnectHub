import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";
import useAuth from "./useAuth";

function SocketProvider({ children }) {
  const { authUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!authUser) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const newSocket = io("http://localhost:5002", {
      query: { userId: authUser._id },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;