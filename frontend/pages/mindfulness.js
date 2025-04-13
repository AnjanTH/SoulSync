import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

// Import VoiceMindfulnessChat with no SSR since it uses browser APIs
const VoiceMindfulnessChat = dynamic(
    () => import('../components/VoiceMindfulnessChat'),
    { ssr: false }
);

const MindfulnessPage = () => {
    return (
        <Layout>
            <div className="min-h-screen bg-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
                        Mindfulness Assistant
                    </h1>
                    <VoiceMindfulnessChat />
                </div>
            </div>
        </Layout>
    );
};

export default MindfulnessPage; 