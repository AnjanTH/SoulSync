import React from 'react';
import { motion } from 'framer-motion';

const ErrorMessage = ({ message, onClose }) => {
    if (!message) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="error-message"
        >
            <div className="flex items-center justify-between">
                <span>{message}</span>
                <button 
                    onClick={onClose}
                    className="text-xl leading-none"
                    aria-label="Close error message"
                >
                    ×
                </button>
            </div>
        </motion.div>
    );
};

export default ErrorMessage;