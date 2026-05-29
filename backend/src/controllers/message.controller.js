import { Message } from "../models/message.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getMessages = asyncHandler(async (req, res) => {
  const { id: receiverId } = req.params;
  const senderId = req.user._id;
  const limit = 20;
  const skip = parseInt(req.query.skip) || 0;

  const messages = await Message.find({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    await Message.updateMany(
      { senderId: receiverId, receiverId: senderId, status: "sent" },
      { status: "delivered" }
    );
    const senderSocketId = getReceiverSocketId(receiverId);
    if(senderSocketId){
      io.to(senderSocketId).emit("messagesDelivered", { to : senderId });
    }

  return res.status(200).json(new ApiResponse(200, messages.reverse(), "Messages fetched successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { id: receiverId } = req.params;
  const senderId = req.user._id;
  const { message } = req.body;

  let imageUrl = "";
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) { imageUrl = uploaded.url; }
  }

  if (!message && !imageUrl) {
    throw new ApiError(400, "Message or image cannot be empty");
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message: message || "",
    image: imageUrl,
    status: "sent"
  });

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });
    newMessage.status = "delivered"; // update status before sending to receiver
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  return res.status(201).json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

const markMessagesSeen = asyncHandler(async (req, res) => {
  const { id: senderId } = req.params;
  const receiverId = req.user._id;

  await Message.updateMany(
    { senderId, receiverId, status: "delivered" },
    { status: "seen" }
  );

  const senderSocketId = getReceiverSocketId(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen", { by: receiverId });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Messages marked as seen successfully"));
});

export { getMessages, sendMessage, markMessagesSeen };