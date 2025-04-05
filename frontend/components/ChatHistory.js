import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function ChatHistory({ messages, onSelectChat, selectedDate }) {
  // Group messages by date
  const chatsByDate = messages.reduce((acc, message) => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(chatsByDate).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
      </div>

      {/* Scrollable Messages Section */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="space-y-6 p-4">
          {sortedDates.map(date => (
            <motion.div 
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-medium text-gray-500 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                {date === format(new Date(), 'yyyy-MM-dd') 
                  ? 'Today'
                  : format(new Date(date), 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {chatsByDate[date].map(message => (
                  <motion.button
                    key={message._id}
                    onClick={() => onSelectChat(date)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all
                      ${selectedDate === date
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'}
                      relative group`}
                  >
                    <p className="truncate font-medium group-hover:text-blue-600 transition-colors">
                      {message.text}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </p>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: selectedDate === date ? 1 : 0 }}
                        className="text-xs text-blue-500"
                      >
                        Active
                      </motion.span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}