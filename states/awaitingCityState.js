const { weatherService, geocodingService } = require('../utils/weatherServiceInstance');
const { States, userStates } = require('../utils/constants');

async function handleCityInput(bot, chatId, city) {
  const coordinates = await geocodingService.getCoordinates(city);
  if (!coordinates) {
    await bot.sendMessage(
      chatId,
      `К сожалению, не удалось найти указанный город. Пожалуйста, проверьте название города и попробуйте снова.`
    );
    return;
  }

  const weatherData = await weatherService.getWeather(coordinates.lat, coordinates.lon);
  if (weatherData) {
    const { temperature, description, feelsLike, humidity, windSpeed } = weatherData;
    await bot.sendMessage(
      chatId,
      `Текущая погода в указанном вами городе:
       🌡 Температура: ${temperature}°C
       🌤 Описание: ${description}
       🤔 Ощущается как: ${feelsLike}°C
       💧 Влажность: ${humidity}%
       💨 Скорость ветра: ${windSpeed} м/с`
    );

    userStates[chatId] = {
      state: States.AWAITING_MOOD,
      city: city,
      weather: weatherData,
    };
    await bot.sendMessage(chatId, "Как бы вы описали свое текущее настроение?");
  } else {
    await bot.sendMessage(
      chatId,
      `К сожалению, не удалось получить информацию о погоде для указанного города. Пожалуйста, опишите погоду сами (например, "20°C, солнечно").`
    );
    userStates[chatId] = { state: States.AWAITING_MANUAL_WEATHER };
  }
}

module.exports = { handleCityInput };