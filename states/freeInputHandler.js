const OpenAI = require("openai");
const { weatherService, geocodingService } = require('../utils/weatherServiceInstance');
const { sendMainMenu } = require('../utils/helpers');
const { States, userStates, userCities } = require('../utils/constants');

const openai = new OpenAI({
  apiKey: process.env.CHATGPT_API_KEY,
});

async function handleFreeInputDialog(bot, chatId, initialInput) {
    console.log(`Starting handleFreeInputDialog for chatId: ${chatId}, input: ${initialInput}`);
    
    if (initialInput === "💬 Свободный запрос") {
      userStates[chatId] = { state: States.FREE_INPUT, stage: 'awaiting_input' };
      await bot.sendMessage(chatId, "Расскажите, какое вино вы хотите или в какой ситуации планируете его пить. Я постараюсь дать подходящую рекомендацию.");
      return;
    }
  
    const inputAnalysis = await analyzeUserInput(initialInput);
    
    if (inputAnalysis.isGreeting) {
      await handleGreeting(bot, chatId);
    } else if (inputAnalysis.isRelevant) {
      await processWineRequest(bot, chatId, initialInput);
    } else {
      const friendlyResponse = await generateFriendlyResponse(initialInput);
      userStates[chatId] = { state: States.FREE_INPUT, stage: 'awaiting_clarification' };
      await bot.sendMessage(chatId, friendlyResponse);
    }
  }
  
  
  async function handleGreeting(bot, chatId) {
    const greetingMessage = `
  Привет! Я бот-сомелье, и я здесь, чтобы помочь вам с выбором идеального вина. Вот что я умею:
  
  • Рекомендовать вино на основе ваших предпочтений и ситуации
  • Учитывать погоду в вашем городе при выборе вина
  • Предлагать сочетания вина с едой
  • Давать информацию о разных сортах вин
  
Вы можете выбрать один из пунктов меню ниже или просто рассказать мне, какое вино вы хотите или для какого случая вам нужна рекомендация. Я с удовольствием помогу!
    `;
  
    await bot.sendMessage(chatId, greetingMessage);
    await sendMainMenu(bot, chatId, "Выберите действие или опишите, что вы хотите:");
  }
  

  async function continueFreeInputDialog(bot, chatId, input) {
    const { stage, initialInput } = userStates[chatId];
    if (stage === 'awaiting_city') {
      const city = await extractCity(input) || userCities[chatId];
      await processRecommendation(bot, chatId, initialInput, city);
    } else if (stage === 'awaiting_clarification') {
      const inputAnalysis = await analyzeUserInput(input);
      if (inputAnalysis.isRelevant) {
        const city = await extractCity(input) || userCities[chatId];
        if (!city) {
          userStates[chatId] = { state: States.FREE_INPUT, stage: 'awaiting_city', initialInput: input };
          await bot.sendMessage(chatId, "Отлично! Для более точной рекомендации, пожалуйста, укажите ваш город.");
        } else {
          await processRecommendation(bot, chatId, input, city);
        }
      } else {
        const friendlyResponse = await generateFriendlyResponse(input, true);
        await bot.sendMessage(chatId, friendlyResponse);
        userStates[chatId] = { state: States.IDLE };
        await sendMainMenu(bot, chatId, "Выберите действие:");
      }
    }
  }
  

async function processWineRequest(bot, chatId, input) {
    const city = await extractCity(input);
    if (!city && !userCities[chatId]) {
      userStates[chatId] = { state: States.FREE_INPUT, stage: 'awaiting_city', initialInput: input };
      await bot.sendMessage(chatId, "Для более точной рекомендации, пожалуйста, укажите ваш город.");
    } else {
      await processRecommendation(bot, chatId, input, city || userCities[chatId]);
    }
  }
  

  async function analyzeUserInput(input) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Ты являешься ботом, который анализирует ввод пользователя. Ответь строго в формате JSON:
            \`\`\`json
            {
              "isGreeting": boolean,
              "isRelevant": boolean,
              "explanation": string
            }
            \`\`\``
          },
          {
            role: "user",
            content: input
          }
        ],
        max_tokens: 100
      });
  
      let response = completion.choices[0].message.content;
      console.log("API Response:", response);
  
      // Убираем блоки кода, если они присутствуют
      if (response.startsWith("```json")) {
        response = response.slice(7, -3); // Убираем ```json и ```
      }
  
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing user input:', error);
      return { isGreeting: false, isRelevant: false, explanation: "Не удалось проанализировать ввод" };
    }
  }
  
  

