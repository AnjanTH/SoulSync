import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../utils/firebase';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const features = [
    {
      title: 'AI Chat',
      description: 'Have meaningful conversations with our AI companion',
      href: '/chat',
      icon: '💬'
    },
    {
      title: 'Mindfulness',
      description: 'Practice mindfulness exercises and meditation',
      href: '/mindfulness',
      icon: '🧘'
    },
    {
      title: 'Profile',
      description: 'View and manage your profile settings',
      href: '/profile',
      icon: '👤'
    }
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Welcome, {user.displayName || 'Friend'}! 👋
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            What would you like to explore today?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Link href={feature.href} className="block h-full">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <p className="text-sm sm:text-base text-gray-600">
            Need help? Check out our{' '}
            <Link 
              href="/help" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              help center
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 