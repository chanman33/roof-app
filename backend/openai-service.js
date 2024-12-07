const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateReport(userObservation, hailDamageLikely, probability, damageAnalysis = null) {
  let aiContext = `Based on these observations, provide a brief professional assessment:
    ${userObservation}
    
    Additional findings:
    - Hail damage is ${hailDamageLikely ? 'likely' : 'unlikely'} present
    - There is a ${probability * 100}% probability of hail damage`;

  // Add computer vision findings if available
  if (damageAnalysis && damageAnalysis.length > 0) {
    const visionFindings = damageAnalysis
      .map(damage => `- Detected ${damage.type} with ${(damage.confidence * 100).toFixed(1)}% confidence`)
      .join('\n');
    
    aiContext += `\n\nComputer Vision Analysis:\n${visionFindings}`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a professional roofing inspector. Provide a single paragraph assessment that includes the damage type (i.e., shingle damage, structural damage, water damage), severity, and recommended action. Keep your response concise and focused on the most important findings."
      },
      {
        role: "user",
        content: aiContext
      }
    ],
    max_tokens: 150,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}

module.exports = { generateReport };