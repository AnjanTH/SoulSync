import Layout from '../components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-5xl font-bold mb-8 text-gray-800">
          Welcome to AuraMind AI
        </h1>
        <p className="text-xl mb-12 text-gray-600 max-w-2xl">
          Your personal mental health companion. Talk to our AI about your feelings,
          get support, and learn coping strategies.
        </p>
        <div className="flex gap-4">
          <Link href="/signup"
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Get Started
          </Link>
          <Link href="/login"
            className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
            Login
          </Link>
        </div>
      </div>
    </Layout>
  );
}
