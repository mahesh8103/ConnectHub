
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5002",
  withCredentials: true,
});

export const summarizeChat = async (messages) => {
  const response = await API.post("/api/ai/summarize", { messages });
  return response.data.data;
};

export const getSmartReplies = async (
  lastMessage,
  senderName,
  contextMessages = []
) => {
  const response = await API.post("/api/ai/suggestions", {
    lastMessage,
    senderName,
    contextMessages,
  });
  return response.data.data;
};