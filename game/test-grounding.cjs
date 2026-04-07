const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDNSF7BbTo7MXEm6xwD4OKyX59fsnxNCoE";

async function test() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ googleSearch: {} }],
  });

  const keywords = ["소금빵", "salt bread Seoul", "연남동 맛집"];

  for (const keyword of keywords) {
    console.log(`\n=== Searching: "${keyword}" ===`);

    try {
      const result = await model.generateContent(
        `Search for recent online posts, reviews, or discussions that mention "${keyword}". Focus on community and travel sites like Reddit, TripAdvisor, Naver Blog, Naver Cafe, Tistory, MangoPlate, Quora, Yelp, YouTube, Instagram, and similar platforms.\n\nFor each result found, provide the title, a brief snippet of the content, and the URL. List up to 10 results.`
      );

      const response = result.response;
      const candidate = response.candidates?.[0];
      const chunks = candidate?.groundingMetadata?.groundingChunks || [];
      const supports = candidate?.groundingMetadata?.groundingSupports || [];

      console.log(`Grounding chunks: ${chunks.length}`);
      console.log(`Grounding supports: ${supports.length}`);

      if (chunks.length > 0) {
        chunks.forEach((chunk, i) => {
          console.log(`\n  [${i + 1}] ${chunk.web?.title || "(no title)"}`);
          console.log(`      URL: ${chunk.web?.uri || "(no url)"}`);
        });
      } else {
        console.log("No grounding chunks returned.");
        console.log("Generated text:", response.text().substring(0, 200));
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

test();
