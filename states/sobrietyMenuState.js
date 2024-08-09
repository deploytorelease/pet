const { States, userStates, sobrietyTracker } = require("../utils/constants");
const { sendMainMenu, checkSobrietyStatus } = require("../utils/helpers");

async function handleSobrietyMenu(bot, chatId, action) {
  switch (action) {
    case "Начать отсчет":
      if (sobrietyTracker[chatId]) {
        userStates[chatId].state = States.SOBRIETY_CONFIRM_RESET;
        const opts = {
          reply_markup: JSON.stringify({
            keyboard: [
              ["Да, начать заново"],
              ["Нет, продолжить текущий отсчет"],
              ["Вернуться в главное меню"],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          }),
        };
        await bot.sendMessage(
          chatId,
          "У вас уже есть активный отсчет. Хотите начать заново?",
          opts
        );
      } else {
        sobrietyTracker[chatId] = Date.now();
        await bot.sendMessage(
          chatId,
          "Отсчет дней трезвости начат! Удачи в достижении ваших целей! 💪"
        );
        sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
      }
      break;
    case "Проверить статус":
      await checkSobrietyStatus(bot, chatId);
      break;
    case "Вернуться в главное меню":
      sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
      break;
    default:
      await bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду. Пожалуйста, используйте предложенные кнопки."
      );
      sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
      break;
  }
}

module.exports = { handleSobrietyMenu };
