// my-project/backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { OpenAI } = require('openai');

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

// Updated endpoint
app.post('/api/generate-report', async (req, res) => {
  const { hailDamageLikely, probability } = req.body;

  try {
    // Generate report using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional roofing inspector. Please provide a detailed damage assessment report based on the following categories if applicable:

1. Shingle Damage Assessment:
   - Identify type of damage (e.g., cracked, missing, curling, blistering, granule loss)
   - Severity level (Minor, Moderate, Severe)
   - Location on roof
   - Approximate area affected
   - Recommendations for repair

2. Structural Damage Assessment:
   - Identify type of damage (e.g., sagging, rotting, warping, broken supports)
   - Location of structural issues
   - Potential causes
   - Safety concerns
   - Recommendations for repair

3. Water Damage Assessment:
   - Type of water damage (e.g., water stains, mold growth, decay)
   - Location of water intrusion
   - Extent of water damage
   - Potential sources of leaks
   - Associated risks
   - Recommendations for repair

Please provide specific details for each category found in the inspection. If any category shows no signs of damage, please indicate "No damage observed" for that section.

Additional Notes:
- Include urgency level for repairs (Immediate, Soon, Monitor)
- Estimate remaining life of affected components
- Note any warranty considerations
- Document any code violations

Please provide your assessment in a clear, professional format.`
        },
        {
          role: "user",
          content: `Write a professional damage assessment report based on severe dents and pockmarks on the shingle surface. Also consider findings:
            - Hail damage is ${hailDamageLikely ? 'likely' : 'unlikely'} present
            - There is a ${probability * 100}% probability of hail damage
            Include a brief assessment and recommendation.`
        }
      ]
    });

    const reportText = completion.choices[0].message.content;

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          hail_damage_likely: hailDamageLikely,
          probability: probability,
          report_text: reportText
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
        reportId: data.id
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