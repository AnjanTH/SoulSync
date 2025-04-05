from flask import Flask, request, jsonify
from flask_cors import CORS
from main import initialize_llm, setup_qa_chain, create_vector_db
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

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

# Add health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Chatbot is running'
    })

if __name__ == '__main__':
    
    app.run(debug=True, host='0.0.0.0', port=5000)