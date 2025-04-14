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

  // Add new state for showing history modal
  const [showHistory, setShowHistory] = useState(false);

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
        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}
      >
        <div
          className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-6 ${
            message.sender === 'user'
              ? 'bg-blue-600 text-white'
              : message.isError
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-white border border-gray-200'
          } rounded-2xl shadow-lg`}
        >
          <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.text}</p>
          {formattedTime && (
            <p className="text-[10px] sm:text-xs mt-2 opacity-70 flex items-center gap-1">
              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      {/* Desktop Chat History Sidebar - Fixed width, always visible on desktop */}
      <div className="hidden md:block w-80 flex-shrink-0 border-r border-gray-200">
        <div className="h-full">
          <ChatHistory 
            messages={messages}
            onSelectChat={setSelectedDate}
            selectedDate={selectedDate}
            
          />
        </div>
      </div>

      {/* Main Content Area - Takes remaining width */}
      <div className="flex-1 w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            {selectedDate === format(new Date(), 'yyyy-MM-dd')
              ? "Today's Chat"
              : format(new Date(selectedDate), 'MMMM d, yyyy')}
          </h1>
          {/* Mobile History Button */}
          <button
            onClick={() => setShowHistory(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Show chat history"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Chat History Modal */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white shadow-xl z-50 flex flex-col rounded-t-xl"
                style={{ height: 'calc(100vh - 4rem)' }}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900"></h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Close history"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ChatHistory 
                    messages={messages}
                    onSelectChat={(date) => {
                      setSelectedDate(date);
                      setShowHistory(false);
                    }}
                    selectedDate={selectedDate}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && <ErrorMessage error={error} onClose={() => setError(null)} />}
          <div className="flex-1 overflow-y-auto bg-white shadow-xl mx-2 my-2 sm:m-4 rounded-2xl flex flex-col border border-gray-100">
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-4 sm:py-6 lg:py-8">
              <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
                <AnimatePresence>
                  {filteredMessages?.map((message) => (
                    <MessageBubble key={message._id} message={message} />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input form */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto flex space-x-2 sm:space-x-4">
                  <input
                    type="text"
                    value={prompt}
                    onChange={handleInputChange}
                    disabled={isSending}
                    className="flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="Type your message..."
                  />
                  <button
                    type="submit"
                    disabled={isSending}
                    className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}