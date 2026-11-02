import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { telegramBotManager } from "./telegramService";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health check routes for Cloud Run deployment and readiness probes
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Google Search Console site verification route
app.get("/google325693a9242f5290.html", (req, res) => {
  res.type("text/html").send("google-site-verification: google325693a9242f5290.html");
});

const PORT = 3000;

// Lazy initialization of Gemini Client to prevent cold startup / deployment crashes
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to generate image using Imagen or Pollinations fallback
async function generateImage(promptText: string): Promise<string> {
  console.log("Image generation requested for prompt:", promptText);
  try {
    const response = await getAI().models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: promptText,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "1:1",
      },
    });

    if (response && response.generatedImages && response.generatedImages.length > 0) {
      const base64Img = response.generatedImages[0].image.imageBytes;
      if (base64Img) {
        return `![Yaratilgan rasm](data:image/jpeg;base64,${base64Img})\n\n✨ **Siz so'ragan rasm muvaffaqiyatli yaratildi!**`;
      }
    }
  } catch (err: any) {
    console.warn("Imagen 3 generation failed or quota exceeded, using Pollinations fallback:", err?.message || err);
  }

  // Pollinations AI fallback (100% reliable)
  const encodedPrompt = encodeURIComponent(promptText);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
  return `![Yaratilgan rasm](${imageUrl})\n\n✨ **Siz so'ragan rasm yaratildi!**`;
}

