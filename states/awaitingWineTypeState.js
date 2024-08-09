const { States, userStates } = require('../utils/constants');

async function handleWineTypeInput(bot, chatId, wineType) {
  userStates[chatId].wineType = wineType;
  userStates[chatId].state = States.AWAITING_WINE_SWEETNESS;
  await bot.sendMessage(chatId, "Какую сладость вина вы предпочитаете?", {
    reply_markup: JSON.stringify({
      keyboard: [["Сухое", "Полусухое", "Полусладкое", "Сладкое", "Любую"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

module.exports = { handleWineTypeInput };