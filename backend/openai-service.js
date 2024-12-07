const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateReport(userObservation, aiVisionAnalysis = null, visualizations = null, locationInfo = null) {
  let aiContext = `Based on these observations, provide a brief professional assessment:
    ${userObservation}`;

  if (aiVisionAnalysis) {
    aiContext += `\n\nInitial Image Analysis:\n${aiVisionAnalysis}`;
    
    if (visualizations?.length > 0) {
      aiContext += `\n\nDetailed Damage Analysis has been captured and analyzed.`;
    }
  }

  if (locationInfo) {
    aiContext += `\n\nLocation Details:
    - City: ${locationInfo.city}
    - Region: ${locationInfo.state}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional roofing inspector with expertise in regional building codes and weather patterns. 
        Provide a detailed assessment that includes:
        1. Short and brief location-specific context and typical weather challenges
        2. Summarize the ${userObservation} if available
        3. Analysis of user observations and AI vision findings with a confidence score based on the ${aiVisionAnalysis} and ${visualizations} if available
        4. Identified damage types (e.g., shingle damage, structural issues, water damage)
        5. Severity assessment (Low/Medium/High)
        6. Specific recommendations based on local conditions
        
        Format your response as two, well-structured paragraphs that flows naturally. Include the ${aiContext} in your response.`
      },
      {
        role: "user",
        content: aiContext
      }
    ],
    max_tokens: 750,
    temperature: 0.5
  });

  return completion.choices[0].message.content;
}

module.exports = { generateReport };