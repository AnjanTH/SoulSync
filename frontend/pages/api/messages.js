import dbConnect from '../../utils/mongodb';
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { userId, after } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const query = { userId };
    if (after) {
      query.createdAt = { $gt: new Date(after) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Convert MongoDB dates to ISO strings
    const formattedMessages = messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
      _id: msg._id.toString()
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message });
  }
}