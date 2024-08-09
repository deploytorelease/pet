const { States, userStates } = require('../utils/constants');

async function handleWineSweetnessInput(bot, chatId, wineSweetness) {
  userStates[chatId].wineSweetness = wineSweetness;
  userStates[chatId].state = States.AWAITING_WINE_PRICE;
  await bot.sendMessage(chatId, "Какой ценовой диапазон вас интересует?", {
    reply_markup: JSON.stringify({
      keyboard: [["Бюджетное", "Среднее", "Премиум", "Любой"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

module.exports = { handleWineSweetnessInput };