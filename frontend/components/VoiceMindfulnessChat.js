import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// API base URL - adjust this based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_ENDPOINT = `${API_BASE_URL}/api/mindfulness-chat`;  // Updated to match backend route

const exercises = [
    {
        id: 'breathing',
        title: 'Breathing Techniques',
        description: '4-7-8 breathing and box breathing exercises for relaxation',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        )
    },
    {
        id: 'bodyscan',
        title: 'Body Scan Meditation',
        description: 'Progressive relaxation from head to toe',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    {
        id: 'gratitude',
        title: 'Gratitude Practice',
        description: 'Voice-guided gratitude practice for positive mindset',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        )
    },
    {
        id: 'grounding',
        title: '5-4-3-2-1 Grounding',
        description: 'Sensory awareness technique for anxiety and panic',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    }
];

const VoiceWaveform = ({ isListening }) => {
    return (
        <div className="flex items-center justify-center space-x-1 h-16">
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className={`w-1.5 rounded-full ${isListening ? 'bg-blue-500' : 'bg-gray-300'}`}
                    animate={{
                        height: isListening ? ['20%', '90%', '20%'] : '20%',
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};

const VoiceMindfulnessChat = () => {
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);
    const [error, setError] = useState(null);

    // Initialize female voice
    useEffect(() => {
        const initVoice = () => {
            const voices = synthRef.current.getVoices();
            // Try to find a female English voice
            const femaleVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female') || 
                voice.name.toLowerCase().includes('samantha') ||
                voice.name.toLowerCase().includes('microsoft zira')
            );
            if (femaleVoice) {
                utteranceRef.current = new SpeechSynthesisUtterance();
                utteranceRef.current.voice = femaleVoice;
                utteranceRef.current.rate = 0.9; // Slightly slower for better clarity
                utteranceRef.current.pitch = 1.1; // Slightly higher pitch for female voice
            }
        };

        if (synthRef.current.getVoices().length === 0) {
            synthRef.current.onvoiceschanged = initVoice;
        } else {
            initVoice();
        }

        return () => {
            stopSpeaking();
        };
    }, []);

    const resetStates = () => {
        stopSpeaking();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        setIsLoading(false);
        setTranscript('');
        setResponse(null);
        setIsSpeaking(false);
        setError(null);
    };

    const handleExerciseSelect = (exercise) => {
        console.log('Selected exercise:', exercise);
        resetStates();
        setSelectedExercise(exercise);
        // Send initial message to backend with a slight delay to ensure state is updated
        setTimeout(() => {
            if (exercise) {
                console.log('Sending initial message with exercise:', exercise.id);
                sendToBackend("start");
            }
        }, 100);
    };

    const handleCloseExercise = () => {
        resetStates();
        setSelectedExercise(null);
    };

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;  // Keep continuous to allow longer recordings
            recognition.interimResults = true;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
                setError(null);
            };

            recognition.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'aborted') {
                    // Don't show error for manual stops
                    return;
                }
                setError('Speech recognition error. Please try again.');
                setIsListening(false);
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                // Only set isListening to false if this wasn't a manual stop
                if (!isListening) {
                    return;
                }
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []); // No dependencies needed

    const toggleListening = () => {
        if (!selectedExercise) {
            return; // Simply return without showing error
        }

        if (isSpeaking) {
            stopSpeaking();
        }

        try {
            if (isListening) {
                // Stop listening and send the current transcript
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    if (transcript && transcript.trim()) {
                        sendToBackend(transcript.trim());
                    }
                }
                setIsListening(false);
            } else {
                // Start listening
                setError(null);
                setTranscript('');
                if (recognitionRef.current) {
                    recognitionRef.current.start();
                } else {
                    setError('Speech recognition is not supported in your browser.');
                }
            }
        } catch (error) {
            console.error('Error toggling recognition:', error);
            setError('Failed to toggle speech recognition. Please try again.');
            setIsListening(false);
        }
    };

    const formatResponse = (text) => {
        if (!text) return '';
        
        return text
            // Remove asterisks
            .replace(/\*/g, '')
            // Replace multiple newlines with just two
            .replace(/\n{3,}/g, '\n\n')
            // Remove any leading/trailing whitespace
            .trim();
    };

    const sendToBackend = async (text) => {
        if (!selectedExercise) {
            console.error('No exercise selected');
            return;
        }

        if (isLoading) {
            console.log('Request in progress, skipping');
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            if (isSpeaking) {
                stopSpeaking();
            }

            const requestData = {
                text: text,
                exercise_type: selectedExercise.id
            };

            console.log('Attempting to connect to:', API_ENDPOINT);
            console.log('Sending request data:', requestData);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify(requestData),
            }).catch(error => {
                console.error('Fetch error:', error);
                if (error.message.includes('Failed to fetch')) {
                    throw new Error(`Connection failed. Please ensure the server is running at ${API_BASE_URL} and check the endpoint: /api/mindfulness-chat`);
                }
                throw error;
            });

            if (!response) {
                throw new Error('No response from server');
            }

            console.log('Response received:', response.status, response.statusText);

            if (response.status === 404) {
                throw new Error(`Endpoint not found: ${API_ENDPOINT}. Please check the server configuration.`);
            }

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                    if (response.status === 0 || response.status === 404) {
                        errorMessage = `Cannot connect to server at ${API_ENDPOINT}. Please check if the server is running.`;
                    }
                }
                throw new Error(errorMessage);
            }

            let data;
            try {
                data = await response.json();
                console.log('Response data:', data);
            } catch (e) {
                console.error('Error parsing response:', e);
                throw new Error('Invalid response from server. Please check server logs.');
            }

            if (data && data.response) {
                // Format the response before setting it
                const formattedResponse = formatResponse(data.response);
                setResponse(formattedResponse);
                if (formattedResponse.length > 0) {
                    await speakResponse(formattedResponse);
                }
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error in sendToBackend:', error);
            let errorMessage;
            
            if (error.message.includes('Failed to fetch') || error.message.includes('Connection failed')) {
                errorMessage = `Server connection failed. Please check:\n1. Server is running at ${API_BASE_URL}\n2. Endpoint /api/mindfulness-chat exists\n3. Server logs for any errors`;
            } else if (error.message.includes('Endpoint not found')) {
                errorMessage = `The mindfulness chat endpoint (${API_ENDPOINT}) is not available. Please check server configuration.`;
            } else if (error.message.includes('Invalid response')) {
                errorMessage = 'Received invalid response from server. Please check server logs.';
            } else {
                errorMessage = error.message || 'An unexpected error occurred. Please try again.';
            }
            
            setError(errorMessage);
            setResponse(null);
        } finally {
            setIsLoading(false);
            setTranscript('');
        }
    };

    const stopSpeaking = () => {
        try {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
            if (utteranceRef.current) {
                utteranceRef.current.onend = null;
                utteranceRef.current.onerror = null;
            }
            setIsSpeaking(false);
        } catch (error) {
            console.error('Error stopping speech:', error);
        }
    };

    const speakResponse = async (text) => {
        if (!selectedExercise) {
            setError('Please select an exercise first');
            return;
        }

        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        try {
            if (!utteranceRef.current) {
                utteranceRef.current = new SpeechSynthesisUtterance();
            }

            // Reset any existing utterance
            utteranceRef.current.onend = null;
            utteranceRef.current.onerror = null;

            utteranceRef.current.text = text;
            utteranceRef.current.onend = () => {
                setIsSpeaking(false);
                setError(null);
                // Don't automatically add the continue message
                // Let the user decide when to continue
            };
            utteranceRef.current.onerror = (error) => {
                console.error('Speech synthesis error:', error);
                setIsSpeaking(false);
                setError('Unable to play voice response. Please try again or read the response.');
            };

            // Ensure we're not already speaking
            stopSpeaking();
            
            // Small delay before starting new speech
            setTimeout(() => {
                setIsSpeaking(true);
                synthRef.current.speak(utteranceRef.current);
            }, 100);
        } catch (error) {
            console.error('Error playing voice:', error);
            setIsSpeaking(false);
            setError('Failed to play voice response. Please try again or read the response.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-20">
            <AnimatePresence mode="wait">
                {!selectedExercise ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
                    >
                        {exercises.map((exercise) => (
                            <motion.div
                                key={exercise.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white rounded-xl p-4 sm:p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all border border-gray-100"
                                onClick={() => handleExerciseSelect(exercise)}
                            >
                                <div className="flex items-center mb-3 sm:mb-4">
                                    <div className="p-2 sm:p-3 bg-blue-100 rounded-xl mr-3 sm:mr-4">
                                        {exercise.icon}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{exercise.title}</h3>
                                </div>
                                <p className="text-sm sm:text-base text-gray-600">{exercise.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white rounded-xl shadow-xl p-4 sm:p-8 border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{selectedExercise.title}</h2>
                                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                                    {isListening ? 'Listening to your voice...' : 'Click the waves to start speaking'}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseExercise}
                                className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700 text-sm sm:text-base"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
                            {/* Voice Recording Interface */}
                            <motion.div 
                                className={`w-full max-w-md p-4 sm:p-6 rounded-2xl cursor-pointer transition-all
                                    ${isListening 
                                        ? 'bg-blue-50 shadow-lg border-2 border-blue-300' 
                                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
                                onClick={toggleListening}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading || isSpeaking}
                            >
                                <VoiceWaveform isListening={isListening} />
                                <p className="text-center mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-gray-600">
                                    {isListening 
                                        ? 'Click to stop recording and send message' 
                                        : 'Click to start speaking'}
                                </p>
                            </motion.div>

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-500"></div>
                                    <span className="text-sm sm:text-base text-gray-600">Processing your message...</span>
                                </div>
                            )}

                            {/* Transcript Display */}
                            {transcript && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-100"
                                >
                                    <div className="flex items-center mb-2 sm:mb-3">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Your Message</h3>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{transcript}</p>
                                    {isListening && (
                                        <div className="flex items-center mt-2 sm:mt-3 text-blue-600">
                                            <div className="animate-pulse mr-2">●</div>
                                            <span className="text-xs sm:text-sm">Recording in progress...</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* AI Response */}
                            {response && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 sm:p-6 shadow-md border border-blue-100"
                                >
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800">AI Response</h3>
                                        </div>
                                        <button
                                            onClick={isSpeaking ? stopSpeaking : () => speakResponse(response)}
                                            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                                                isSpeaking 
                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                            }`}
                                            disabled={isListening || isLoading}
                                        >
                                            {isSpeaking ? (
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <div className="prose prose-blue max-w-none">
                                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                                            {response}
                                        </p>
                                    </div>
                                    {isSpeaking && (
                                        <div className="flex items-center mt-2 sm:mt-3 text-blue-600">
                                            <div className="animate-pulse mr-2">●</div>
                                            <span className="text-xs sm:text-sm">Speaking...</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceMindfulnessChat; 