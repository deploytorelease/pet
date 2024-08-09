const { startWineSelection, startSobrietyTracking, sendHelp, sendMainMenu } = require('../utils/helpers');
const { userStates, States } = require('../utils/constants');

function handleIdleState(bot, chatId, text) {
  switch (text) {
    case "🍷 Выбрать вино":
      startWineSelection(bot, chatId);
      break;
    case "🚱 Отслеживание трезвости":
      startSobrietyTracking(bot, chatId);
      break;
    case "ℹ️ Помощь":
      sendHelp(bot, chatId);
      break;
    case "Отмена":
      sendMainMenu(bot, chatId, "Действие отменено. Что бы вы хотели сделать дальше?");
      break;
    default:
      bot.sendMessage(chatId, "Извините, я не понимаю эту команду. Пожалуйста, используйте меню.");
      break;
  }
}

module.exports = { handleIdleState };