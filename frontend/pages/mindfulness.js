import React from 'react';
import dynamic from 'next/dynamic';

// Import VoiceMindfulnessChat with no SSR since it uses browser APIs
const VoiceMindfulnessChat = dynamic(
    () => import('../components/VoiceMindfulnessChat'),
    { ssr: false }
);

const MindfulnessPage = () => {
    return (
        <div className="min-h-screen bg-white py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
                    Mindfulness Assistant
                </h1>
                <VoiceMindfulnessChat />
            </div>
        </div>
    );
};

export default MindfulnessPage; 