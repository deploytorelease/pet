require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const OpenAI = require("openai");

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
});

// Создаем бота с полученным токеном
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Объекты для хранения данных пользователей
const userStates = {};
const sobrietyTracker = {};
const userPreferences = {};

// Состояния диалога
const States = {
  IDLE: "IDLE",
  AWAITING_CITY: "AWAITING_CITY",
  AWAITING_MANUAL_WEATHER: "AWAITING_MANUAL_WEATHER",
  AWAITING_MOOD: "AWAITING_MOOD",
  AWAITING_WINE_TYPE: "AWAITING_WINE_TYPE",
  AWAITING_WINE_SWEETNESS: "AWAITING_WINE_SWEETNESS",
  AWAITING_WINE_PRICE: "AWAITING_WINE_PRICE",
  GENERATING_RECOMMENDATION: "GENERATING_RECOMMENDATION",
  SOBRIETY_MENU: "SOBRIETY_MENU",
  SOBRIETY_CONFIRM_RESET: "SOBRIETY_CONFIRM_RESET",
};

// Обработчики команд
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendMainMenu(
    chatId,
    "Привет! Я бот для выбора вина и отслеживания трезвости. Выберите действие:"
  );
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  sendHelp(chatId);
});

// Основной обработчик текстовых сообщений
bot.on("text", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") return;

  const currentState = userStates[chatId]?.state || States.IDLE;
  if (currentState === States.IDLE) {
    handleIdleState(chatId, text);
  } else {
  switch (currentState) {
    case States.IDLE:
      handleIdleState(chatId, text);
      break;
    case States.AWAITING_CITY:
      await handleCityInput(chatId, text);
      break;
    case States.AWAITING_MANUAL_WEATHER:
      await handleManualWeatherInput(chatId, text);
      break;
    case States.AWAITING_MOOD:
      await handleMoodInput(chatId, text);
      break;
    case States.AWAITING_WINE_TYPE:
      await handleWineTypeInput(chatId, text);
      break;
    case States.AWAITING_WINE_SWEETNESS:
      await handleWineSweetnessInput(chatId, text);
      break;
    case States.AWAITING_WINE_PRICE:
      await handleWinePriceInput(chatId, text);
      break;
    case States.SOBRIETY_MENU:
      await handleSobrietyMenu(chatId, text);
      break;
    case States.SOBRIETY_CONFIRM_RESET:
      await handleSobrietyConfirmReset(chatId, text);
      break;
    default:
      bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду. Пожалуйста, используйте меню."
      );
      break;
  }
}
});

function sendMainMenu(chatId, message) {
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ["🍷 Выбрать вино"],
        ["🚱 Отслеживание трезвости"],
        ["ℹ️ Помощь"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }),
  };
  userStates[chatId] = { state: States.IDLE }; // Сбрасываем состояние на IDLE
  bot.sendMessage(chatId, message, opts);
}

function handleIdleState(chatId, text) {
  switch (text) {
    case "🍷 Выбрать вино":
      startWineSelection(chatId);
      break;
    case "🚱 Отслеживание трезвости":
      startSobrietyTracking(chatId);
      break;
    case "ℹ️ Помощь":
      sendHelp(chatId);
      break;
    case "Отмена":
      sendMainMenu(
        chatId,
        "Действие отменено. Что бы вы хотели сделать дальше?"
      );
      break;
    default:
      bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду. Пожалуйста, используйте меню."
      );
      break;
  }
}

function startWineSelection(chatId) {
  userStates[chatId] = { state: States.AWAITING_CITY };
  bot.sendMessage(
    chatId,
    "Давайте подберем для вас идеальное вино. В каком городе вы находитесь?",
    { reply_markup: { remove_keyboard: true } }
  );
}

function startSobrietyTracking(chatId) {
  userStates[chatId] = { state: States.SOBRIETY_MENU };
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ["Начать отсчет"],
        ["Проверить статус"],
        ["Вернуться в главное меню"],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }),
  };
  bot.sendMessage(
    chatId,
    "Выберите действие для отслеживания трезвости:",
    opts
  );
}

async function handleSobrietyMenu(chatId, action) {
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
        startSobrietyTracking(chatId);
      }
      break;
    case "Проверить статус":
      await checkSobrietyStatus(chatId);
      break;
    case "Вернуться в главное меню":
      sendMainMenu(chatId, "Что бы вы хотели сделать дальше?");
      break;
    default:
      await bot.sendMessage(
        chatId,
        "Извините, я не понимаю эту команду. Пожалуйста, используйте предложенные кнопки."
      );
      startSobrietyTracking(chatId);
      break;
  }
}

async function handleSobrietyConfirmReset(chatId, action) {
  switch (action) {
    case "Да, начать заново":
      sobrietyTracker[chatId] = Date.now();
      await bot.sendMessage(
        chatId,
        "Отсчет дней трезвости начат заново. Новое начало - новые возможности! 🌟"
      );
      break;
    case "Нет, продолжить текущий отсчет":
      await bot.sendMessage(
        chatId,
        "Отлично! Продолжайте в том же духе. Ваш текущий отсчет сохранен."
      );
      break;
    case "Вернуться в главное меню":
      sendMainMenu(chatId, "Что бы вы хотели сделать дальше?");
      return;
  }
  startSobrietyTracking(chatId);
}

