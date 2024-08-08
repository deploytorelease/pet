const OpenAI = require("openai");

class WineService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateRecommendation(userState) {
    const { weather, mood, wineType, wineSweetness, winePrice } = userState;
    const temperature = weather.main.temp;
    const weatherDescription = weather.weather[0].description;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Вы - эксперт по винам, который дает рекомендации на русском языке.",
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
}

module.exports = WineService;