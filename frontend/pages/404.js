import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const NotFound = () => {
    return (
        <div className="flex items-center justify-center px-4 py-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <motion.div
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="mb-8"
                >
                    <svg 
                        className="w-32 h-32 mx-auto text-blue-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                    </svg>
                </motion.div>

                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Oops! Page Not Found
                </h1>
                
                <p className="text-gray-600 text-lg mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <Link 
                    href="/"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                    <svg 
                        className="w-5 h-5 mr-2" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                        />
                    </svg>
                    Return Home
                </Link>

                <div className="mt-8 text-sm text-gray-500">
                    Need help? <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact Support</a>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound; 