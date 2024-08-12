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
const { States, userStates, userCities } = require("./utils/constants");
const { handleFoodType } = require("./states/awaitingFoodTypeState");
const { handleFoodChoice } = require("./states/awaitingFoodChoiceState");
const {
  handleFreeInputDialog,
  continueFreeInputDialog,
} = require("./states/freeInputHandler");
const { sendMainMenu } = require("./utils/helpers");
const { startSobrietyTracking } = require("./utils/helpers");
const { changeCity } = require("./utils/helpers");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  handleStartCommand(bot, msg);
  userStates[chatId] = { state: States.IDLE };
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  handleHelpCommand(bot, msg);
  userStates[chatId] = { state: States.IDLE };
});

bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start" || text === "/help") return;

  const currentState = userStates[chatId]?.state || States.IDLE;

  console.log(
    `Received message: "${text}" from user ${chatId} in state ${currentState}`
  );

  try {
    switch (currentState) {
      case States.IDLE:
        if (text === "🍷 Выбрать вино") {
          await handleIdleState(bot, chatId, text);
        } else if (text === "🚱 Отслеживание трезвости") {
          await startSobrietyTracking(bot, chatId, text);
        } else if (text === "ℹ️ Помощь") {
          await handleHelpCommand(bot, msg);
        } else if (text === "🏙️ Изменить город") {
          await changeCity(bot, chatId);
        } else if (text === "💬 Свободный запрос") {
          userStates[chatId] = {
            state: States.FREE_INPUT,
            stage: "awaiting_input",
          };
          await bot.sendMessage(
            chatId,
            "Опишите, какое вино вы хотите или в какой ситуации собираетесь его пить. Я постараюсь дать подходящую рекомендацию."
          );
        } else {
          await handleFreeInputDialog(bot, chatId, text);
        }
        break;
      case States.FREE_INPUT:
        if (userStates[chatId].stage === "awaiting_input") {
          await handleFreeInputDialog(bot, chatId, text);
        } else {
          await continueFreeInputDialog(bot, chatId, text);
        }
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
      default:
        console.log(`Unhandled state: ${currentState}`);
        await bot.sendMessage(
          chatId,
          "Извините, произошла ошибка. Давайте начнем сначала."
        );
        sendMainMenu(bot, chatId, "Выберите действие:");
        break;
    }
  } catch (error) {
    console.error(`Error processing message: ${error}`);
    await bot.sendMessage(
      chatId,
      "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз."
    );
    sendMainMenu(bot, chatId, "Выберите действие:");
  }
});

console.log("Бот запущен");
