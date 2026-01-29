import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageCircle, ArrowLeft, Clock, Check, CheckCircle } from 'lucide-react';
import API_URL from '../config';

interface Contact {
    _id: string;
    name: string;
    email: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

interface Message {
    _id: string;
    sender: string;
    receiver: string;
    content: string;
    createdAt: string;
    read: boolean;
}

interface ChatSystemProps {
    currentUser: any;
    role: 'farmer' | 'buyer' | 'service';
}

const ChatSystem: React.FC<ChatSystemProps> = ({ currentUser, role }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isMobileView, setIsMobileView] = useState(false);

    // Check for mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch Contacts
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                console.log('ChatSystem: currentUser:', currentUser);
                if (!currentUser?.clerkId) {
                    console.error('ChatSystem: Missing clerkId in currentUser');
                    return;
                }

                const response = await fetch(`${API_URL}/api/chat/contacts`, {
                    headers: {
                        'x-clerk-user-id': currentUser.clerkId
                    }
                });

                console.log('ChatSystem: API Response Status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    setContacts(data);
                }
            } catch (error) {
                console.error('Error fetching contacts:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchContacts();
        // Poll for new contacts/messages every 30s
        const interval = setInterval(fetchContacts, 30000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Fetch Messages when contact selected
    useEffect(() => {
        if (!selectedContact) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/chat/messages/${selectedContact._id}`, {
                    headers: {
                        'x-clerk-user-id': currentUser.clerkId
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                    scrollToBottom();
                    // Update unread count locally
                    setContacts(prev => prev.map(c =>
                        c._id === selectedContact._id ? { ...c, unreadCount: 0 } : c
                    ));
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll messages faster
        return () => clearInterval(interval);
    }, [selectedContact, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        const tempId = Date.now().toString();
        const tempMsg = {
            _id: tempId,
            sender: currentUser._id,
            receiver: selectedContact._id,
            content: newMessage,
            createdAt: new Date().toISOString(),
            read: false
        };

        // Optimistic update
        setMessages([...messages, tempMsg]);
        setNewMessage('');
        scrollToBottom();

        try {
            const response = await fetch(`${API_URL}/api/chat/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-clerk-user-id': currentUser.clerkId
                },
                body: JSON.stringify({
                    receiverId: selectedContact._id,
                    content: tempMsg.content
                })
            });

            if (!response.ok) {
                console.error('Failed to send message');
                // Revert or show error (simplified here)
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // UI Components
    const ContactList = () => (
        <div className={`flex-col h-full bg-white border-r border-gray-200 ${selectedContact && isMobileView ? 'hidden' : 'flex'} w-full md:w-80`}>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Messages
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {initialLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading contacts...</div>
                ) : contacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="mb-2">No conversations yet.</p>
                        <p className="text-sm">Chats appear when you have an active offer or bid.</p>
                    </div>
                ) : (
                    contacts.map(contact => (
                        <div
                            key={contact._id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedContact?._id === contact._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                {contact.lastMessageTime && (
                                    <span className="text-xs text-gray-400">
                                        {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500 truncate w-4/5">
                                    {contact.lastMessage || 'Start a conversation'}
                                </p>
                                {contact.unreadCount && contact.unreadCount > 0 ? (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {contact.unreadCount}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const ChatWindow = () => {
        if (!selectedContact) {
            return (
                <div className={`flex-1 flex items-center justify-center bg-gray-50 text-gray-400 flex-col ${!selectedContact && isMobileView ? 'hidden' : 'flex'}`}>
                    <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                    <p>Select a contact to start chatting</p>
                </div>
            );
        }

        return (
            <div className={`flex-1 flex flex-col h-full bg-gray-100 ${selectedContact && isMobileView ? 'flex' : 'hidden md:flex'}`}>
                {/* Header */}
                <div className="p-4 bg-white border-b border-gray-200 flex items-center shadow-sm">
                    <button
                        onClick={() => setSelectedContact(null)}
                        className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-full text-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{selectedContact.name}</h3>
                        <p className="text-xs text-green-600 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Online via FarmConnect
                        </p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading && messages.length === 0 ? (
                        <div className="text-center py-4 text-gray-400">Loading messages...</div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender === currentUser._id;
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <div className={`text-[10px] mt-1 flex items-center justify-end ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && (
                                                msg.read ? <CheckCircle className="w-3 h-3 ml-1" /> : <Check className="w-3 h-3 ml-1" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg overflow-hidden flex border border-gray-200">
            <ContactList />
            <ChatWindow />
        </div>
    );
};

export default ChatSystem;
