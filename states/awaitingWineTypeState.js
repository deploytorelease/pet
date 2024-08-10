const { askFoodChoice } = require('../utils/helpers');
const { userStates } = require('../utils/constants');

async function handleWineTypeInput(bot, chatId, wineType) {
  userStates[chatId].wineType = wineType;
  askFoodChoice(bot, chatId);
}

module.exports = { handleWineTypeInput };