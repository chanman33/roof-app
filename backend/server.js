// my-project/backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');
const multer = require('multer');

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

// Add OpenAI initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    // Generate report using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional roofing inspector. Provide a single paragraph assessment that includes the damage type (i.e., shingle damage, structural damage, water damage), severity, and recommended action. Keep your response concise and focused on the most important findings."
        },
        {
          role: "user",
          content: `Based on these observations, provide a brief professional assessment:
            ${userObservation}
            
            Additional findings:
            - Hail damage is ${hailDamageLikely ? 'likely' : 'unlikely'} present
            - There is a ${probability * 100}% probability of hail damage`
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });

    const reportText = completion.choices[0].message.content;

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          hail_damage_likely: hailDamageLikely,
          probability: probability,
          report_text: reportText,
          user_observation: userObservation,
          image_url: imageUrl
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