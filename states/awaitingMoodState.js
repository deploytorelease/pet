const { States, userStates } = require('../utils/constants');

async function handleMoodInput(bot, chatId, mood) {
  userStates[chatId].mood = mood;
  userStates[chatId].state = States.AWAITING_WINE_TYPE;
  await bot.sendMessage(chatId, "Какой тип вина вы предпочитаете?", {
    reply_markup: JSON.stringify({
      keyboard: [["Красное", "Белое", "Розовое", "Игристое", "Любой"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

module.exports = { handleMoodInput };