const axios = require('axios');

async function analyzeDamage(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Sending request to Roboflow...');
    
    const response = await axios({
      method: "POST",
      url: "https://detect.roboflow.com/damage-assesment/2",
      params: {
        api_key: process.env.ROBOFLOW_API_KEY
      },
      data: base64Image,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    console.log('Raw Roboflow Response:', JSON.stringify(response.data, null, 2));
    
    // Process the predictions
    const predictions = response.data.predictions || [];
    console.log('Processed Predictions:', JSON.stringify(predictions, null, 2));
    
    const damages = predictions.map(pred => ({
      type: pred.class,
      confidence: pred.confidence,
      location: {
        x: pred.x,
        y: pred.y,
        width: pred.width,
        height: pred.height
      }
    }));

    console.log('Final Damages Output:', JSON.stringify(damages, null, 2));
    
    return damages;
  } catch (error) {
    console.error('Vision Analysis Error:', error.response?.data || error.message);
    throw new Error('Failed to analyze image');
  }
}

module.exports = { analyzeDamage };
