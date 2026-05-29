import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "../routes/user.routes.js";
import messageRouter from "../routes/message.routes.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
app.get("/", (req, res) => res.send("API is running..."));
app.use("/users", userRouter);
app.use("/messages", messageRouter);

// online users map
const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  const sockets = userSocketMap[receiverId];
  return sockets && sockets.length > 0 ? sockets[0] : null;
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const userId = socket.handshake.query.userId;
 if (userId) {
    if (!userSocketMap[userId]) userSocketMap[userId] = [];
    userSocketMap[userId].push(socket.id);
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  // typing indicator 

  socket.on("typing",({ receiverId })=>{
    const receiverSocketId = getReceiverSocketId(receiverId);
    if(receiverSocketId){
      io.to(receiverSocketId).emit("userTyping", { senderId: userId });
    }
  })

  socket.on("stopTyping",({ receiverId })=>{
        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
          io.to(receiverSocketId).emit("userStopTyping", { senderId: userId });
        }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (userId) {
      userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);
      if (userSocketMap[userId].length === 0) delete userSocketMap[userId];
    }    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// global error handler middleware — converts errors to JSON
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  return res.status(statusCode).json({
    statusCode,
    message,
    success: false,
  });
});
export { app, server, io };