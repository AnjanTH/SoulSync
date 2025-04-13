from flask import Flask, request, jsonify
from flask_cors import CORS
from main import initialize_llm, setup_qa_chain, create_vector_db
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os
import logging
from datetime import datetime
from mindfulness_chat import chat_instance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS for all routes
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],  # Add your frontend URL
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"]
    }
})

# Initialize the chatbot components
logger.info("Initializing Chatbot...")

try:
    llm = initialize_llm()
    db_path = "./chroma_db"

    if not os.path.exists(db_path):
        vector_db = create_vector_db()
    else:
        embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
        vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)

    qa_chain = setup_qa_chain(vector_db, llm)
    logger.info("Chatbot initialized successfully!")
except Exception as e:
    logger.error(f"Error initializing chatbot: {str(e)}")
    raise

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        logger.info(f"Received chat request: {request.json}")
        
        if not request.is_json:
            logger.error("Request is not JSON")
            return jsonify({
                'error': 'Content-Type must be application/json',
                'status': 'error'
            }), 400

        data = request.json
        query = data.get('message')
        
        if not query:
            logger.error("No message provided in request")
            return jsonify({
                'error': 'No message provided in request body',
                'status': 'error'
            }), 400
        
        logger.info(f"Processing query: {query}")
        
        # Get response from the chatbot
        response = qa_chain.run(query)
        
        # Format response for frontend
        formatted_response = {
            'response': response,
            'status': 'success',
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'query_processed': query,
                'response_type': 'text'
            }
        }
        print(formatted_response)
        logger.info("Generated response successfully")
        return jsonify(formatted_response)

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'status': 'error',
            'details': 'An unexpected error occurred while processing your request',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/mindfulness-chat', methods=['POST', 'OPTIONS'])
def mindfulness_chat():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        return response

    try:
        # Log the incoming request
        logger.info("Received mindfulness chat request")
        
        data = request.get_json()
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text')
        exercise_type = data.get('exercise_type')

        logger.info(f"Processing mindfulness request - Exercise: {exercise_type}, Text: {text}")

        if not exercise_type:
            logger.error("No exercise type provided")
            return jsonify({'error': 'Exercise type is required'}), 400

        # Get response from chat instance using the correct method name
        ai_response = chat_instance.process_chat(text, exercise_type)
        
        if not ai_response:
            logger.error("No response generated from chat instance")
            return jsonify({'error': 'Failed to generate response'}), 500

        logger.info(f"Generated AI response: {ai_response}")

        return jsonify({
            'response': ai_response,
            'exercise_type': exercise_type,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Error in mindfulness chat endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    try:
        user_id = request.args.get('userId')
        after = request.args.get('after')
        
        if not user_id:
            return jsonify({"error": "userId is required"}), 400
            
        # For now, return empty messages array since we're not storing messages
        return jsonify({
            "messages": [],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in get_messages: {str(e)}", exc_info=True)
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Available endpoints:")
    
    app.run(debug=True, host='0.0.0.0', port=5000)