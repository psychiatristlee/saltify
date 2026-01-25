import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyApJ8N3-q34uwciBpenSYsbSbDjViuToAs';

const breads = [
  { name: 'salt-bread', prompt: 'A single cute Korean salt bread (shio pan), oval shaped golden brown bread roll with butter visible and coarse salt crystals on top, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
  { name: 'croissant', prompt: 'A single cute French croissant, flaky golden brown crescent shaped layered pastry, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
  { name: 'baguette', prompt: 'A single cute French baguette, long crusty golden bread with diagonal slash marks, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
  { name: 'melon-bread', prompt: 'A single cute Japanese melon pan bread, round pale green cookie-topped sweet bun with distinctive grid pattern, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
  { name: 'red-bean-bread', prompt: 'A single cute Korean red bean bun (danpatbbang), round brown glazed bun with black sesame seeds on top, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
  { name: 'cream-bread', prompt: 'A single cute Japanese cream pan bread, soft oval golden bun with white cream filling visible from side, 3D rendered game icon style, transparent background, no text, no letters, no words, centered, high quality' },
];

async function generateBreadIcons() {
  const outputDir = path.join(__dirname, '..', 'public', 'breads');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const bread of breads) {
    console.log(`Generating ${bread.name}...`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: bread.prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts) {
        let saved = false;
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
            const imageData = part.inlineData.data;
            const outputPath = path.join(outputDir, `${bread.name}.png`);
            fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
            console.log(`✓ Saved ${bread.name}.png`);
            saved = true;
            break;
          }
        }
        if (!saved) {
          console.error(`✗ No image in response for ${bread.name}`);
          console.log('Response:', JSON.stringify(data.candidates[0].content.parts.map(p => p.text || '[image]'), null, 2));
        }
      } else {
        console.error(`✗ Failed to generate ${bread.name}:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error(`✗ Failed to generate ${bread.name}:`, error.message);
    }

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log('\nDone!');
}

generateBreadIcons();
