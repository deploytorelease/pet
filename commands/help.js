const { sendHelp } = require('../utils/helpers');

function handleHelpCommand(bot, msg) {
  const chatId = msg.chat.id;
  sendHelp(bot, chatId);
}

module.exports = { handleHelpCommand };