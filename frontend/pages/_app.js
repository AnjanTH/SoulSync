import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ErrorMessage from '../components/ErrorMessage';
import Layout from '../components/Layout';
import "@/styles/globals.css";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';
import { useRouter } from 'next/router';
import { setupAuthPersistence, initializeAuthListener, checkAuthAndRedirect } from '../utils/auth';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [globalError, setGlobalError] = React.useState(null);

  // Global error handler
  React.useEffect(() => {
    const handleError = (error) => {
      console.error('Global error:', error);
      setGlobalError(error.message || 'An unexpected error occurred');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason));

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  useEffect(() => {
    // Setup auth persistence
    setupAuthPersistence();

    // Initialize auth listener
    const unsubscribe = initializeAuthListener(() => {
      // Check auth state and redirect if needed
      checkAuthAndRedirect(router);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <ErrorMessage 
          message={globalError} 
          onClose={() => setGlobalError(null)} 
        />
        
        <Layout>
          <AnimatePresence mode="wait">
            <Component {...pageProps} key={router.route} />
          </AnimatePresence>
        </Layout>
      </div>
    </AuthProvider>
  );
}

export default MyApp;
