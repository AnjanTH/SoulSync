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
    <div className="flex flex-col h-full">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200 bg-white">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Chat History</h2>
      </div>

      {/* Scrollable Messages Section */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-4 p-3 sm:p-4">
          {sortedDates.map(date => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-500 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
                {date === format(new Date(), 'yyyy-MM-dd') 
                  ? 'Today'
                  : format(new Date(date), 'MMMM d, yyyy')}
              </h3>
              <div className="space-y-1.5">
                {chatsByDate[date].map(message => (
                  <button
                    key={message._id}
                    onClick={() => onSelectChat(date)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs sm:text-sm transition-all
                      ${selectedDate === date
                        ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                        : 'hover:bg-gray-50 text-gray-700 hover:shadow-sm'}
                      relative group`}
                  >
                    <p className="truncate font-medium group-hover:text-blue-600 transition-colors">
                      {message.text}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </p>
                      {selectedDate === date && (
                        <span className="text-[10px] sm:text-xs text-blue-500">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {sortedDates.length === 0 && (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💭</div>
              <p className="text-xs sm:text-sm text-gray-500">No chat history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}