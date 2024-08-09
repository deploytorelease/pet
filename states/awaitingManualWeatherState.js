const { States, userStates } = require('../utils/constants');
const { extractTemperature } = require('../utils/helpers');

async function handleManualWeatherInput(bot, chatId, weatherDescription) {
  userStates[chatId] = {
    state: States.AWAITING_MOOD,
    weather: {
      main: { temp: extractTemperature(weatherDescription) },
      weather: [{ description: weatherDescription }],
    },
  };
  await bot.sendMessage(chatId, "Спасибо за информацию о погоде. Как бы вы описали свое текущее настроение?");
}

module.exports = { handleManualWeatherInput };