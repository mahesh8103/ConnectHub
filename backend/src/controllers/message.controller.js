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

  const undeliveredMessages = await Message.find({
    senderId: receiverId,
    receiverId: senderId,
    status: "sent",
  }).select("_id");

  const deliveredIds = undeliveredMessages.map((m) => m._id);

  if (deliveredIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: deliveredIds } },
      { $set: { status: "delivered" } }
    );

    const senderSocketId = getReceiverSocketId(String(receiverId));
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesDelivered", {
        to: String(senderId),
        messageIds: deliveredIds.map(String),
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, messages.reverse(), "Messages fetched successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { id: receiverId } = req.params;
  const senderId = req.user._id;
  const { message } = req.body;

  let imageUrl = "";
  if (req.file) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) {
      imageUrl = uploaded.url;
    }
  }

  if (!message && !imageUrl) {
    throw new ApiError(400, "Message or image cannot be empty");
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message: message || "",
    image: imageUrl,
    status: "sent",
  });

  const receiverSocketId = getReceiverSocketId(String(receiverId));
  const senderSocketId = getReceiverSocketId(String(senderId));

  if (receiverSocketId) {
    await Message.findByIdAndUpdate(newMessage._id, { $set: { status: "delivered" } });
    newMessage.status = "delivered";
    io.to(receiverSocketId).emit("newMessage", newMessage);

    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesDelivered", {
        to: String(receiverId),
        messageIds: [String(newMessage._id)],
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

const markMessagesSeen = asyncHandler(async (req, res) => {
  const { id: senderId } = req.params;
  const receiverId = req.user._id;

  const unseenMessages = await Message.find({
    senderId,
    receiverId,
    status: { $in: ["sent", "delivered"] },
  }).select("_id");

  const messageIds = unseenMessages.map((m) => m._id);

  if (messageIds.length > 0) {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: "seen" } }
    );

    const senderSocketId = getReceiverSocketId(String(senderId));
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        by: String(receiverId),
        messageIds: messageIds.map(String),
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Messages marked as seen successfully"));
});

const searchMessages = asyncHandler(async (req, res) => {
  const { id: otherUserId } = req.params;
  const myId = req.user._id;
  const { query } = req.query;

  if (!query || query.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  const results = await Message.find({
    $or: [
      { senderId: myId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: myId },
    ],
    message: {
      $regex: query.trim(),
      $options: "i",
    },
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(200, results.reverse(), `Found ${results.length} messages`)
    );
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.senderId.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  message.isDeleted = true;
  message.message = "";
  message.image = "";
  await message.save();

  const receiverSocketId = getReceiverSocketId(String(message.receiverId));
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("messageDeleted", { messageId });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { messageId }, "Message deleted"));
});

const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji) {
    throw new ApiError(400, "Emoji is required");
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const existingIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString()
  );

  if (existingIndex !== -1) {
    if (message.reactions[existingIndex].emoji === emoji) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions[existingIndex].emoji = emoji;
    }
  } else {
    message.reactions.push({ userId, emoji });
  }

  await message.save();

  const updatedReactions = message.reactions;

  const otherUserId =
    message.senderId.toString() === userId.toString()
      ? message.receiverId
      : message.senderId;

  const otherSocketId = getReceiverSocketId(String(otherUserId));
  if (otherSocketId) {
    io.to(otherSocketId).emit("messageReacted", {
      messageId,
      reactions: updatedReactions,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messageId, reactions: updatedReactions },
        "Reaction updated"
      )
    );
});

export {
  getMessages,
  sendMessage,
  markMessagesSeen,
  searchMessages,
  deleteMessage,
  reactToMessage,
};