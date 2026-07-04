import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "../routes/user.routes.js";
import messageRouter from "../routes/message.routes.js";
import aiRouter from "../routes/ai.route.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", (req, res) => res.send("API is running..."));
app.use("/users", userRouter);
app.use("/messages", messageRouter);
app.use("/api/ai", aiRouter);


const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  const id = String(receiverId);
  const sockets = userSocketMap[id];
  return sockets && sockets.length > 0 ? sockets[0] : null;
};

const emitToUser = (userId, event, data) => {
  const id = String(userId);
  const sockets = userSocketMap[id] || [];
  sockets.forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    const id = String(userId);
    if (!userSocketMap[id]) userSocketMap[id] = [];
    if (!userSocketMap[id].includes(socket.id)) {
      userSocketMap[id].push(socket.id);
    }
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ receiverId }) => {
    emitToUser(receiverId, "userTyping", { senderId: userId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    emitToUser(receiverId, "userStopTyping", { senderId: userId });
  });

  socket.on("disconnect", () => {
    if (userId) {
      const id = String(userId);
      userSocketMap[id] = (userSocketMap[id] || []).filter(
        (sid) => sid !== socket.id
      );
      if (userSocketMap[id].length === 0) {
        delete userSocketMap[id];
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    statusCode,
    message,
    success: false,
  });
});

export { app, server, io, emitToUser };