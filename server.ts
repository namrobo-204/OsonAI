import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Xabar kiritilmadi" });
    }

    // Format chat contents for GenAI
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: "Siz - 'OsonAI' (ChatGPT, Gemini, Claude muqobili bo'lgan) o'zbek tilidagi eng aqlli, tezkor va samimiy virtual yordamchisiz. Foydalanuvchilarning barcha sohalardagi (dasturlash, fan, tarix, biznes, ijodkorlik, rejalashtirish, tarjima va boshqalar) savollariga mukammal, tushunarli, aniq va chiroyli tartiblangan javoblar berasiz. Agar kod yozsangiz, uni markdown (```code blocks) formatida bering."
        }
      });
    } catch (e: any) {
      console.log("Model fallback triggered. Error: ", e.message || e);
      response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
        config: {
          systemInstruction: "Siz - 'OsonAI' (ChatGPT, Gemini, Claude muqobili bo'lgan) o'zbek tilidagi eng aqlli, tezkor va samimiy virtual yordamchisiz. Foydalanuvchilarning barcha sohalardagi (dasturlash, fan, tarix, biznes, ijodkorlik, rejalashtirish, tarjima va boshqalar) savollariga mukammal, tushunarli, aniq va chiroyli tartiblangan javoblar berasiz. Agar kod yozsangiz, uni markdown (```code blocks) formatida bering."
        }
      });
    }

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Serverda muammo yuz berdi: " + (error.message || error) });
  }
});

async function startServer() {
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
