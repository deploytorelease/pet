const { States, sobrietyTracker, userStates } = require('../utils/constants');
const { sendMainMenu, startSobrietyTracking } = require('../utils/helpers');

async function handleSobrietyConfirmReset(bot, chatId, action) {
  switch (action) {
    case "Да, начать заново":
      sobrietyTracker[chatId] = Date.now();
      await bot.sendMessage(chatId, "Отсчет дней трезвости начат заново. Новое начало - новые возможности! 🌟");
      break;
    case "Нет, продолжить текущий отсчет":
      await bot.sendMessage(chatId, "Отлично! Продолжайте в том же духе. Ваш текущий отсчет сохранен.");
      break;
    case "Вернуться в главное меню":
      sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
      return;
  }
  startSobrietyTracking(bot, chatId);
}

module.exports = { handleSobrietyConfirmReset };