import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorMessage from './ErrorMessage';
import ChatHistory from './ChatHistory';
import { format } from 'date-fns';

export default function ChatInterface({ isSidebarOpen, toggleSidebar }) {
  const [user] = useAuthState(auth);
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageTimestamp = useRef(null);

  // Add refresh interval state and ref
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = useRef(null);

  // Add new state for selected date
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchLatestMessages = useCallback(async () => {
    if (!user || !autoRefresh) return;

    try {
      const timestamp = lastMessageTimestamp.current || new Date(0).toISOString();
      const response = await fetch(`/api/messages?userId=${user.uid}&after=${timestamp}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages');
      }

      if (data.messages?.length > 0) {
        setMessages(prevMessages => {
          const newMessages = data.messages.filter(
            newMsg => !prevMessages.some(existing => existing._id === newMsg._id)
          );
          if (newMessages.length === 0) return prevMessages; // Prevent unnecessary re-renders
          return [...prevMessages, ...newMessages];
        });
        lastMessageTimestamp.current = data.messages[data.messages.length - 1].createdAt;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user, autoRefresh]);

  // Remove existing useEffect for refresh interval and replace with this:
  useEffect(() => {
    if (!user) return;
    
    fetchLatestMessages(); // Fetch only on mount
  }, [user]);

  // Debounce the input change handler
  const handleInputChange = (e) => {
    setPrompt(e.target.value);
    setAutoRefresh(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isSending || !user) return;

    setIsSending(true);
    setAutoRefresh(false); // Stop auto-refresh when sending a message
    const userMessageText = prompt.trim();
    setPrompt('');

    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Add temporary message
    setMessages(prev => [...prev, {
      _id: tempId,
      text: userMessageText,
      sender: 'user',
      createdAt: now,
      userId: user.uid
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessageText,
          userId: user.uid
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Remove temp message and add actual messages
      setMessages(prev => {
        const withoutTemp = prev.filter(msg => msg._id !== tempId);
        return [...withoutTemp, ...data.messages];
      });

      // Update last message timestamp
      if (data.messages?.length) {
        lastMessageTimestamp.current = data.messages[data.messages.length - 1].createdAt;
      }

      // Manually fetch latest messages after sending
      await fetchLatestMessages();

    } catch (error) {
      console.error('Chat Error:', error);
      setError(error.message);
      
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    } finally {
      setIsSending(false);
      setAutoRefresh(true); // Re-enable auto-refresh after sending
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages based on selected date
  const filteredMessages = useMemo(() => {
    return messages.filter(message => 
      format(new Date(message.createdAt), 'yyyy-MM-dd') === selectedDate
    );
  }, [messages, selectedDate]);

  const MessageBubble = React.memo(({ message }) => {
    const formattedTime = useMemo(() => {
      try {
        const date = new Date(message.createdAt);
        return date.toLocaleTimeString();
      } catch (error) {
        console.error('Date formatting error:', error);
        return '';
      }
    }, [message.createdAt]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[85%] p-6 ${
            message.sender === 'user'
              ? 'bg-blue-600 text-white'
              : message.isError
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-white border border-gray-200'
          } rounded-2xl shadow-lg`}
        >
          <p className="text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>
          {formattedTime && (
            <p className="text-xs mt-2 opacity-70 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formattedTime}
            </p>
          )}
        </div>
      </motion.div>
    );
  });

  // Update the layout section of the return statement:
  return (
    <div className="flex h-full w-full">
      {/* Chat History Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chat History</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                setMessages([]);
                setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Chat
            </button>
            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className={`w-full px-4 py-2 text-left text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                ${selectedDate === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Today's Chat
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <ChatHistory 
              messages={messages}
              onSelectChat={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && <ErrorMessage error={error} onClose={() => setError(null)} />}
        <div className="flex-1 overflow-hidden bg-white shadow-xl m-2 lg:m-4 rounded-2xl flex flex-col border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedDate === format(new Date(), 'yyyy-MM-dd')
                ? 'Today\'s Chat'
                : format(new Date(selectedDate), 'MMMM d, yyyy')}
            </h1>
          </div>

          {/* Increased padding and max width for messages */}
          <div className="flex-1 overflow-y-auto px-12 py-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <AnimatePresence>
                {filteredMessages?.map((message) => (
                  <MessageBubble key={message._id} message={message} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Increased width for input form */}
          <form onSubmit={handleSubmit} className="p-8 border-t border-gray-100 bg-white">
            <div className="max-w-6xl mx-auto flex space-x-4">
              <input
                type="text"
                value={prompt}
                onChange={handleInputChange}
                disabled={isSending}
                className="flex-1 px-8 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                placeholder="Type your message..."
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 min-w-[120px]"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}