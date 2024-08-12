const { States, userStates, sobrietyTracker, userCities } = require('./constants');
const OpenAI = require("openai");
const { weatherService, geocodingService } = require('./weatherServiceInstance');

const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
});

function sendMainMenu(bot, chatId, message) {
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ["🍷 Выбрать вино"],
        ["💬 Свободный запрос"],
        ["🚱 Отслеживание трезвости"],
        ["🏙️ Изменить город"],
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
  💬 Свободный запрос - опишите свои пожелания, и я постараюсь подобрать вино
  🚱 Отслеживание трезвости - помогу отслеживать дни без алкоголя
  ℹ️ Помощь - покажу это сообщение

  Команды:
  /start - начать взаимодействие с ботом
  /help - показать это сообщение помощи

  Вы можете использовать структурированный подход выбора вина или просто описать свои пожелания в свободной форме.
  `;
  bot.sendMessage(chatId, helpText);
}

async function startWineSelection(bot, chatId) {
  if (!userCities[chatId]) {
    userCities[chatId] = null;
  }
  const savedCity = userCities[chatId];
  
  if (savedCity) {
    await updateWeatherAndProceed(bot, chatId, savedCity);
  } else {
    userStates[chatId] = { state: States.AWAITING_CITY };
    await bot.sendMessage(
      chatId,
      "Давайте подберем для вас идеальное вино. В каком городе вы находитесь?",
      { reply_markup: { remove_keyboard: true } }
    );
  }
}

async function updateWeatherAndProceed(bot, chatId, city) {
  const coordinates = await geocodingService.getCoordinates(city);
  if (!coordinates) {
    await bot.sendMessage(
      chatId,
      `К сожалению, не удалось получить координаты для города ${city}. Пожалуйста, введите название города еще раз.`
    );
    userStates[chatId] = { state: States.AWAITING_CITY };
    return;
  }

  const weatherData = await weatherService.getWeather(coordinates.lat, coordinates.lon);
  if (weatherData) {
    userStates[chatId] = {
      state: States.AWAITING_MOOD,
      city: city,
      weather: weatherData,
    };
    await bot.sendMessage(
      chatId,
      `Текущая погода в ${city}: ${weatherData.temperature}°C, ${weatherData.description}. Как бы вы описали свое текущее настроение?`
    );
  } else {
    await bot.sendMessage(
      chatId,
      `К сожалению, не удалось получить информацию о погоде для города ${city}. Пожалуйста, опишите погоду сами (например, "20°C, солнечно").`
    );
    userStates[chatId] = { state: States.AWAITING_MANUAL_WEATHER };
  }
}
async function updateWeatherAndProceed(bot, chatId, city) {
  console.log(`Updating weather for ${chatId} in city ${city}`);
  try {
    const coordinates = await geocodingService.getCoordinates(city);
    console.log(`Coordinates for ${city}:`, coordinates);
    if (!coordinates) {
      await bot.sendMessage(
        chatId,
        `К сожалению, не удалось получить координаты для города ${city}. Пожалуйста, введите название города еще раз.`
      );
      userStates[chatId] = { state: States.AWAITING_CITY };
      return;
    }

    const weatherData = await weatherService.getWeather(coordinates.lat, coordinates.lon);
    console.log(`Weather data for ${city}:`, weatherData);
    if (weatherData) {
      userStates[chatId] = {
        state: States.AWAITING_MOOD,
        city: city,
        weather: weatherData,
      };

      // Сообщение с погодой
      const weatherMessage = `
*${city}*:
🌡️ Температура: ${weatherData.temperature}°C
🌥️ Ощущается как: ${weatherData.feelsLike}°C
🌦️ Описание: ${weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1)}
💧 Влажность: ${weatherData.humidity}%
🌬️ Ветер: ${weatherData.windSpeed} м/с

Какое у вас сейчас настроение?`;

      await bot.sendMessage(chatId, weatherMessage, { parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(
        chatId,
        `К сожалению, не удалось получить информацию о погоде для города ${city}. Пожалуйста, опишите погоду сами (например, "20°C, солнечно").`
      );
      userStates[chatId] = { state: States.AWAITING_MANUAL_WEATHER };
    }
  } catch (error) {
    console.error(`Error in updateWeatherAndProceed for ${chatId}:`, error);
    await bot.sendMessage(chatId, "Произошла ошибка при получении данных о погоде. Пожалуйста, попробуйте еще раз.");
    userStates[chatId] = { state: States.IDLE };
  }
}


function changeCity(bot, chatId) {
  userStates[chatId] = { state: States.AWAITING_CITY };
  bot.sendMessage(
    chatId,
    "Пожалуйста, введите название нового города:",
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
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `Вы - дружелюбный и знающий сомелье, который дает рекомендации по вину на русском языке. 
            Ваши ответы должны быть естественными, разговорными и аппетитными, без излишней восторженности.
            Название вина давать в оригинале. 
            Используйте Markdown для форматирования:
            - Правильно склоняй название города
            - Выделяйте названия вин жирным шрифтом: **название вина**
            - Подчеркивайте важные вкусовые характеристики: _характеристика_
            
            Структурируйте ответ следующим образом:
            1. Краткое вступление с рекомендацией вина
            2. *Вино:* [название вина]
            3. *Вкус и аромат:* [описание]
            4. *Подходящее время и сочетание:* [рекомендации]
            5. *Примерная цена:* [ценовой диапазон]
            6. Заключительная фраза
            
            Не используй нумерацию в тексте.
            Не используйте технические обозначения (###) в тексте.`
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
          Посоветуй конкретное вино, опиши его вкус и аромат так, чтобы захотелось его попробовать. 
          Польза в зависимости от состояния.
          Сочетание с едой (если указано блюдо) или рекомендации по сочетанию с едой (если блюдо не указано).
          Расскажи, почему оно подходит к погоде и моему запросу, примерную цену. 
          Сделай ответ живым и дружелюбным, но без излишнего восторга.`,
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

module.exports = { sendMainMenu, sendHelp, startWineSelection, startSobrietyTracking, generateWineRecommendation, extractTemperature, checkSobrietyStatus, askFoodChoice, changeCity, updateWeatherAndProceed, updateWeatherAndProceed };