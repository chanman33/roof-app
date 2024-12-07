const axios = require('axios');

async function scoreDamage(imageData) {
    try {
        const base64Image = imageData.toString('base64');
        
        const response = await axios({
            method: "POST",
            url: 'https://detect.roboflow.com/infer/workflows/default-svmpm/roof-vision-2',
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
        
        // console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (!response.data?.outputs || !Array.isArray(response.data.outputs)) {
            throw new Error('Invalid Roboflow API response format');
        }

        const outputs = response.data.outputs[0];
        
        if (!outputs) {
            throw new Error('No prediction outputs found');
        }

        const predictions = outputs.model_predictions.predictions;
        const circleVisualization = outputs.circle_visualization.value;
        const dynamicCrops = outputs.dynamic_crop.map(crop => crop.value);

        // Format the analysis in a way that's useful for the report
        const analysis = predictions.map(pred => ({
            location: `x: ${pred.x}, y: ${pred.y}`,
            dimensions: `${pred.width}x${pred.height} pixels`,
            confidence: `${(pred.confidence * 100).toFixed(1)}%`,
            type: pred.class
        }));

        return {
            analysis,
            visualizations: {
                annotatedImage: circleVisualization,
                croppedImages: dynamicCrops
            }
        };
    } catch (error) {
        console.error('Detailed Roboflow error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        throw new Error(`Roboflow API Error: ${error.message}`);
    }
}

module.exports = { scoreDamage };


/*
JSON RESPONSE
[
  {
    "model_predictions": {
      "image": {
        "width": 1024,
        "height": 768
      },
      "predictions": [
        {
          "width": 46,
          "height": 36,
          "x": 30,
          "y": 233,
          "confidence": 0.627243161201477,
          "class_id": 10,
          "class": "damage",
          "detection_id": "009f3468-a1c1-46d5-ad76-56f6207da629",
          "parent_id": "image"
        }
      ]
    },
    "circle_visualization": {
      "type": "base64",
      "value": "Token response",
      "video_metadata": {
        "video_identifier": "image",
        "frame_number": 0,
        "frame_timestamp": "2024-12-07T10:25:12.654942",
        "fps": 30,
        "measured_fps": null,
        "comes_from_video_file": null
      }
    },
    "dynamic_crop": [
      {
        "type": "base64",
        "value": "Token response",
        "video_metadata": {
          "video_identifier": "009f3468-a1c1-46d5-ad76-56f6207da629",
          "frame_number": 0,
          "frame_timestamp": "2024-12-07T10:25:12.649547",
          "fps": 30,
          "measured_fps": null,
          "comes_from_video_file": null
        }
      }
    ]
  }
]
*/