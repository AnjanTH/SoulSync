import React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ChatInterface from '../components/ChatInterface';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const [mounted, setMounted] = useState(false);
  const [user, loading] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshInterval = React.useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!mounted) return null;
  if (loading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
  if (!user) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Please sign in to continue</h1>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="w-full h-screen relative">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden flex items-center px-4 py-2 border-b border-gray-200 bg-white">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Toggle sidebar"
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
          <h1 className="ml-4 text-lg font-semibold">Chat</h1>
        </div>

        {/* Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: isSidebarOpen ? 0 : "-100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl z-50 lg:relative lg:shadow-none lg:translate-x-0"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close sidebar"
            >
              <svg 
                className="w-6 h-6 text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="w-full max-w-[1920px] mx-auto h-[calc(100vh-56px)] lg:h-screen flex">
          <ChatInterface 
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </div>
      </div>
    </Layout>
  );
}