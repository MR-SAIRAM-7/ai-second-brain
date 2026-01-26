import { useRef, useEffect, useState } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import useUIStore from '../store/useUIStore';
import api from '../api/axios';

const ChatSidebar = () => {
    const { isChatOpen, toggleChat, chatMessages, addMessage } = useUIStore();
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Scroll on open and new messages
    useEffect(() => {
        if (isChatOpen) {
            // slight delay to allow rendering
            setTimeout(scrollToBottom, 100);
        }
    }, [isChatOpen, chatMessages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        addMessage(userMessage);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat', { query: userMessage.content });

            const aiMessage = {
                role: 'assistant',
                content: res.data.answer,
                sources: res.data.sources
            };
            addMessage(aiMessage);

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again."
            };
            addMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed right-0 top-0 h-screen w-96 transition-transform duration-300 z-50 bg-gray-900 border-l border-gray-800 shadow-xl flex flex-col
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Floating Toggle Button */}
            <button
                onClick={toggleChat}
                className="absolute top-4 -left-12 bg-blue-600 p-2 rounded-l-md text-white shadow-lg hover:bg-blue-700 focus:outline-none"
                title="Toggle AI Chat"
            >
                {isChatOpen ? <X size={20} /> : <MessageCircle size={20} />}
            </button>

            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
                <div className="flex items-center gap-2 text-white font-semibold">
                    <Bot className="text-blue-500" size={24} />
                    <span>AI Assistant</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95 scrollbar-thin scrollbar-thumb-gray-700">
                {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        <p>Ask me anything about your notes!</p>
                    </div>
                )}

                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 
                            ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-blue-400" />}
                        </div>

                        <div className={`p-3 rounded-lg text-sm max-w-[80%] 
                            ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Sources Citation */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                                    <p className="font-semibold mb-1">Sources:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {msg.sources.map((src, i) => (
                                            <li key={i} className="truncate">
                                                {/* Fallback if Source title missing */}
                                                Note ID: ...{src.noteId.slice(-6)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Skeleton Loader */}
                {loading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
                        <div className="space-y-2 w-3/4">
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder={loading ? "Generating response..." : "Type a message..."}
                        className="w-full bg-gray-800 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatSidebar;
