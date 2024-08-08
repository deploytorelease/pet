const axios = require('axios');

class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/3.0';
  }

  async getWeather(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
          lang: 'ru' // Добавляем параметр для получения данных на русском языке
        },
      });
      
      const data = response.data;
      
      // Обновляем структуру возвращаемых данных в соответствии с новым API
      return {
        temperature: data.main.temp,
        description: data.weather[0].description,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }
}

module.exports = WeatherService;