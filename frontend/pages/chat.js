import React from 'react';
import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';

export default function Chat() {
  const [mounted, setMounted] = useState(false);
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (loading) return (
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
  );
  if (!user) return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Please sign in to continue</h1>
    </div>
  );

  return (
    <div className="w-full h-screen relative">
      <div className="w-full max-w-[1920px] mx-auto h-[calc(100vh-56px)] lg:h-screen flex">
        <ChatInterface />
      </div>
    </div>
  );
}