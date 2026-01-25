import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import useNoteStore from '../store/useNoteStore';

const ChatSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // We can pull the currently selected note ID if we want to provide context-aware chat in the future
    // const { selectedNote } = useNoteStore();
    // For now, the user ID is handled by the backend auth token or derived from the note if passed implicitly
    // But the requirement says "Goal: Chat with the knowledge base." which usually implies global context unless filtered.
    // The chatController uses `req.user.id` or `body.userId`. We'll rely on the auth token via axios.

    // Auto-scroll to bottom
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Retrieve userId from local storage or context if needed. 
            // However, our backend `chatController` checks `req.user.id` (from auth middleware) 
            // OR `req.body.userId`. Since we are using axios logic which likely sends the token,
            // we should ensure we send the userId if the controller STRICTLY demands it in the body.
            // Looking at `chatController.js`: `const effectiveUserId = authedUserId || bodyUserId`.
            // So if we are authenticated, we don't strictly need to send userId in body.
            // But let's check `App.jsx`... it sets token. We assume axios is configured to send headers.
            // Wait, standard axios doesn't auto-attach headers unless configured.
            // In App.jsx, `token` is state-managed.
            // We should use an axios instance with interceptor OR just manually attach header here if global config isn't set.
            // Checking Sidebar.jsx: useNoteStore fetches notes. 
            // Looking at App.jsx: `axios` is imported directly.
            // Let's assume global config or simple header attachment.
            // For safety, let's grab the token from localStorage directly here since we don't have a global api client file visible yet.

            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'x-auth-token': token
                }
            };

            // Note: We need a userId to query embeddings. 
            // The Token contains the userId, so `req.user.id` will be populated on backend.
            // We also send the query.

            const res = await axios.post('/api/chat', { query: userMessage.content }, config);

            const aiMessage = {
                role: 'assistant',
                content: res.data.answer,
                sources: res.data.sources
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed right-0 top-0 h-screen w-96 transition-transform duration-300 z-50 bg-gray-900 border-l border-gray-800 shadow-xl flex flex-col
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Toggle Button (Visible even when closed, technically - but we need an external trigger or floating button) */}
            {/* Actually, usually the toggle is OUTSIDE the sidebar. 
                Let's put the button strictly inside App.jsx or Sidebar.jsx? 
                Requirements say "Create ChatSidebar component (collapsible)". 
                It's cleaner if the component handles its own floating trigger if it's meant to be an overlay,
                OR we integrate it into the layout.
                Given typical patterns, let's add a floating toggle button that is always visible on the screen edge if closed?
                OR we assume the parent renders a button.
                Let's make this component SELF-CONTAINED including the trigger button.
            */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-4 -left-12 bg-blue-600 p-2 rounded-l-md text-white shadow-lg hover:bg-blue-700 focus:outline-none"
                title="Toggle AI Chat"
            >
                {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
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
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10 text-sm">
                        <p>Ask me anything about your notes!</p>
                    </div>
                )}

                {messages.map((msg, index) => (
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

                            {/* Sources Citation (Optional) */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                                    <p className="font-semibold mb-1">Sources:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {msg.sources.map((src, i) => (
                                            <li key={i} className="truncate">
                                                {/* We don't have titles in all chunks, maybe just snippet or ID */}
                                                Note ID: ...{src.noteId.slice(-6)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <Bot size={16} className="text-blue-400" />
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg rounded-tl-none text-gray-400">
                            <Loader2 size={18} className="animate-spin" />
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
                        placeholder="Type a message..."
                        className="w-full bg-gray-800 text-white rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm placeholder-gray-500"
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
