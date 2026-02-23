import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { getConversations, getMessages, sendMessage, createConversation } from "../api/chatApi";
import { getAllUsers } from "../api/authApi";
import { useLocation } from "react-router-dom";

const Chat = () => {
    const { user } = useSelector(state => state.auth);
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    const currentChatIdRef = useRef(null);

    useEffect(() => {
        currentChatIdRef.current = currentChat?._id || null;
    }, [currentChat]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const newSocket = io("http://localhost:5500", {
            withCredentials: true
        });
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    useEffect(() => {
        if (socket && user) {
            socket.emit("join", user._id);

            const handleReceiveMessage = (data) => {
                const chatField = data.conversation || data.conversationId;

                if (chatField === currentChatIdRef.current) {
                    setMessages((prev) => [...prev, data]);
                }

                setConversations(prev => prev.map(conv => {
                    if (conv._id === chatField) {
                        return { ...conv, lastMessage: data };
                    }
                    return conv;
                }));
            };

            const handleTyping = (data) => {
                const currentUserId = typeof user === 'object' && user !== null ? user._id || user.id : user;
                if (String(data.senderId) !== String(currentUserId)) {
                    setOtherUserTyping(true);
                    // Hide typing after 3 seconds of no new typing events
                    setTimeout(() => {
                        setOtherUserTyping(false);
                    }, 3000);
                }
            };

            socket.on("receiveMessage", handleReceiveMessage);
            socket.on("typing", handleTyping);

            return () => {
                socket.off("receiveMessage", handleReceiveMessage);
                socket.off("typing", handleTyping);
            };
        }
    }, [socket, user]);

    useEffect(() => {
        const fetchConvos = async () => {
            try {
                const res = await getConversations();
                const convos = res.conversations || [];
                setConversations(convos);

                // Check if we navigated here with a specific conversation to open
                if (location.state?.conversationId) {
                    const targetConvo = convos.find(c => c._id === location.state.conversationId);
                    if (targetConvo) {
                        setCurrentChat(targetConvo);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch conversations", err);
            }
        };
        fetchConvos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.conversationId]);

    useEffect(() => {
        const fetchConversationMessages = async () => {
            if (currentChat) {
                try {
                    const res = await getMessages(currentChat._id);
                    setMessages(res.messages || []);
                } catch (err) {
                    console.error("Failed to fetch messages", err);
                }
            }
        };
        fetchConversationMessages();
    }, [currentChat]);

    useEffect(() => {
        if (isNewChatOpen && user) {
            const fetchUsers = async () => {
                try {
                    const res = await getAllUsers();
                    setAllUsers(res.users || res || []);
                } catch (err) {
                    console.error("Failed to fetch users", err);
                }
            };
            fetchUsers();
        }
    }, [isNewChatOpen, user]);

    const handleStartNewChat = async (otherUserId) => {
        try {
            const res = await createConversation({ senderId: user._id, receiverId: otherUserId });
            const newConvo = res.conversation;

            setConversations(prev => {
                if (!prev.find(c => c._id === newConvo._id)) {
                    return [newConvo, ...prev];
                }
                return prev;
            });

            setCurrentChat(newConvo);
            setIsNewChatOpen(false);
        } catch (err) {
            console.error("Failed to start new chat", err);
        }
    };

    const handleSend = async (e) => {
        // Handle both form submission and button click safely
        if (e) e.preventDefault();

        const messageText = newMessage.trim();
        if (!messageText || !currentChat) return;

        // Immediately clear input for snappy UI
        setNewMessage("");

        const otherParticipant = getOtherParticipant(currentChat);
        if (!otherParticipant) return;

        const currentUserId = typeof user === 'object' && user !== null ? user._id || user.id : user;
        const receiverId = typeof otherParticipant === 'object' && otherParticipant !== null ? otherParticipant._id : otherParticipant;

        const messageData = {
            conversationId: currentChat._id,
            senderId: currentUserId,
            receiverId: receiverId,
            text: messageText
        };

        try {
            const res = await sendMessage(messageData);
            const sentMessage = res.message;
            setMessages(prev => [...prev, sentMessage]);

            socket.emit("sendMessage", { ...sentMessage, receiver: receiverId });

            setConversations(prev => prev.map(conv => {
                if (conv._id === currentChat._id) {
                    return { ...conv, lastMessage: sentMessage };
                }
                return conv;
            }));
        } catch (err) {
            console.error("Failed to send message", err);
            // Revert on failure
            setNewMessage(messageText);
        }
    };

    const handleTypingChange = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !currentChat || !user) return;

        if (!isTyping) {
            setIsTyping(true);
            const otherParticipant = getOtherParticipant(currentChat);
            if (otherParticipant) {
                const receiverId = typeof otherParticipant === 'object' && otherParticipant !== null ? otherParticipant._id : otherParticipant;
                const senderId = typeof user === 'object' && user !== null ? user._id || user.id : user;
                socket.emit("typing", { senderId, receiverId });
            }

            setTimeout(() => {
                setIsTyping(false);
            }, 3000);
        }
    };

    const getOtherParticipant = (conversation) => {
        if (!conversation || !conversation.participants || !user) return null;
        return conversation.participants.find(p => {
            const pId = typeof p === 'object' && p !== null ? p._id : p;
            const uId = typeof user === 'object' && user !== null ? user._id || user.id : user;
            return String(pId) !== String(uId);
        });
    };

    return (
        <div className="flex h-[calc(100vh-80px)] -mx-4 -mb-8 overflow-hidden bg-gray-50 border-t border-gray-200">

            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
                        <p className="text-sm text-gray-500 mt-1">Chat securely with creators</p>
                    </div>
                    <button
                        onClick={() => setIsNewChatOpen(true)}
                        className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-md"
                        title="New Chat"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherParticipant(conv);
                            const isSelected = currentChat?._id === conv._id;

                            return (
                                <div
                                    key={conv._id}
                                    onClick={() => setCurrentChat(conv)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50 ${isSelected ? "border-l-4 border-l-blue-600 bg-blue-50" : "border-l-4 border-l-transparent"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {otherUser?.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 truncate">{otherUser?.name || "Unknown User"}</h4>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                {conv.lastMessage?.text || "Started a conversation"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className="w-2/3 flex flex-col bg-slate-50 relative">
                {!currentChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-24 h-24 mb-6 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-700">Your Messages</h3>
                        <p className="mt-2 text-gray-500">Select a conversation from the sidebar to start chatting.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-6 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center gap-4 shadow-sm z-10 sticky top-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                                {typeof getOtherParticipant(currentChat) === 'object' ? getOtherParticipant(currentChat)?.name?.[0]?.toUpperCase() : "?"}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{typeof getOtherParticipant(currentChat) === 'object' ? getOtherParticipant(currentChat)?.name : "Unknown User"}</h3>
                                <p className="text-xs font-medium flex items-center gap-1">
                                    {otherUserTyping ? (
                                        <span className="text-blue-500 italic flex items-center gap-1 animate-pulse">
                                            Typing...
                                        </span>
                                    ) : (
                                        <span className="text-green-500 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto w-full">
                            <div className="flex flex-col gap-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 my-8">
                                        Send a message to start the conversation!
                                    </div>
                                )}
                                {messages.map((msg, idx) => {
                                    // Fix: handle if sender is just an ID string, or a populated mongoose object
                                    const senderId = typeof msg.sender === 'object' && msg.sender !== null ? msg.sender._id : msg.sender;
                                    // Handle user object as well just in case
                                    const currentUserId = typeof user === 'object' && user !== null ? user._id || user.id : user;

                                    const isMe = String(senderId) === String(currentUserId);

                                    return (
                                        <div key={msg._id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}>
                                            <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm ${isMe
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                                                }`}>
                                                <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                                                <span className={`text-[10px] mt-2 block opacity-70 ${isMe ? "text-right" : "text-left"}`}>
                                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleTypingChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-gray-100 border-transparent rounded-full px-6 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!newMessage.trim()}
                                    className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {isNewChatOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">Start New Chat</h3>
                            <button onClick={() => setIsNewChatOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {allUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No users found.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {allUsers.map(u => (
                                        <div
                                            key={u._id}
                                            onClick={() => handleStartNewChat(u._id)}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition border border-transparent hover:border-blue-100"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">{u.name}</h4>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default Chat;
