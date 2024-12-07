// my-project/backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { generateReport } = require('./openai-service');
const { analyzeDamage } = require('./openai-vision');
const { scoreDamage } = require('./roboflow-vision');
const { getLocationInfo } = require('./location-service');

const app = express();
const PORT = process.env.PORT || 5050;

// Add CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Add Supabase initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Add multer for handling file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Updated endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    const imageFile = req.file;
    const userObservation = req.body.userObservation;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;

    // Check if we have at least one input
    if (!imageFile && !userObservation) {
      return res.status(400).json({
        error: 'Missing input',
        details: 'Please provide either an image or a user observation'
      });
    }

    let aiVisionAnalysis = null;
    let visualizations = null;
    let roboflowError = null;
    
    // Only process image if it exists
    if (imageFile) {
      const damageAnalysis = await analyzeDamage(imageFile.buffer);
      
      if (damageAnalysis?.[0]?.open_ai?.output) {
        aiVisionAnalysis = damageAnalysis[0].open_ai.output;
      } else {
        console.warn('Image analysis produced no results');
      }

      try {
        const damageResults = await scoreDamage(imageFile.buffer);
        aiVisionAnalysis = damageResults.analysis.map(damage => 
          `- ${damage.type} damage detected:\n` +
          `  Location: ${damage.location}\n` +
          `  Dimensions: ${damage.dimensions}\n` +
          `  Confidence: ${damage.confidence}%`
        ).join('\n\n');
        
        visualizations = damageResults.visualizations;
      } catch (roboflowErr) {
        console.warn('Roboflow analysis failed:', roboflowErr);
        roboflowError = roboflowErr.message;
      }
    }

    let locationInfo = null;
    try {
      locationInfo = await getLocationInfo();
    } catch (error) {
      console.warn('Failed to fetch location info:', error);
    }

    // Generate report with all available information
    const report = await generateReport(
      userObservation || '',
      aiVisionAnalysis,
      visualizations,
      locationInfo
    );

    // Update Supabase storage to include location
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          report_text: report,
          user_observation: userObservation || null,
          ai_vision_analysis: aiVisionAnalysis || null,
          location: locationInfo
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      report: data.report_text,
      metadata: {
        inspectionDate: data.created_at,
        reportId: data.id,
        userObservation: data.user_observation,
        hasImageAnalysis: !!aiVisionAnalysis,
        visualizations: visualizations,
        roboflowError: roboflowError
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});