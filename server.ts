import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());
const PORT = 3000;

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// In-memory "cloud database"
let diagnoses: Array<{
  id: string;
  lat: number;
  lng: number;
  type: string;
  disease: string;
  severity: string;
  recommendation: string;
  imageUrl?: string;
  timestamp: string;
}> = [
  // Seed with a few points
  {
    id: 'seed-1',
    lat: 34.0522,
    lng: -118.2437,
    type: 'crop',
    disease: 'Powdery Mildew',
    severity: 'High',
    recommendation: 'Apply fungicide immediately.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'seed-2',
    lat: 36.1627,
    lng: -86.7816,
    type: 'poultry',
    disease: 'Avian Influenza Suspicion',
    severity: 'Critical',
    recommendation: 'Quarantine affected flock and notify authorities.',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all diagnoses
app.get('/api/diagnoses', (req, res) => {
  res.json(diagnoses);
});

// Upload and analyze
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { lat, lng, type } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API Key is missing. Configure it in settings.' });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = "You are an expert agricultural and veterinary pathologist. Analyze this image of a " + (type || "crop or poultry") + ". Identify any visible disease, its severity, and provide a short recommendation. Return ONLY valid JSON with no markdown formatting in this exact format: {\"disease\": \"Name of Disease or Healthy\", \"severity\": \"Low|Medium|High|Critical|None\", \"recommendation\": \"Brief recommendation\"}";

    // Use gemini-2.5-flash as the "state-of-the-art Python AI model" equivalent
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            prompt,
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: req.file.buffer.toString('base64')
                }
            }
        ]
    });
    
    let resultText = response.text || "{}";
    // Strip markdown formatting if the model still includes it
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    const analysis = JSON.parse(resultText);

    const newDiagnosis = {
      id: Date.now().toString(),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      type: type || 'unknown',
      disease: analysis.disease || 'Unknown',
      severity: analysis.severity || 'Unknown',
      recommendation: analysis.recommendation || 'No recommendation available',
      timestamp: new Date().toISOString()
    };

    diagnoses.push(newDiagnosis);

    res.json(newDiagnosis);
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze image', details: error.message });
  }
});

// Clear diagnoses (for demo reset)
app.post('/api/diagnoses/clear', (req, res) => {
    diagnoses = [];
    res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