async function generateFriendlyResponse(input, isVague = false) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: `Вы - дружелюбный бот-сомелье. Ответьте на ввод пользователя приветливо и ненавязчиво предложите помощь с выбором вина. 
            ${isVague ? "Пользователь дал неопределенный ответ (например, 'любое' или 'без разницы'). Предложите конкретные варианты или задайте уточняющие вопросы о предпочтениях, ситуации или настроении." : ""}
            Не извиняйтесь и не используйте фразу "я не понял". Вместо этого попытайтесь мягко направить разговор к теме вина.`
          },
          {
            role: "user",
            content: input
          }
        ],
        max_tokens: 150
      });
  
      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating friendly response:', error);
      return "Давайте поговорим о вине? Что бы вы хотели попробовать?";
    }
  }


  async function processRecommendation(bot, chatId, initialInput, city = null) {
    let userCity = city || userCities[chatId];
  
    if (!userCity) {
      userStates[chatId] = { state: States.FREE_INPUT, stage: 'awaiting_city', initialInput };
      await bot.sendMessage(chatId, "Для более точной рекомендации, пожалуйста, укажите ваш город.");
      return;
    }
  
    // Сохранить город пользователя, если он не был сохранен ранее
    if (!userCities[chatId]) {
      userCities[chatId] = userCity;
    }
  
    const weather = await getWeatherInfo(userCity);
    const recommendation = await generateRecommendation(initialInput, userCity, weather);
  
    await bot.sendMessage(chatId, recommendation, { parse_mode: 'Markdown' });
    
    userStates[chatId] = { state: States.IDLE };
    await sendMainMenu(bot, chatId, "Что бы вы хотели сделать дальше?");
  }
  

async function extractCity(input) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Извлеките название города из текста пользователя, если оно присутствует. Отвечайте только названием города или 'null', если город не указан."
        },
        {
          role: "user",
          content: input
        }
      ],
      max_tokens: 50
    });
    const city = completion.choices[0].message.content.trim();
    return city !== 'null' ? city : null;
  } catch (error) {
    console.error('Error extracting city:', error);
    return null;
  }
}

async function generateRecommendation(input, city, weather) {
    const weatherInfo = weather ? 
      `Погода в *${city}*: ${weather.temperature}°C, ${weather.description}` :
      "Информация о погоде недоступна";
  
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
            - Выделяйте города курсивом: *город*
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
            content: `
              Мне нужна рекомендация по вину. Вот что нужно учесть:
              Мой запрос: ${input}
              ${weatherInfo}
  
              Посоветуй конкретное вино, опиши его вкус и аромат так, чтобы захотелось его попробовать. 
              Расскажи, почему оно подходит к погоде и моему запросу, с чем его лучше подавать и примерную цену. 
              Сделай ответ живым и дружелюбным, но без излишнего восторга.
            `
          }
        ],
        max_tokens: 500
      });
  
      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return "Извините, не удалось подобрать вино. Давайте попробуем еще раз?";
    }
  }
  
async function getWeatherInfo(city) {
  if (!geocodingService || typeof geocodingService.getCoordinates !== 'function') {
    console.error('geocodingService is not properly initialized');
    return null;
  }

  try {
    const coordinates = await geocodingService.getCoordinates(city);
    if (!coordinates) {
      console.log(`Coordinates not found for city: ${city}`);
      return null;
    }

    return await weatherService.getWeather(coordinates.lat, coordinates.lon);
  } catch (error) {
    console.error(`Error getting weather info for ${city}:`, error);
    return null;
  }
}

module.exports = { handleFreeInputDialog, continueFreeInputDialog };