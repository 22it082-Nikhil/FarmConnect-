import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, ArrowLeft, MoreVertical, Search, CheckCheck, Trash, Clock } from 'lucide-react';
import API_URL from '../config';

interface User {
    _id: string;
    name: string;
    email?: string;
    id?: string; // Handle both id formats if necessary
}

interface Crop {
    name: string;
    quantity: number;
    unit?: string;
}

interface Offer {
    _id: string;
    crop: Crop;
    pricePerUnit: number;
}

interface Chat {
    _id: string;
    participants: User[];
    offer: Offer;
    lastMessage: string;
    updatedAt: string;
}

interface Message {
    _id: string;
    sender: User;
    content: string;
    createdAt: string;
}

interface ChatSystemProps {
    currentUser: {
        id: string;
        name: string;
    };
    role?: string;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ currentUser, role }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Handle window resize for mobile responsiveness
    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    // Fetch all chats
    useEffect(() => {
        fetchChats();
    }, [currentUser]);

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (selectedChat) {
            const interval = setInterval(() => {
                fetchMessages(selectedChat._id);
            }, 3000); // Poll every 3 seconds
            fetchMessages(selectedChat._id);
            return () => clearInterval(interval);
        }
    }, [selectedChat]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchChats = async () => {
        try {
            if (!currentUser?.id) return;
            const response = await fetch(`${API_URL}/api/chats?userId=${currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                setChats(data);
            }
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        try {
            const response = await fetch(`${API_URL}/api/chats/${selectedChat._id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    senderId: currentUser.id,
                    content: newMessage
                }),
            });

            if (response.ok) {
                setNewMessage('');
                fetchMessages(selectedChat._id);
                fetchChats(); // Refresh last message in chat list
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) return;

        try {
            const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setChats(chats.filter(c => c._id !== chatId));
                setSelectedChat(null);
                setMessages([]);
            } else {
                alert('Failed to delete chat');
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error deleting chat');
        }
    };

    const getOtherParticipant = (chat: Chat) => {
        return chat.participants.find(p => p._id !== currentUser.id && p.id !== currentUser.id) || { _id: 'unknown', name: 'Unknown User', email: '' } as User;
    };

    // Mobile View Toggle Logic
    if (isMobileView) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[calc(100vh-12rem)]">
                {!selectedChat ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                                Messages
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Loading chats...</div>
                            ) : chats.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No conversations yet.</p>
                                </div>
                            ) : (
                                chats.map(chat => {
                                    const otherUser = getOtherParticipant(chat);
                                    return (
                                        <div
                                            key={chat._id}
                                            onClick={() => setSelectedChat(chat)}
                                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(chat.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-green-600 mb-1">
                                                Product: {chat.offer?.crop?.name} ({chat.offer?.crop?.quantity})
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Start a conversation...'}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col bg-gray-50">
                        {/* Mobile Chat Header */}
                        <div className="p-4 bg-white shadow-sm flex items-center justify-between z-10">
                            <div className="flex items-center">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="mr-3 p-1 rounded-full hover:bg-gray-100"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <div>
                                    <h3 className="font-bold text-gray-900">{getOtherParticipant(selectedChat).name}</h3>
                                    <p className="text-xs text-gray-500">{selectedChat.offer?.crop?.name}</p>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(!showMenu);
                                    }}
                                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 focus:outline-none"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        fetchMessages(selectedChat._id);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                    Refresh Chat
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDeleteChat(selectedChat._id);
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    <Trash className="w-4 h-4 mr-2" />
                                                    Delete Chat
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Mobile Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender._id === currentUser.id || msg.sender.id === currentUser.id;
                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] p-3 rounded-2xl text-sm ${isMe
                                                    ? 'bg-green-600 text-white rounded-tr-none'
                                                    : 'bg-white text-gray-800 shadow-sm rounded-tl-none'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Mobile Chat Input */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                            <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent focus:outline-none text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="ml-2 text-green-600 disabled:text-gray-300"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // Desktop View
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[600px] flex">
            {/* Sidebar (Chat List) */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                        Messages
                    </h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        chats.map(chat => {
                            const otherUser = getOtherParticipant(chat);
                            return (
                                <div
                                    key={chat._id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedChat?._id === chat._id ? 'bg-white border-l-4 border-l-green-500 shadow-sm' : 'hover:bg-white'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                                        <span className="text-xs text-gray-400">
                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-green-600 mb-1">
                                        Product: {chat.offer?.crop?.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Start a conversation...'}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col bg-slate-50">
                    {/* Chat Header */}
                    <div className="p-4 bg-white shadow-sm flex justify-between items-center z-10">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{getOtherParticipant(selectedChat).name}</h3>
                            <div className="flex items-center text-sm text-gray-500">
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium mr-2">
                                    Bid: {selectedChat.offer?.crop?.name}
                                </span>
                                Price: {selectedChat.offer?.pricePerUnit}/unit
                            </div>
                        </div>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-2 hover:bg-gray-50 rounded-full text-gray-400 focus:outline-none"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    fetchMessages(selectedChat._id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                Refresh Chat
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDeleteChat(selectedChat._id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                            >
                                                <Trash className="w-4 h-4 mr-2" />
                                                Delete Chat
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, index) => {
                            const isMe = msg.sender._id === currentUser.id;
                            return (
                                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${isMe
                                                ? 'bg-green-600 text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-tl-none'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <div className={`text-[10px] mt-1 flex items-center justify-end ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && <CheckCheck className="w-3 h-3 ml-1" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-lg font-medium text-gray-500">Select a conversation to start chatting</p>
                </div>
            )}
        </div>
    );
};

export default ChatSystem;
