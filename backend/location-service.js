const axios = require('axios');

async function getLocationInfo() {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    // console.log('Raw location data:', response.data);
    
    // Add validation to ensure we have the required fields
    if (!response.data || !response.data.city) {
      throw new Error('Invalid location data received');
    }

    return {
      city: response.data.city || 'Unknown',
      state: response.data.region || 'Unknown',
      country: response.data.country_name || 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching location data:', error);
    // Return a default object instead of null to prevent undefined errors
    return {
      city: 'Unknown',
      state: 'Unknown',
      country: 'Unknown',
    };
  }
}

module.exports = { getLocationInfo };