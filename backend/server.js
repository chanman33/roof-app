// my-project/backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { generateReport } = require('./openai-service');
const { analyzeDamage } = require('./roboflow-vision');

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
app.post('/api/generate-report', upload.single('image'), async (req, res) => {
  try {
    const hailDamageLikely = JSON.parse(req.body.hailDamageLikely);
    const probability = JSON.parse(req.body.probability);
    const { userObservation } = req.body;
    const imageBuffer = req.file?.buffer;

    // Upload image to Supabase Storage if present
    let imageUrl = null;
    if (imageBuffer) {
      try {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `public/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('inspection-images')
          .upload(filePath, imageBuffer, {
            contentType: 'image/jpeg',
          });

        if (uploadError) {
          console.error('Supabase Storage Error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase
          .storage
          .from('inspection-images')
          .getPublicUrl(`public/${fileName}`);
        
        imageUrl = publicUrl;
      } catch (uploadError) {
        console.error('Image Upload Error:', uploadError);
        // Continue without image if upload fails
        imageUrl = null;
      }
    }

    // Analyze image if present
    let damageAnalysis = null;
    if (imageBuffer) {
      try {
        damageAnalysis = await analyzeDamage(imageBuffer);
      } catch (analysisError) {
        console.error('Vision Analysis Error:', analysisError);
        // Continue without analysis if it fails
      }
    }

    // Generate report using the new service with vision analysis
    const reportText = await generateReport(
      userObservation, 
      hailDamageLikely, 
      probability,
      damageAnalysis
    );

    // Update Supabase insert to include damage analysis
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          hail_damage_likely: hailDamageLikely,
          probability: probability,
          report_text: reportText,
          user_observation: userObservation,
          image_url: imageUrl,
          damage_analysis: damageAnalysis
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Return the stored report
    res.json({
      report: data.report_text,
      metadata: {
        inspectionDate: data.created_at,
        reportId: data.id,
        userObservation: data.user_observation
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate or store report' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});