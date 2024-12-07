const axios = require('axios');

async function getLocationInfo() {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    console.log('Raw location data:', response.data);
    // const locationData = response.data;
    
    return {
      city: locationData.city,
      state: locationData.region,
      country: locationData.country_name,
    };
  } catch (error) {
    console.error('Error fetching location data:', error);
    return null;
  }
}

module.exports = { getLocationInfo };