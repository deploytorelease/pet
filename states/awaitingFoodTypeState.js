const { States, userStates } = require('../utils/constants');
const { handleWineSweetnessInput } = require('./awaitingWineSweetnessState');

async function handleFoodType(bot, chatId, foodType) {
  userStates[chatId].foodType = foodType;
  userStates[chatId].state = States.AWAITING_WINE_SWEETNESS;
  await bot.sendMessage(chatId, `Отлично, вы выбрали блюдо: ${foodType}. Теперь давайте подберем к нему вино.`);
  await handleWineSweetnessInput(bot, chatId);
}

module.exports = { handleFoodType };