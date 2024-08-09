const axios = require('axios');

class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/3.0/onecall';
  }

  async getWeather(lat, lon) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric',
          lang: 'ru',
        },
      });

      const data = response.data;

      return {
        temperature: data.current.temp,
        description: data.current.weather[0].description,
        feelsLike: data.current.feels_like,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_speed,
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }
}

module.exports = WeatherService;