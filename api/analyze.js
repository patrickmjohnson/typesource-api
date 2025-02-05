import { OpenAI } from 'openai';
import cors from 'cors';

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST'],
  credentials: true
});

export default async function handler(req, res) {
  // Handle CORS
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fontFamily } = req.body;
    if (!fontFamily) {
      return res.status(400).json({ error: 'Font family is required' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Get font information
    const infoResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `Provide information about the font "${fontFamily}" as a JSON object with:
                 foundry, sourceUrl, platform, classification, designer, releaseDate, license.
                 Return only valid JSON.`
      }],
      temperature: 0.3,
      max_tokens: 500
    });

    const fontInfo = JSON.parse(infoResponse.choices[0].message.content);

    res.status(200).json(fontInfo);

  } catch (error) {
    console.error('Analysis failed:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
