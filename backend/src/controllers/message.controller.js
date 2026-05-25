import { Message } from "../models/message.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// Get messages between logged in user and selected user
const getMessages = asyncHandler(async (req, res) => {
  const { id: receiverId } = req.params;
  const senderId = req.user._id;    
  const limit = 20;
  const skip = parseInt(req.query.skip) || 0;      

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },           // messages I sent to them
      { senderId: receiverId, receiverId: senderId }, // messages they sent to me
    ]
  })
  .sort({ createdAt: -1 }) 
  .limit(limit)
  .skip(skip)
  .lean();

  return res.status(200).json(new ApiResponse(200, messages.reverse(), "Messages fetched successfully"));
});


const sendMessage = asyncHandler(async (req, res) => {
  const { id: receiverId } = req.params;
  const senderId = req.user._id;
  const { message } = req.body;

  if (!message) {
    throw new ApiError(400, "Message cannot be empty");
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
  });

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }
  return res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

export { getMessages, sendMessage };