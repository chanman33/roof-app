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

    if (!imageFile && !userObservation) {
      return res.status(400).json({
        error: 'Missing input',
        details: 'Please provide either an image or a user observation'
      });
    }

    let openAiVisionResults = null;
    let roboflowResults = null;
    let visualizations = null;
    let roboflowError = null;
    
    if (imageFile) {
      // Get OpenAI Vision Analysis
      try {
        const openAiAnalysis = await analyzeDamage(imageFile.buffer);
        if (openAiAnalysis?.[0]?.open_ai?.output) {
          openAiVisionResults = openAiAnalysis[0].open_ai.output;
        }
      } catch (openAiErr) {
        console.warn('OpenAI Vision analysis failed:', openAiErr);
      }

      // Get Roboflow Analysis
      try {
        const damageResults = await scoreDamage(imageFile.buffer);
        roboflowResults = damageResults.analysis.map(damage => 
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

    // Combine both AI analyses for the report
    const combinedAiAnalysis = [
      openAiVisionResults && 'OpenAI Analysis:\n' + openAiVisionResults,
      roboflowResults && 'Roboflow Analysis:\n' + roboflowResults
    ].filter(Boolean).join('\n\n');

    // Generate report with all available information
    const report = await generateReport(
      userObservation || '',
      combinedAiAnalysis,
      visualizations,
      locationInfo
    );

    // Store in Supabase with separate analysis results
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          report_text: report,
          user_observation: userObservation || null,
          openai_vision_analysis: openAiVisionResults,
          roboflow_analysis: roboflowResults,
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
        hasOpenAiAnalysis: !!openAiVisionResults,
        hasRoboflowAnalysis: !!roboflowResults,
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