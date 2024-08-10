require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { handleStartCommand } = require("./commands/start");
const { handleHelpCommand } = require("./commands/help");
const { handleIdleState } = require("./states/idleState");
const { handleCityInput } = require("./states/awaitingCityState");
const {
  handleManualWeatherInput,
} = require("./states/awaitingManualWeatherState");
const { handleMoodInput } = require("./states/awaitingMoodState");
const { handleWineTypeInput } = require("./states/awaitingWineTypeState");
const {
  handleWineSweetnessInput,
} = require("./states/awaitingWineSweetnessState");
const { handleWinePriceInput } = require("./states/awaitingWinePriceState");
const { handleSobrietyMenu } = require("./states/sobrietyMenuState");
const {
  handleSobrietyConfirmReset,
} = require("./states/sobrietyConfirmResetState");
const { States, userStates } = require("./utils/constants");
const {
  weatherService,
  geocodingService,
} = require("./utils/weatherServiceInstance");
const { handleFoodType } = require("./states/awaitingFoodTypeState");
const { handleFoodChoice } = require("./states/awaitingFoodChoiceState");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));
bot.onText(/\/help/, (msg) => handleHelpCommand(bot, msg));

bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") return;

  const currentState = userStates[chatId]?.state || States.IDLE;
  switch (currentState) {
    case States.IDLE:
      handleIdleState(bot, chatId, text);
      break;
    case States.AWAITING_CITY:
      await handleCityInput(bot, chatId, text);
      break;
    case States.AWAITING_MANUAL_WEATHER:
      await handleManualWeatherInput(bot, chatId, text);
      break;
    case States.AWAITING_MOOD:
      await handleMoodInput(bot, chatId, text);
      break;
    case States.AWAITING_WINE_TYPE:
      await handleWineTypeInput(bot, chatId, text);
      break;
    case States.AWAITING_WINE_SWEETNESS:
      await handleWineSweetnessInput(bot, chatId, text);
      break;
    case States.AWAITING_WINE_PRICE:
      await handleWinePriceInput(bot, chatId, text);
      break;
    case States.AWAITING_FOOD_CHOICE:
      await handleFoodChoice(bot, chatId, text);
      break;
    case States.AWAITING_FOOD_TYPE:
      await handleFoodType(bot, chatId, text);
      break;
    case States.SOBRIETY_MENU:
      await handleSobrietyMenu(bot, chatId, text);
      break;
    case States.SOBRIETY_CONFIRM_RESET:
      await handleSobrietyConfirmReset(bot, chatId, text);
      break;
    case States.SOBRIETY_MENU:
      await handleSobrietyMenu(bot, chatId, text);
      break;
    default:
      bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду. Пожалуйста, используйте меню."
      );
      break;
  }
});

console.log("Бот запущен");
