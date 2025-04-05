import speech_recognition as sr
from transformers import pipeline
import cv2
import numpy as np
from typing import Dict, Union, List
import logging
import os
from datetime import datetime
   

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmotionDetector:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        # Initialize sentiment and emotion analysis models
        self.sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="finiteautomata/bertweet-base-sentiment-analysis"
        )
        self.emotion_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            return_all_scores=True
        )
        self.emotions_weights = {
            'text': 0.4,
            'voice': 0.3,
            'facial': 0.3
        }

    def analyze_text_emotion(self, text: str) -> Dict[str, Union[str, float]]:
        """Analyze emotion from text using transformer models"""
        try:
            # Get sentiment analysis
            sentiment_result = self.sentiment_analyzer(text)[0]
            
            # Get detailed emotion analysis
            emotion_result = self.emotion_classifier(text)[0]
            
            # Sort emotions by score
            sorted_emotions = sorted(emotion_result, key=lambda x: x['score'], reverse=True)
            dominant_emotion = sorted_emotions[0]

            # Map sentiment to basic emotions
            sentiment_mapping = {
                'POS': 'positive',
                'NEU': 'neutral',
                'NEG': 'negative'
            }

            return {
                'emotion': dominant_emotion['label'],
                'confidence': dominant_emotion['score'],
                'sentiment': sentiment_mapping.get(sentiment_result['label'], 'neutral'),
                'sentiment_score': sentiment_result['score'],
                'all_emotions': sorted_emotions
            }
        except Exception as e:
            logger.error(f"Error in text emotion analysis: {str(e)}")
            return {
                'emotion': 'neutral',
                'confidence': 0.0,
                'sentiment': 'neutral',
                'sentiment_score': 0.0,
                'all_emotions': []
            }

    def get_emotion_response(self, emotion_data: Dict) -> str:
        """Generate appropriate response based on emotional state"""
        emotion = emotion_data['emotion']
        sentiment = emotion_data['sentiment']
        confidence = emotion_data['confidence']

        responses = {
            'joy': [
                "I'm glad you're feeling positive!",
                "It's wonderful to hear that joy in your voice.",
                "Your happiness is contagious!"
            ],
            'sadness': [
                "I hear the sadness in your words. Would you like to talk about it?",
                "It's okay to feel sad. I'm here to listen.",
                "Remember that difficult times are temporary. Have you considered talking to someone about these feelings?"
            ],
            'anger': [
                "I can sense that you're frustrated. Let's take a moment to breathe.",
                "Your anger is valid. Would you like to discuss what's bothering you?",
                "Sometimes anger can be overwhelming. Would you like to explore some coping strategies?"
            ],
            'fear': [
                "It's brave of you to share your fears.",
                "We can work through this together. What specifically concerns you?",
                "Fear is a natural response. Would you like to discuss some anxiety management techniques?"
            ],
            'neutral': [
                "I'm here to listen and support you.",
                "How can I help you today?",
                "Would you like to explore those feelings further?"
            ]
        }

        # Get appropriate responses for the emotion
        emotion_responses = responses.get(emotion, responses['neutral'])
        
        # Select response based on confidence
        response_idx = int(min(confidence * len(emotion_responses), len(emotion_responses) - 1))
        return emotion_responses[response_idx]

    def speech_to_text(self) -> str:
        """Convert speech to text"""
        try:
            with sr.Microphone() as source:
                logger.info("Listening...")
                self.recognizer.adjust_for_ambient_noise(source)
                audio = self.recognizer.listen(source, timeout=5)
                text = self.recognizer.recognize_google(audio)
                return text
        except Exception as e:
            logger.error(f"Error in speech recognition: {str(e)}")
            return ""

    def analyze_facial_emotion(self) -> Dict[str, Union[str, float]]:
        """Analyze emotion from facial expression using webcam"""
        try:
            # Initialize webcam
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                raise Exception("Could not access webcam")

            # Capture single frame
            ret, frame = cap.read()
            if not ret:
                raise Exception("Could not capture frame")

            # Save temporary image
            temp_img_path = "temp_facial.jpg"
            cv2.imwrite(temp_img_path, frame)

            # Analyze facial emotion
            result = DeepFace.analyze(temp_img_path, actions=['emotion'])
            
            # Clean up
            cap.release()
            if os.path.exists(temp_img_path):
                os.remove(temp_img_path)

            # Get dominant emotion
            emotions = result[0]['emotion']
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])
            
            return {
                'emotion': dominant_emotion[0],
                'confidence': dominant_emotion[1] / 100
            }
        except Exception as e:
            logger.error(f"Error in facial emotion analysis: {str(e)}")
            return {'emotion': 'neutral', 'confidence': 0.0}

    def get_combined_emotion(self, text: str, use_voice: bool = False, use_facial: bool = False) -> Dict:
        """Get combined emotion analysis from multiple sources"""
        results = {
            'text': self.analyze_text_emotion(text),
            'voice': {'emotion': 'neutral', 'confidence': 0.0, 'sentiment': 'neutral'},
            'facial': {'emotion': 'neutral', 'confidence': 0.0}
        }

        if use_voice:
            voice_text = self.speech_to_text()
            if voice_text:
                results['voice'] = self.analyze_text_emotion(voice_text)

        if use_facial:
            results['facial'] = self.analyze_facial_emotion()

        # Calculate weighted emotion scores
        emotions_score = {}
        sentiment_score = 0.0
        
        for source, result in results.items():
            emotion = result['emotion']
            confidence = result['confidence']
            weight = self.emotions_weights[source]
            
            if emotion not in emotions_score:
                emotions_score[emotion] = 0
            emotions_score[emotion] += confidence * weight
            
            # Add sentiment score if available
            if 'sentiment_score' in result:
                sentiment_score += result['sentiment_score'] * weight

        # Get dominant emotion
        dominant_emotion = max(emotions_score.items(), key=lambda x: x[1])
        
        analysis_result = {
            'dominant_emotion': dominant_emotion[0],
            'confidence': dominant_emotion[1],
            'sentiment_score': sentiment_score,
            'detailed_analysis': results
        }

        # Add appropriate response
        analysis_result['suggested_response'] = self.get_emotion_response(analysis_result)
        
        return analysis_result

    def log_emotion(self, user_id: str, emotion_data: Dict):
        """Log emotion analysis results"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            **emotion_data
        }
        logger.info(f"Emotion Analysis: {log_entry}")
        return log_entry