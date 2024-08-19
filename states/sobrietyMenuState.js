const { States, userStates, sobrietyTracker } = require("../utils/constants");
const { sendMainMenu, checkSobrietyStatus } = require("../utils/helpers");

async function handleSobrietyMenu(bot, chatId, action) {
  switch (action) {
    case undefined:  // Если action не передан, показываем главное меню с inline-кнопками
      const mainMenuOpts = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Начать отсчет", callback_data: "start_sobriety_count" }],
            [{ text: "Проверить статус", callback_data: "check_sobriety_status" }],
            [{ text: "Вернуться в главное меню", callback_data: "main_menu" }]
          ]
        }),
      };
      await bot.sendMessage(chatId, "Выберите действие:", mainMenuOpts);
      break;

    case "start_sobriety_count":
      if (sobrietyTracker[chatId]) {
        userStates[chatId].state = States.SOBRIETY_CONFIRM_RESET;
        const resetOpts = {
          reply_markup: JSON.stringify({
            inline_keyboard: [
              [{ text: "Да, начать заново", callback_data: "confirm_reset" }],
              [{ text: "Нет, продолжить текущий отсчет", callback_data: "continue_count" }],
              [{ text: "Вернуться в главное меню", callback_data: "main_menu" }]
            ]
          }),
        };
        await bot.sendMessage(
          chatId,
          "У вас уже есть активный отсчет. Хотите начать заново?",
          resetOpts
        );
      } else {
        sobrietyTracker[chatId] = Date.now();
        await bot.sendMessage(
          chatId,
          "Отсчет дней трезвости начат! Удачи в достижении ваших целей! 💪"
        );
        await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню после начала отсчета
      }
      break;

    case "confirm_reset":
      sobrietyTracker[chatId] = Date.now();
      await bot.sendMessage(
        chatId,
        "Отсчет дней трезвости начат заново! 💪"
      );
      await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню после сброса
      break;

    case "continue_count":
      await bot.sendMessage(
        chatId,
        "Продолжаем текущий отсчет."
      );
      await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню
      break;

    case "check_sobriety_status":
      await checkSobrietyStatus(bot, chatId);
      await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню после проверки статуса
      break;

    case "main_menu":
      await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню
      break;

    default:
      await bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду."
      );
      await handleSobrietyMenu(bot, chatId); // Возвращаемся в главное меню
      break;
  }
}

module.exports = { handleSobrietyMenu };