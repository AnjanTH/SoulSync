import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const exercises = [
  {
    id: 'breathing',
    title: 'Breathing Techniques',
    description: '4-7-8 breathing and box breathing exercises for relaxation',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    steps: [
      "Find a comfortable position and let's begin our breathing exercise.",
      "We'll start with the 4-7-8 breathing technique.",
      "Inhale quietly through your nose for 4 seconds...",
      "Hold your breath for 7 seconds...",
      "Exhale completely through your mouth for 8 seconds...",
      "Let's repeat this cycle 4 times together."
    ]
  },
  {
    id: 'bodyscan',
    title: 'Body Scan Meditation',
    description: 'Progressive relaxation from head to toe',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    steps: [
      "Find a comfortable position, either sitting or lying down.",
      "Close your eyes and take a few deep breaths.",
      "Begin by bringing attention to your feet and toes...",
      "Notice any sensations, tension, or relaxation...",
      "Slowly move your awareness up through your ankles...",
      "Continue up through your legs, torso, arms, and head...",
      "Take time to notice and release any tension you find."
    ]
  },
  {
    id: 'gratitude',
    title: 'Gratitude Journaling',
    description: 'Voice-guided gratitude practice for positive mindset',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    steps: [
      "Welcome to your gratitude practice.",
      "Take a moment to reflect on your day.",
      "Can you name three things you're grateful for today?",
      "They can be as simple as a warm cup of coffee or as profound as a meaningful relationship.",
      "For each one, take a moment to really feel the gratitude in your body.",
      "I'll listen and acknowledge each thing you're grateful for."
    ]
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Sensory awareness technique for anxiety and panic',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    steps: [
      "Let's ground ourselves in the present moment.",
      "First, name 5 things you can see around you...",
      "Now, identify 4 things you can touch or feel...",
      "Listen for 3 different sounds in your environment...",
      "Notice 2 things you can smell...",
      "Finally, focus on 1 thing you can taste.",
      "How do you feel now? More present and grounded?"
    ]
  }
];

export default function MindfulnessVoice() {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const mediaRecorderRef = useRef(null);
  const [responses, setResponses] = useState([]);

  const startExercise = (exercise) => {
    setSelectedExercise(exercise);
    setCurrentStep(0);
    setResponses([]);
    handleAIResponse(exercise.steps[0]);
  };

  const nextStep = () => {
    if (selectedExercise && currentStep < selectedExercise.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      handleAIResponse(selectedExercise.steps[currentStep + 1]);
    }
  };

  const handleAIResponse = async (text) => {
    try {
      setIsPlaying(true);
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          resolve();
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          resolve();
        };

        audio.oncanplaythrough = () => {
          audio.play().catch((error) => {
            console.error('Audio play error:', error);
            URL.revokeObjectURL(audioUrl);
            setIsPlaying(false);
            resolve();
          });
        };
      });
    } catch (error) {
      console.error('Error playing AI response:', error);
      setIsPlaying(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Handle the recorded audio data
          console.log('Recording completed');
          nextStep();
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Mindfulness Voice Assistant
      </h1>

      <AnimatePresence mode="wait">
        {!selectedExercise ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startExercise(exercise)}
                className="bg-white p-6 rounded-xl shadow-lg cursor-pointer border border-gray-100 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    {exercise.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {exercise.title}
                    </h3>
                    <p className="text-sm text-gray-600">{exercise.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedExercise.title}
              </h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <div className="text-center max-w-md">
                <p className="text-gray-600 mb-4">
                  {selectedExercise.steps[currentStep]}
                </p>
                <p className="text-sm text-gray-500">
                  Step {currentStep + 1} of {selectedExercise.steps.length}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleRecording}
                disabled={isPlaying}
                className={`p-6 rounded-full ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white shadow-lg transition-colors disabled:opacity-50`}
              >
                {isRecording ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </motion.button>

              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </motion.div>
              )}

              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((currentStep + 1) / selectedExercise.steps.length) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 