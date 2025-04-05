import { motion } from 'framer-motion';

export default function ErrorMessage({ error, onClose }) {
  if (!error) return null;

  // Helper function to format error messages
  const getErrorMessage = (error) => {
    if (error.includes('Rate limit reached')) {
      return {
        title: 'API Rate Limit Reached',
        message: 'Free tokens are exhausted for today. Please try again later or upgrade to continue chatting.',
        type: 'rate-limit'
      };
    }
    
    return {
      title: 'Error',
      message: error || 'An unexpected error occurred. Please try again.',
      type: 'general'
    };
  };

  const errorDetails = getErrorMessage(error);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 max-w-md"
    >
      <div className={`rounded-lg shadow-lg p-4 ${
        errorDetails.type === 'rate-limit' 
          ? 'bg-yellow-50 border-l-4 border-yellow-400' 
          : 'bg-red-50 border-l-4 border-red-400'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {errorDetails.type === 'rate-limit' ? (
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${
              errorDetails.type === 'rate-limit' ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {errorDetails.title}
            </p>
            <p className={`mt-1 text-sm ${
              errorDetails.type === 'rate-limit' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {errorDetails.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex text-sm ${
                errorDetails.type === 'rate-limit' 
                  ? 'text-yellow-400 hover:text-yellow-500' 
                  : 'text-red-400 hover:text-red-500'
              }`}
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}