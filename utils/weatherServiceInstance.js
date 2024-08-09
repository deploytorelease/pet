const WeatherService = require('./weatherService');
const GeocodingService = require('./geocodingService');

const weatherService = new WeatherService(process.env.OPENWEATHER_API_KEY);
const geocodingService = new GeocodingService(process.env.OPENWEATHER_API_KEY);

module.exports = { weatherService, geocodingService };