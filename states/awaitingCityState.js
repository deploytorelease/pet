const { weatherService, geocodingService } = require('../utils/weatherServiceInstance');
const { States, userStates, userCities } = require('../utils/constants');
const { updateWeatherAndProceed } = require('../utils/helpers');

async function handleCityInput(bot, chatId, city) {
  console.log(`Handling city input for chatId ${chatId}: ${city}`);
  try {
    userCities[chatId] = city; // Сохраняем город пользователя
    await updateWeatherAndProceed(bot, chatId, city);
  } catch (error) {
    console.error(`Error in handleCityInput for ${chatId}:`, error);
    await bot.sendMessage(chatId, "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.");
    userStates[chatId] = { state: States.IDLE };
  }
}

module.exports = { handleCityInput };