import dbConnect from '../../utils/mongodb';
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { message, userId } = req.body;
    
    // Get AI response first
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get AI response');
    }

    // Save both messages in a single operation
    const [userMessage, aiMessage] = await Promise.all([
      Message.create({
        text: message,
        sender: 'user',
        userId: userId,
        status: 'sent',
        createdAt: new Date()
      }),
      Message.create({
        text: data.response,
        sender: 'ai',
        userId: userId,
        metadata: data.metadata || {},
        status: 'received',
        createdAt: new Date()
      })
    ]);

    res.status(200).json({
      success: true,
      messages: [userMessage, aiMessage],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ 
      error: error.message,
      status: 'error' 
    });
  }
}