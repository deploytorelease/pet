const axios = require('axios');

class GeocodingService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'http://api.openweathermap.org/geo/1.0/direct';
  }

  async getCoordinates(city) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          q: city,
          limit: 1,
          appid: this.apiKey,
        },
      });

      if (response.data.length === 0) {
        throw new Error('City not found');
      }

      const { lat, lon } = response.data[0];
      return { lat, lon };
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  }
}

module.exports = GeocodingService;