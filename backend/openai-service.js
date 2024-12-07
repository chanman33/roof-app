const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateReport(userObservation, aiVisionAnalysis = null, locationInfo = null) {
  let aiContext = `Based on these observations, provide a brief professional assessment:
    ${userObservation}`;

  if (aiVisionAnalysis) {
    aiContext += `\n\nComputer vision analysis:\n${aiVisionAnalysis}`;
  }

  if (locationInfo) {
    aiContext += `\n\nLocation Details:
    - City: ${locationInfo.city}
    - Region: ${locationInfo.state}
    - Country: ${locationInfo.country}
    - Latitude: ${locationInfo.latitude}
    - Longitude: ${locationInfo.longitude}
    - Climate Zone: ${locationInfo.timezone}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are a professional roofing inspector with expertise in regional building codes and weather patterns. 
        Provide a detailed assessment that includes:
        1. Location-specific context and typical weather challenges
        2. Analysis of user observations and AI vision findings
        3. Identified damage types (e.g., shingle damage, structural issues, water damage)
        4. Severity assessment (Low/Medium/High)
        5. Specific recommendations based on local conditions
        
        Format your response as a single, well-structured paragraph that flows naturally. Include the location details in your response.`
      },
      {
        role: "user",
        content: aiContext
      }
    ],
    max_tokens: 250,
    temperature: 0.7
  });

  return completion.choices[0].message.content;
}

module.exports = { generateReport };