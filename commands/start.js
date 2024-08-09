const { sendMainMenu } = require('../utils/helpers');
const { userStates, States } = require('../utils/constants');

function handleStartCommand(bot, msg) {
  const chatId = msg.chat.id;
  sendMainMenu(bot, chatId, "Привет! Я бот для выбора вина и отслеживания трезвости. Выберите действие:");
}

module.exports = { handleStartCommand };