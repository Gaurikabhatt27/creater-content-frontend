import axiosInstance from "./axiosInstance";

export const getConversations = async () => {
    const response = await axiosInstance.get("/chat");
    return response.data;
};

export const getMessages = async (conversationId) => {
    const response = await axiosInstance.get(`/chat/${conversationId}`);
    return response.data;
};

export const sendMessage = async (data) => {
    const response = await axiosInstance.post("/chat/message", data);
    return response.data;
};

export const createConversation = async (data) => {
    const response = await axiosInstance.post("/chat/conversation", data);
    return response.data;
};
