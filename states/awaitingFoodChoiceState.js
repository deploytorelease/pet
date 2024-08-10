const { States, userStates } = require('../utils/constants');
const { handleWineSweetnessInput } = require('./awaitingWineSweetnessState');

async function handleFoodChoice(bot, chatId, choice) {
  if (choice === "Да, подобрать к еде") {
    userStates[chatId].state = States.AWAITING_FOOD_TYPE;
    await bot.sendMessage(chatId, "Какое блюдо вы планируете?");
  } else {
    userStates[chatId].state = States.AWAITING_WINE_SWEETNESS;
    await handleWineSweetnessInput(bot, chatId);
  }
}

module.exports = { handleFoodChoice };