async function checkSobrietyStatus(chatId) {
  if (sobrietyTracker[chatId]) {
    const seconds = Math.floor((Date.now() - sobrietyTracker[chatId]) / 1000);
    if (seconds < 60) {
      await bot.sendMessage(
        chatId,
        `Вы держитесь уже ${seconds} секунд! Каждая секунда - это шаг к успеху. Продолжайте в том же духе! 💪`
      );
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      await bot.sendMessage(
        chatId,
        `Вы держитесь уже ${minutes} минут! Вы молодец, так держать! 🌟`
      );
    } else {
      const hours = Math.floor(seconds / 3600);
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;

      let message = "";
      if (days > 0) {
        message = `Вы держитесь уже ${days} дней и ${remainingHours} часов! Это впечатляющее достижение! 🏆`;
      } else {
        message = `Вы держитесь уже ${hours} часов! Вы на верном пути! 🌟`;
      }

      await bot.sendMessage(chatId, message);
    }
  } else {
    await bot.sendMessage(
      chatId,
      'Вы еще не начали отсчет. Выберите "Начать отсчет", чтобы начать свой путь к трезвости.'
    );
  }
}

function sendHelp(chatId) {
  const helpText = `
Вот что я умею:
🍷 Выбрать вино - я помогу подобрать вино с учетом погоды и вашего настроения
🚱 Отслеживание трезвости - помогу отслеживать дни без алкоголя
ℹ️ Помощь - покажу это сообщение

Команды:
/start - начать взаимодействие с ботом
/help - показать это сообщение помощи

Чтобы начать, просто выберите нужное действие в меню или используйте команду /start.
  `;
  bot.sendMessage(chatId, helpText);
}

async function getWeather(city) {
  try {
    const response = await axios.get(
      `http://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

async function handleCityInput(chatId, city) {
  const weatherData = await getWeather(city);
  if (weatherData) {
    const temperature = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    await bot.sendMessage(
      chatId,
      `Текущая погода в указанном вами городе: ${temperature}°C, ${weatherDescription}`
    );

    userStates[chatId] = {
      state: States.AWAITING_MOOD,
      city: city,
      weather: weatherData,
    };
    await bot.sendMessage(chatId, "Как бы вы описали свое текущее настроение?");
  } else {
    await bot.sendMessage(
      chatId,
      `К сожалению, не удалось получить информацию о погоде для указанного города. Пожалуйста, опишите погоду сами (например, "20°C, солнечно").`
    );
    userStates[chatId] = { state: States.AWAITING_MANUAL_WEATHER };
  }
}

async function generateWineRecommendation(userState) {
  const { weather, mood, wineType, wineSweetness, winePrice } = userState;
  const temperature = weather.main.temp;
  const weatherDescription = weather.weather[0].description;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Вы - эксперт по винам, который дает рекомендации на русском языке.",
        },
        {
            role: "user",
            content: `Порекомендуйте вино, основываясь на следующих условиях:
            Погода: ${temperature}°C, ${weatherDescription}
            Настроение: ${mood}
            Тип вина: ${wineType}
            Сладость: ${wineSweetness}
            Ценовой диапазон: ${winePrice}
            Пожалуйста, дайте название конкретного вина и его краткое описание.
            Описание должно быть структурировано следующим образом:
            Рекомендую попробовать вино "название вина".
            Тип вина с основными нотами вкуса.
            Его текстура и кислотность.
            Польза в зависимости от состояния.
            Соответствие температуре.
            Влияние погоды.
            Ценовая доступность и общая рекомендация.
            Каждое предложение должно начинаться с новой строки и быть не длиннее 400 символов.
            Используйте только разметку для телеграмма.`      },
      ],
      max_tokens: 600,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating wine recommendation:", error);
    return "Извините, не удалось сгенерировать рекомендацию. Пожалуйста, попробуйте еще раз позже.";
  }
}

async function handleManualWeatherInput(chatId, weatherDescription) {
  userStates[chatId] = {
    state: States.AWAITING_MOOD,
    weather: {
      main: { temp: extractTemperature(weatherDescription) },
      weather: [{ description: weatherDescription }],
    },
  };
  await bot.sendMessage(
    chatId,
    "Спасибо за информацию о погоде. Как бы вы описали свое текущее настроение?"
  );
}

function extractTemperature(weatherDescription) {
  const match = weatherDescription.match(/(-?\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}

async function handleMoodInput(chatId, mood) {
  userStates[chatId].mood = mood;
  userStates[chatId].state = States.AWAITING_WINE_TYPE;
  await bot.sendMessage(chatId, "Какой тип вина вы предпочитаете?", {
    reply_markup: JSON.stringify({
      keyboard: [["Красное", "Белое", "Розовое", "Игристое", "Любой"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

async function handleWineTypeInput(chatId, wineType) {
  userStates[chatId].wineType = wineType;
  userStates[chatId].state = States.AWAITING_WINE_SWEETNESS;
  await bot.sendMessage(chatId, "Какую сладость вина вы предпочитаете?", {
    reply_markup: JSON.stringify({
      keyboard: [["Сухое", "Полусухое", "Полусладкое", "Сладкое", "Любую"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

async function handleWineSweetnessInput(chatId, wineSweetness) {
  userStates[chatId].wineSweetness = wineSweetness;
  userStates[chatId].state = States.AWAITING_WINE_PRICE;
  await bot.sendMessage(chatId, "Какой ценовой диапазон вас интересует?", {
    reply_markup: JSON.stringify({
      keyboard: [["Бюджетное", "Среднее", "Премиум", "Любой"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  });
}

async function handleWinePriceInput(chatId, winePrice) {
  userStates[chatId].winePrice = winePrice;
  userStates[chatId].state = States.GENERATING_RECOMMENDATION;
  await bot.sendMessage(
    chatId,
    "Отлично! Сейчас подберу для вас идеальное вино, учитывая погоду, ваше настроение и предпочтения."
  );

  const recommendation = await generateWineRecommendation(userStates[chatId]);
  await bot.sendMessage(chatId, recommendation);

  sendMainMenu(chatId, "Что бы вы хотели сделать дальше?");
  delete userStates[chatId];
}

console.log("Бот запущен");
