import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { auth } from '../utils/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage({ type: '', text: '' });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Check your inbox.'
      });
      setEmail('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.code === 'auth/user-not-found'
          ? 'No account found with this email'
          : error.message
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
   
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
              <p className="text-gray-500">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-200"
                  required
                  placeholder="Enter your email"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSending}
                whileHover={{ scale: isSending ? 1 : 1.01 }}
                whileTap={{ scale: isSending ? 1 : 0.99 }}
                className={`w-full bg-gradient-to-r ${
                  isSending 
                    ? 'from-blue-400 to-purple-400 cursor-not-allowed' 
                    : 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white py-3 rounded-lg font-medium shadow-lg transition-all duration-200`}
              >
                {isSending ? 'Sending...' : 'Send Reset Link'}
              </motion.button>
            </form>

            <div className="text-center">
              <Link href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    
  );
}