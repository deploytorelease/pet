const { States, userStates, sobrietyTracker } = require('./constants');
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
});

function sendMainMenu(bot, chatId, message) {
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
  userStates[chatId] = { state: States.IDLE };
  bot.sendMessage(chatId, message, opts);
}

function sendHelp(bot, chatId) {
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

function startWineSelection(bot, chatId) {
  userStates[chatId] = { state: States.AWAITING_CITY };
  bot.sendMessage(
    chatId,
    "Давайте подберем для вас идеальное вино. В каком городе вы находитесь?",
    { reply_markup: { remove_keyboard: true } }
  );
}

function startSobrietyTracking(bot, chatId) {
  userStates[chatId] = { state: States.SOBRIETY_MENU };
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ["Начать отсчет"],
        ["Проверить статус"],
        ["Вернуться в главное меню"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  };
  bot.sendMessage(chatId, "Выберите действие:", opts);
}

function askFoodChoice(bot, chatId) {
  userStates[chatId].state = States.AWAITING_FOOD_CHOICE;
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ["Да, подобрать к еде"],
        ["Нет, продолжить без еды"]
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  };
  bot.sendMessage(chatId, "Хотите подобрать вино к конкретному блюду?", opts);
}

async function generateWineRecommendation(userState) {
  const { weather, mood, wineType, wineSweetness, winePrice } = userState;
  const temperature = weather.temperature;
  const weatherDescription = weather.description;
  const feels_like = weather.feels_like;
  const humidity = weather.humidity;
  const foodType = userState.foodType || "не указано";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Вы - эксперт по винам, который дает рекомендации на русском языке.",
        },
        {
          role: "user",
          content: `Порекомендуйте вино, основываясь на следующих условиях:
          Погода: ${temperature}°C, ощущается как ${feels_like}°C, ${weatherDescription}
          Влажность: ${humidity}%
          Настроение: ${mood}
          Тип вина: ${wineType}
          Сладость: ${wineSweetness}
          Ценовой диапазон: ${winePrice}
          Блюдо: ${foodType}
          Пожалуйста, дайте название конкретного вина и его краткое описание.
          Описание должно быть структурировано следующим образом:
          Рекомендую попробовать вино "название вина".
          Тип вина с основными нотами вкуса.
          Его текстура и кислотность.
          Польза в зависимости от состояния.
          Соответствие температуре.
          Влияние погоды.
          Сочетание с едой (если указано блюдо) или рекомендации по сочетанию с едой (если блюдо не указано).
          Ценовая доступность и общая рекомендация.
          Каждое предложение должно начинаться с новой строки и быть не длиннее 400 символов.
          Используйте только разметку для телеграмма.`,
        },
      ],
      max_tokens: 600,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating wine recommendation:", error);
    return "Извините, не удалось сгенерировать рекомендацию. Пожалуйста, попробуйте еще раз позже.";
  }
}

function extractTemperature(weatherDescription) {
  const match = weatherDescription.match(/(-?\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}

async function checkSobrietyStatus(bot, chatId) {
  if (sobrietyTracker[chatId]) {
    const seconds = Math.floor((Date.now() - sobrietyTracker[chatId]) / 1000);
    if (seconds < 60) {
      await bot.sendMessage(chatId, `Вы держитесь уже ${seconds} секунд! Каждая секунда - это шаг к успеху. Продолжайте в том же духе! 💪`);
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      await bot.sendMessage(chatId, `Вы держитесь уже ${minutes} минут! Вы молодец, так держать! 🌟`);
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
    await bot.sendMessage(chatId, 'Вы еще не начали отсчет. Выберите "Начать отсчет", чтобы начать свой путь к трезвости.');
  }
}

module.exports = { sendMainMenu, sendHelp, startWineSelection, startSobrietyTracking, generateWineRecommendation, extractTemperature, checkSobrietyStatus, askFoodChoice };