// AI Chat endpoint
const MODELS_FALLBACK_LIST = [
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

// Smart Prompt Enhancer endpoint (Claude/ChatGPT alternative groundbreaking feature)
app.post("/api/enhance-prompt", async (req, res) => {
  try {
    const { rawPrompt } = req.body;
    if (!rawPrompt || !rawPrompt.trim()) {
      return res.status(400).json({ error: "Prompt kiritilmadi" });
    }

    const enhanceInstruction = `Siz - dunyodagi eng ilg'or Prompt Engineeringsiz. Foydalanuvchi quyidagi qisqa yoki oddiy so'rovni kiritdi. Siz ushbu so'rovni sun'iy intellekt eng mukammal, to'liq, professional va aniq javob berishi uchun professional O'zbek tilidagi promptga aylantiring. Ortiqcha kirish so'zlarsiz, to'g'ridan-to'g'ri takomillashtirilgan prompt matnini qaytaring.`;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Foydalanuvchi so'rovi: "${rawPrompt.trim()}"` }] }],
      config: {
        systemInstruction: enhanceInstruction
      }
    });

    const enhanced = response.text ? response.text.trim().replace(/^["']|["']$/g, "") : rawPrompt;
    res.json({ enhancedPrompt: enhanced });
  } catch (error: any) {
    console.error("Prompt enhance error:", error);
    res.status(500).json({ error: "Promptni boyitishda xatolik yuz berdi" });
  }
});

// Speech-to-Text (STT) audio transcription endpoint powered by Gemini
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType, language } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio ma'lumot kiritilmadi" });
    }

    let base64 = audioData;
    if (base64.includes(",")) {
      base64 = base64.split(",")[1];
    }

    const langName = language === "ru-RU" ? "rus" : language === "en-US" ? "ingliz" : "o'zbek";
    const systemPrompt = `Siz professional Speech-to-Text (nutqni matnga aylantiruvchi) yordamchisiz.
Ushbu audio yozuvdagi inson nutqini aniq va so'zma-so'z to'liq matn shaklida yozib bering.
Asosiy til: ${langName} tili (agar boshqa tilda gapirilgan bo'lsa, gapirilgan tilni avtomatik aniqlang).
Muhim qoidalar:
- Faqatgina audio yozuvda aytilgan nutq matnini qaytaring.
- Hech qanday izoh, tushuntirish, prefiks ("Audio matni:") yoki qo'shimcha so'z qo'shmang.
- Tinish belgilarini (nuqta, vergul, so'roq) nutq ohangiga mos ravishda to'g'ri qo'ying.`;

    const audioPart = {
      inlineData: {
        mimeType: mimeType || "audio/webm",
        data: base64,
      },
    };

    let transcribedText = "";
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            audioPart,
            { text: "Ushbu audio yozuvdagi nutqni matnga aylantiring (Transcribe verbatim speech)." }
          ]
        },
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
        }
      });
      transcribedText = response.text ? response.text.trim() : "";
    } catch (primaryErr) {
      console.warn("Primary transcribe model failed, attempting fallback:", primaryErr);
      const fallbackResponse = await getAI().models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            audioPart,
            { text: "Transcribe verbatim speech from this audio." }
          ]
        },
        config: {
          systemInstruction: systemPrompt,
        }
      });
      transcribedText = fallbackResponse.text ? fallbackResponse.text.trim() : "";
    }

    res.json({ text: transcribedText });
  } catch (error: any) {
    console.error("Transcribe audio error:", error);
    res.status(500).json({ error: "Ovozni tahlil qilishda xatolik: " + (error.message || error) });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, attachments, customSystemPrompt, gemName, projectContext } = req.body;
    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Xabar yoki fayl kiritilmadi" });
    }

    const userQuery = (message || "").trim();

    // Check if user directly asks for an image generation
    const imageKeywords = [
      "rasm chiz", "rasm yarat", "surat chiz", "chizib ber", "rasmini chiz",
      "generate image", "draw image", "create image", "picture of"
    ];
    const isDirectImageRequest = imageKeywords.some((kw) => userQuery.toLowerCase().includes(kw));

    if (isDirectImageRequest && (!attachments || attachments.length === 0)) {
      const imageResult = await generateImage(userQuery);
      return res.json({ reply: imageResult });
    }

    // Format chat contents for GenAI
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        const parts: any[] = [];
        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const att of msg.attachments) {
            let base64Data = att.data || "";
            if (base64Data.includes(",")) {
              base64Data = base64Data.split(",")[1];
            }
            if (base64Data) {
              parts.push({
                inlineData: {
                  mimeType: att.type || "image/jpeg",
                  data: base64Data
                }
              });
            }
          }
        }
        parts.push({ text: msg.text || "" });
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: parts
        });
      }
    }

    // Current user message parts
    const currentParts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        let base64Data = att.data || "";
        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1];
        }

        const mimeType = att.type || "application/octet-stream";

        // Handle text/code documents
        if (mimeType.startsWith("text/") || mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("csv")) {
          try {
            const decodedText = Buffer.from(base64Data, 'base64').toString('utf-8');
            currentParts.push({ text: `\n[Fayl yuklandi: ${att.name}]\n\`\`\`\n${decodedText}\n\`\`\`\n` });
          } catch (e) {
            currentParts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          }
        } else {
          currentParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      }
    }

    currentParts.push({ text: userQuery || "Faylni tahlil qilib ber." });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    let baseSystemInstruction = "Siz - 'OsonAI' (ChatGPT, Gemini, Claude muqobili bo'lgan) o'zbek tilidagi eng aqlli, tezkor va samimiy virtual yordamchisiz. Sizning rasmiy modelingiz nomi va versiyasi: 'Oson v2.55'. Sizdan qaysi modelsiz yoki qanday model deb so'ralsa, har doim 'Oson v2.55' deb javob bering, hech qachon 'Gemini' yoki 'Gemini 2.5' deb atamang. Sizni iste'dodli dasturchi Anvarbek Muxiddinov (Yangi Namangan tumani ixtisoslashtirilgan maktabi - TIM o'quvchisi) yaratgan va uni NamRobo jamoasi qo'llab-quvvatlaydi. MUHIM QOIDA 1: Ushbu yaratuvchi haqidagi ma'lumotni FAQAT va FAQAT foydalanuvchi 'Sizni kim yaratgan?', 'Muallifingiz kim?', 'Yaratuvchingiz kim?' deb mualliflik haqida so'ragandagina taqdim eting. Oddiy suhbatlarda va boshqa barcha savollarda muallif haqida yoki Uzinfocom haqida umuman gapirmang (Uzinfocom tashkilotiga umuman aloqangiz yo'q). MUHIM QOIDA 2: Agar foydalanuvchi rasm yaratish/chizib berishni so'rasa va siz rasm loyihalashtirmoqchi bo'lsangiz, javobingizda aynan `[GENERATE_IMAGE: english detailed description of image]` shaklidagi tegni kiriting. Foydalanuvchilar yuklagan barcha turdagi fayllar (rasmlar, hujjatlar, PDF, matn, audio, kod) va savollarga mukammal, tushunarli javoblar berasiz. Agar kod yozsangiz, uni markdown (```code blocks) formatida bering.";

    if (gemName && customSystemPrompt) {
      baseSystemInstruction += `\n\n[FAOL GEM / PERSONA: ${gemName}]\n${customSystemPrompt}`;
    } else if (customSystemPrompt) {
      baseSystemInstruction += `\n\n[MAXSUS KO'RSATMA / PROMPTLAR]:\n${customSystemPrompt}`;
    }

    if (projectContext) {
      baseSystemInstruction += `\n\n[FAOL LOYIHA KONTEKSTI / PROJECT KNOWLEDGE]:\n${projectContext}`;
    }

    let response;
    let lastError: any = null;

    for (const model of MODELS_FALLBACK_LIST) {
      let success = false;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempting generation with model: ${model} (Attempt ${attempt + 1}/${maxRetries + 1})`);
          response = await getAI().models.generateContent({
            model: model,
            contents: contents,
            config: {
              systemInstruction: baseSystemInstruction
            }
          });
          if (response && response.text) {
            console.log(`Success with model: ${model}`);
            success = true;
            break;
          }
        } catch (error: any) {
          lastError = error;
          const errorMessage = error.message || JSON.stringify(error);
          console.warn(`Error using model ${model} (Attempt ${attempt + 1}):`, errorMessage);
          
          if (errorMessage.includes("404") || errorMessage.includes("NOT_FOUND")) {
            break; // Skip directly to next model
          }

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 500;
            console.log(`Sleeping for ${delay}ms before next retry on ${model}...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (success && response) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Barcha sun'iy intellekt modellari hozirda band yoki javob olinmadi.");
    }

    let finalReply = response.text;

    // Check if reply contains [GENERATE_IMAGE: ...] tag
    const imageTagRegex = /\[GENERATE_IMAGE:\s*([\s\S]*?)\]/;
    const tagMatch = finalReply.match(imageTagRegex);
    if (tagMatch && tagMatch[1]) {
      const imagePrompt = tagMatch[1].trim();
      const generatedImgMarkdown = await generateImage(imagePrompt);
      finalReply = finalReply.replace(imageTagRegex, generatedImgMarkdown);
    }

    res.json({ reply: finalReply });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Serverda muammo yuz berdi: " + (error.message || error),
      isRetryable: true
    });
  }
});

// Telegram Bot Status Endpoint
app.get("/api/telegram-bot/status", (req, res) => {
  try {
    const status = telegramBotManager.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to get bot status" });
  }
});

// Telegram Bot Restart / Sync Endpoint
app.post("/api/telegram-bot/restart", async (req, res) => {
  try {
    telegramBotManager.stop();
    await new Promise((r) => setTimeout(r, 1000));
    await telegramBotManager.start();
    res.json({ success: true, status: telegramBotManager.getStatus() });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to restart bot" });
  }
});

// Telegram Bot Set Avatar Endpoint
app.post("/api/telegram-bot/set-avatar", async (req, res) => {
  try {
    const success = await telegramBotManager.setBotProfilePhoto();
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to set avatar" });
  }
});

async function startServer() {
  // Initialize Telegram Bot with Gemini and Image generator
  telegramBotManager.setDependencies(getAI, generateImage);
  telegramBotManager.start().catch((err) => {
    console.error("Telegram bot failed to start:", err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
