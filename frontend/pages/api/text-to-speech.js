import { ElevenLabsClient } from "elevenlabs";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!process.env.ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY is not configured');
    }

    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVEN_LABS_API_KEY,
    });

    const audio = await client.generate({
      voice: "Josh",
      text: text,
      model_id: "eleven_multilingual_v2",
    });

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audio));
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ error: 'Failed to convert text to speech: ' + error.message });
  }
} 