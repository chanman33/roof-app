const axios = require('axios');

async function analyzeDamage(imageData) {
    try {
        const base64Image = imageData.toString('base64');
        
        const response = await axios({
            method: "POST",
            url: 'https://detect.roboflow.com/infer/workflows/default-svmpm/roof-vision-3',
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                api_key: process.env.ROBOFLOW_API_KEY,
                inputs: {
                    image: {
                        type: "base64",
                        value: base64Image
                    }
                }
            }
        });

        if (response.status !== 200) {
            throw new Error(`Vision Analysis Error: ${JSON.stringify(response.data)}`);
        }
        
        return response.data.outputs;
    } catch (error) {
        console.error('Roboflow API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error || error.message);
    }
}

module.exports = { analyzeDamage };
