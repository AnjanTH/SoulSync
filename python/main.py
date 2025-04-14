import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from mindfulness_chat import chat_instance

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Use environment variable for API key
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")

def initialize_llm():
    llm = ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key,
        model_name="llama-3.3-70b-versatile"
    )
    return llm

# Initialize global variables
qa_chain = None
vector_db = None

def create_vector_db():
    loader = DirectoryLoader("./python/data", glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    vector_db = Chroma.from_documents(texts, embeddings, persist_directory='./python/chroma_db')
    vector_db.persist()
    return vector_db

def setup_qa_chain(vector_db, llm):
    retriever = vector_db.as_retriever()
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    
    prompt_template = """
You are an AI assistant. You specialize in health-related topics but can respond to any general query. Be empathetic, professional, and supportive in tone.

If the user's input is a greeting such as "hi", "hello", or "hey":
    - Greet the user warmly
    - Respond with: "Hi there! I'm here to support you. How are you feeling today?"

1. For mental health queries:
    - Respond with empathy and understanding
    - Provide coping strategies and self-help techniques
    - Encourage professional help when needed

2. For medical symptoms:
    - Ask clarifying questions about symptoms if needed
    - List possible conditions based on symptoms
    - Suggest basic home care recommendations

3. For medication queries:
    - Discuss both over-the-counter and prescription medications where appropriate
    - Provide dosage guidelines and potential side effects
    - Emphasize consulting a doctor before starting any prescription medication

4. For general questions:
    - Respond appropriately based on the context
    - If it's outside medical topics, provide a well-informed response

    Context: {context}
    Chat History: {chat_history}
    User Question: {question}
    
    Assistant Response: """
    
    PROMPT = PromptTemplate(template=prompt_template, input_variables=['context', 'chat_history', 'question'])
    
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        combine_docs_chain_kwargs={"prompt": PROMPT}
    )
    return qa_chain

# Initialize the application
def init_app():
    global qa_chain, vector_db
    
    print("Initializing Chatbot...")
    llm = initialize_llm()
    
    db_path = "./chroma_db"
    
    if not os.path.exists(db_path) or not os.listdir(db_path):
        vector_db = create_vector_db()
    else:
        embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
        vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)
    
    qa_chain = setup_qa_chain(vector_db, llm)

# Initialize the application
init_app()

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        query = data.get('message')
        
        if not query:
            return jsonify({'error': 'No message provided'}), 400
            
        response = qa_chain.invoke({"question": query})
        return jsonify({'response': response['answer']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mindfulness', methods=['POST'])
def mindfulness():
    try:
        data = request.json
        message = data.get('message')
        exercise_type = data.get('exerciseType')
        
        if not message or not exercise_type:
            return jsonify({'error': 'Message and exercise type are required'}), 400
            
        response = chat_instance.process_chat(message, exercise_type)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
