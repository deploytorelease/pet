const { generateWineRecommendation } = require('../utils/helpers');
const { States, userStates } = require('../utils/constants');
const { sendMainMenu } = require('../utils/helpers');

async function handleWinePriceInput(bot, chatId, winePrice) {
  userStates[chatId].winePrice = winePrice;
  userStates[chatId].state = States.GENERATING_RECOMMENDATION;
  await bot.sendMessage(chatId, "Отлично! Сейчас подберу для вас идеальное вино, учитывая погоду, ваше настроение и предпочтения.");

  const recommendation = await generateWineRecommendation(userStates[chatId]);
  await bot.sendMessage(chatId, recommendation, { parse_mode: 'Markdown' });

  sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
  delete userStates[chatId];
}

module.exports = { handleWinePriceInput };