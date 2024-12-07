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
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional roofing inspector with expertise in regional building codes and weather patterns. 
        Provide your assessment using EXACTLY the following format with new line breaks:

        📍 LOCATION CONTEXT:
        %location%

        👁️ OBSERVATION SUMMARY:
        %observation%
        ${aiVisionAnalysis ? `\n\nInitial Image Analysis:\n${aiVisionAnalysis}` : ''}

        🔍 TECHNICAL ANALYSIS:
        • Vision Analysis: %analysis%
        • Damage Types: %damages%
        • Severity: %severity%

        ⚡ RECOMMENDATIONS:
        %recommendations%

        Replace the %placeholder% texts with your analysis while maintaining the exact formatting and emojis.`
      },
      {
        role: "user",
        content: aiContext
      }
    ],
    max_tokens: 750,
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}

module.exports = { generateReport };