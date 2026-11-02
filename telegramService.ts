import { GoogleGenAI } from "@google/genai";

interface ChatMemoryMessage {
  role: "user" | "model";
  text: string;
}

export interface TelegramBotStatus {
  isRunning: boolean;
  botUsername: string;
  botFirstName: string;
  botId: number | null;
  messagesCount: number;
  usersCount: number;
  startTime: number;
  lastActive: number | null;
  lastError: string | null;
}

const DEFAULT_BOT_TOKEN = "8953939193:AAE16sAkBqHLYiKLJ4pk8kdBDgX98-mKbww";

function resolveTelegramToken(): string {
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (envToken && /^\d+:[A-Za-z0-9_-]{30,}$/.test(envToken)) {
    return envToken;
  }
  return DEFAULT_BOT_TOKEN;
}

const REQUIRED_CHANNELS = [
  { username: "namtim_robo", name: "NamRobo", url: "https://t.me/namtim_robo" },
  { username: "yanginamangantim", name: "Yangi Namangan TIM", url: "https://t.me/yanginamangantim" }
];

class TelegramBotManager {
  private token: string;
  private isPolling = false;
  private abortController: AbortController | null = null;
  private botInfo: { id: number; username: string; first_name: string } | null = null;
  private messageHistory: Map<number, ChatMemoryMessage[]> = new Map();
  private uniqueUsers: Set<number> = new Set();
  private verifiedUsers: Set<number> = new Set();
  private messagesCount = 0;
  private startTime = Date.now();
  private lastActive: number | null = null;
  private lastError: string | null = null;
  private getAI: (() => GoogleGenAI) | null = null;
  private generateImageFn: ((prompt: string) => Promise<string>) | null = null;

  constructor() {
    this.token = resolveTelegramToken();
  }

  public setDependencies(getAI: () => GoogleGenAI, generateImageFn: (prompt: string) => Promise<string>) {
    this.getAI = getAI;
    this.generateImageFn = generateImageFn;
  }

  public getStatus(): TelegramBotStatus {
    return {
      isRunning: this.isPolling,
      botUsername: this.botInfo?.username || "osonaiuzbot",
      botFirstName: this.botInfo?.first_name || "OsonAI Bot",
      botId: this.botInfo?.id || null,
      messagesCount: this.messagesCount,
      usersCount: this.uniqueUsers.size,
      startTime: this.startTime,
      lastActive: this.lastActive,
      lastError: this.lastError
    };
  }

  private get apiUrl(): string {
    return `https://api.telegram.org/bot${this.token}`;
  }

  private get webAppUrl(): string {
    return process.env.APP_URL || "https://ais-pre-tg2ojrjaiuluhumeooriuq-1079246568503.asia-southeast1.run.app";
  }

  private async callApi(method: string, payload: Record<string, any> = {}): Promise<any> {
    const res = await fetch(`${this.apiUrl}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  public async sendChatAction(chatId: number, action: "typing" | "upload_photo" = "typing") {
    try {
      await this.callApi("sendChatAction", { chat_id: chatId, action });
    } catch {
      // Ignore chat action errors
    }
  }

  public async sendMessage(chatId: number, text: string, replyMarkup?: any): Promise<void> {
    const MAX_CHUNK = 3900;
    if (text.length <= MAX_CHUNK) {
      await this.sendSingleMessage(chatId, text, replyMarkup);
      return;
    }

    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHUNK) {
        await this.sendSingleMessage(chatId, remaining, replyMarkup);
        break;
      }

      let splitIdx = remaining.lastIndexOf("\n\n", MAX_CHUNK);
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = remaining.lastIndexOf("\n", MAX_CHUNK);
      }
      if (splitIdx === -1 || splitIdx < 1000) {
        splitIdx = remaining.lastIndexOf(". ", MAX_CHUNK);
      }
      if (splitIdx === -1) {
        splitIdx = MAX_CHUNK;
      }

      const chunk = remaining.slice(0, splitIdx).trim();
      remaining = remaining.slice(splitIdx).trim();

      if (chunk) {
        await this.sendSingleMessage(chatId, chunk);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  private async sendSingleMessage(chatId: number, text: string, replyMarkup?: any): Promise<void> {
    try {
      const res = await this.callApi("sendMessage", {
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup
      });

      if (!res.ok) {
        // Fallback to plain text if markdown format fails
        await this.callApi("sendMessage", {
          chat_id: chatId,
          text: text,
          reply_markup: replyMarkup
        });
      }
    } catch (err: any) {
      console.warn("Telegram sendMessage error:", err?.message || err);
      try {
        await this.callApi("sendMessage", {
          chat_id: chatId,
          text: text,
          reply_markup: replyMarkup
        });
      } catch (innerErr) {
        console.error("Fatal sendMessage failure:", innerErr);
      }
    }
  }

  public async sendPhoto(chatId: number, photoUrlOrBase64: string, caption?: string): Promise<void> {
    try {
      if (photoUrlOrBase64.startsWith("data:image")) {
        const base64Data = photoUrlOrBase64.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        
        const formData = new FormData();
        formData.append("chat_id", String(chatId));
        formData.append("photo", new Blob([buffer], { type: "image/jpeg" }), "image.jpg");
        if (caption) {
          formData.append("caption", caption.slice(0, 1024));
          formData.append("parse_mode", "Markdown");
        }

        await fetch(`${this.apiUrl}/sendPhoto`, {
          method: "POST",
          body: formData,
        });
      } else {
        await this.callApi("sendPhoto", {
          chat_id: chatId,
          photo: photoUrlOrBase64,
          caption: caption ? caption.slice(0, 1024) : undefined,
          parse_mode: "Markdown"
        });
      }
    } catch (err) {
      console.error("Failed to send photo to Telegram:", err);
      if (caption) {
        await this.sendMessage(chatId, `${caption}\n\n[Rasm havolasi: ${photoUrlOrBase64}]`);
      }
    }
  }

  // Check channel subscription for a user
  private async isUserSubscribed(userId: number): Promise<boolean> {
    if (this.verifiedUsers.has(userId)) {
      return true;
    }

    let allJoined = true;
    let anyChecked = false;

    for (const ch of REQUIRED_CHANNELS) {
      try {
        const res = await this.callApi("getChatMember", {
          chat_id: `@${ch.username}`,
          user_id: userId
        });

        if (res.ok && res.result) {
          anyChecked = true;
          const status = res.result.status;
          const isMember = ["creator", "administrator", "member", "restricted"].includes(status);
          if (!isMember) {
            allJoined = false;
            break;
          }
        }
      } catch {
        // network issue or chat inaccessible
      }
    }

    if (anyChecked && allJoined) {
      this.verifiedUsers.add(userId);
      return true;
    }

    return false;
  }

  // Send channel subscription prompt with inline buttons
  private async sendSubscriptionPrompt(chatId: number): Promise<void> {
    const text = `Botdan foydalanish uchun rasmiy kanallarga a'zo bo'ling:\n\n` +
      `1. @namtim_robo (NamRobo)\n` +
      `2. @yanginamangantim (Yangi Namangan TIM)\n\n` +
      `A'zo bo'lgach, "Obunani tekshirish" tugmasini bosing:`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "1. NamRobo kanaliga a'zo bo'lish", url: "https://t.me/namtim_robo" }
        ],
        [
          { text: "2. Yangi Namangan TIM kanaliga a'zo bo'lish", url: "https://t.me/yanginamangantim" }
        ],
        [
          { text: "✅ Obunani tekshirish", callback_data: "check_subscription" }
        ]
      ]
    };

    await this.sendMessage(chatId, text, replyMarkup);
  }

  public async start(): Promise<void> {
    if (this.isPolling) return;

    if (!this.token) {
      console.warn("Telegram Bot token not provided. Bot not started.");
      return;
    }

    try {
      const meRes = await this.callApi("getMe");
      if (!meRes.ok || !meRes.result) {
        this.lastError = `Bot verification failed: ${meRes.description || "Unknown error"}`;
        console.error("Telegram bot getMe error:", this.lastError);
        return;
      }

      this.botInfo = meRes.result;
      console.log(`🤖 Telegram Bot connected: @${this.botInfo?.username} (${this.botInfo?.first_name})`);

      // Set native slash commands list on Telegram
      try {
        await this.callApi("setMyCommands", {
          commands: [
            { command: "new", description: "Yangi suhbat (xotirani tozalash)" },
            { command: "image", description: "Rasm yaratish (/image so'rov)" },
            { command: "web", description: "Ko'proq funksiyalar (veb-sayt)" },
            { command: "help", description: "Buyruqlar va yordam" },
            { command: "start", description: "Botni ishga tushirish" }
          ]
        });
        console.log("Telegram slash commands registered successfully.");
      } catch (cmdErr) {
        console.warn("Failed to register commands:", cmdErr);
      }

      // Ensure bot profile avatar is set with OsonAI favicon
      try {
        await this.setBotProfilePhoto();
      } catch (photoErr) {
        console.warn("Auto-setting bot avatar warning:", photoErr);
      }

      // Ensure no active webhook conflicts with getUpdates
      await this.callApi("deleteWebhook", { drop_pending_updates: false });

      this.isPolling = true;
      this.abortController = new AbortController();
      this.runPollingLoop();
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      console.error("Error starting Telegram bot:", err);
    }
  }

  public async setBotProfilePhoto(imagePath?: string): Promise<boolean> {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const resolvedPath = imagePath || path.join(process.cwd(), "public", "osonai-avatar.jpg");
      if (!fs.existsSync(resolvedPath)) {
        console.warn("Avatar image file not found at:", resolvedPath);
        return false;
      }
      const buffer = fs.readFileSync(resolvedPath);
      const formData = new FormData();
      formData.append("photo", JSON.stringify({ type: "static", photo: "attach://photo_file" }));
      formData.append("photo_file", new Blob([buffer], { type: "image/jpeg" }), "avatar.jpg");

      const res = await fetch(`${this.apiUrl}/setMyProfilePhoto`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Telegram setMyProfilePhoto result:", data);
      return !!data?.ok;
    } catch (e) {
      console.warn("Could not set bot profile photo:", e);
      return false;
    }
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isPolling = false;
    console.log("Telegram bot stopped.");
  }

  private async runPollingLoop(): Promise<void> {
    let offset = 0;

    while (this.isPolling) {
      try {
        const response = await fetch(`${this.apiUrl}/getUpdates?offset=${offset}&timeout=20&limit=25`, {
          signal: this.abortController?.signal
        });

        if (response.status === 409) {
          // Transient overlap during restart or test query, wait and retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        if (data.ok && Array.isArray(data.result)) {
          this.lastError = null;
          for (const update of data.result) {
            offset = update.update_id + 1;
            this.handleUpdate(update).catch((err) => {
              console.error("Error handling telegram update:", err);
            });
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          break;
        }
        this.lastError = err?.message || String(err);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  private async handleUpdate(update: any): Promise<void> {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
    }
  }

  private async handleCallbackQuery(cb: any): Promise<void> {
    const chatId = cb.message?.chat?.id;
    const userId = cb.from?.id;
    const data = cb.data;
    if (!chatId || !userId) return;

    try {
      if (data === "check_subscription") {
        let allJoined = true;
        let checkedAny = false;

        for (const ch of REQUIRED_CHANNELS) {
          try {
            const res = await this.callApi("getChatMember", {
              chat_id: `@${ch.username}`,
              user_id: userId
            });

            if (res.ok && res.result) {
              checkedAny = true;
              const status = res.result.status;
              if (!["creator", "administrator", "member", "restricted"].includes(status)) {
                allJoined = false;
                break;
              }
            }
          } catch {
            // channel check error
          }
        }

        if (checkedAny && !allJoined) {
          await this.callApi("answerCallbackQuery", {
            callback_query_id: cb.id,
            text: "Siz hali ikkala kanalga ham a'zo bo'lmadingiz. Iltimos, a'zo bo'lib qayta urinib ko'ring.",
            show_alert: true
          });
          return;
        }

        // Mark user verified
        this.verifiedUsers.add(userId);
        await this.callApi("answerCallbackQuery", {
          callback_query_id: cb.id,
          text: "Obuna tasdiqlandi!"
        });

        const welcomeText = `Obuna tasdiqlandi.\n\n` +
          `Savolingiz yoki topshirig'ingizni yozishingiz mumkin.\n\n` +
          `💡 Ko'proq funksiyalar (Live Canvas, Gems, Loyihalar va fayllar tahlili) veb-saytda:\n${this.webAppUrl}`;

        await this.sendMessage(chatId, welcomeText);
      }
    } catch (e) {
      console.error("Callback query error:", e);
    }
  }

  private async sendStartMessage(chatId: number): Promise<void> {
    const text = `Assalomu alaykum.\nOsonAI intellektual tizimiga xush kelibsiz.\n\n` +
      `Savolingiz yoki topshirig'ingizni yozishingiz mumkin.\n\n` +
      `💡 Ko'proq funksiyalar (Live Canvas, Gems, Loyihalar va fayllar tahlili) veb-saytda:\n${this.webAppUrl}`;

    await this.sendMessage(chatId, text);
  }

  private async sendHelpMessage(chatId: number): Promise<void> {
    const helpText = `Mavjud buyruqlar:\n\n` +
      `/new — Yangi suhbat boshlash (xotirani tozalash)\n` +
      `/image <so'rov> — Rasm yaratish (masalan: /image quyosh botishi)\n` +
      `/web — OsonAI veb-platformasi\n` +
      `/help — Buyruqlar ro'yxati\n` +
      `/start — Botni ishga tushirish\n\n` +
      `Shunchaki matn yuborsangiz — savolingizga javob beraman.\n` +
      `Rasm yuborsangiz — rasmni tahlil qilib beraman.\n\n` +
      `💡 Ko'proq funksiyalar (Live Canvas, Gems, Loyihalar va fayllar tahlili) veb-saytda:\n${this.webAppUrl}`;

    await this.sendMessage(chatId, helpText);
  }

  private async handleMessage(msg: any): Promise<void> {
    const chatId = msg.chat?.id;
    const userId = msg.from?.id;
    const text = (msg.text || msg.caption || "").trim();

    if (!chatId || !userId) return;

    this.lastActive = Date.now();
    this.messagesCount++;
    this.uniqueUsers.add(userId);

    // Mandatory channel subscription verification
    const isSubscribed = await this.isUserSubscribed(userId);
    if (!isSubscribed) {
      await this.sendSubscriptionPrompt(chatId);
      return;
    }

    // Commands
    if (text === "/start") {
      await this.sendStartMessage(chatId);
      return;
    }

    if (text === "/help") {
      await this.sendHelpMessage(chatId);
      return;
    }

    if (text === "/new" || text === "/reset" || text === "/tozalash") {
      this.messageHistory.delete(chatId);
      await this.sendMessage(chatId, "Suhbat xotirasi tozalandi. Yangi savolingizni yozishingiz mumkin.");
      return;
    }

    if (text === "/web") {
      const webText = `OsonAI to'liq veb-platformasi:\n${this.webAppUrl}\n\n` +
        `Veb-saytda mavjud qo'shimcha imkoniyatlar:\n` +
        `• Live Canvas — Kodni jonli muharrirda yozish va ishga tushirish\n` +
        `• Gems — Ixtisoslashgan shaxsiy AI yordamchilar\n` +
        `• Loyihalar — Katta fayllar va bilimlar bazasi bilan ishlash\n` +
        `• Multilingual Speech — Javoblarni ovozli tinglash\n` +
        `• Mindmap — Tushunchalar va mavzular xaritasi\n\n` +
        `👉 Ko'proq funksiyalar veb-saytda: ${this.webAppUrl}`;
      await this.sendMessage(chatId, webText);
      return;
    }

    if (text === "/info" || text === "/status") {
      const uptimeMin = Math.floor((Date.now() - this.startTime) / 60000);
      const statusText = `OsonAI Bot Holati:\n\n` +
        `Model: Oson v2.55\n` +
        `Qayta ishlangan xabarlar: ${this.messagesCount}\n` +
        `Foydalanuvchilar: ${this.uniqueUsers.size}\n` +
        `Ish vaqti: ${uptimeMin} daqiqa\n\n` +
        `Ko'proq funksiyalar veb-saytda: ${this.webAppUrl}`;
      await this.sendMessage(chatId, statusText);
      return;
    }

    // Handle image creation: /image <prompt> or /rasm <prompt>
    const isImageCmd = text.startsWith("/image ") || text.startsWith("/rasm ") || text === "/image" || text === "/rasm";
    const imageKeywords = ["rasm chiz", "rasm yarat", "surat chiz", "chizib ber", "rasmini chiz", "generate image", "draw picture"];
    const isDirectImageText = imageKeywords.some((kw) => text.toLowerCase().includes(kw));

    if (isImageCmd || (isDirectImageText && !msg.photo)) {
      let prompt = text.replace(/^\/(image|rasm)\s*/i, "").trim();
      if (!prompt) {
        await this.sendMessage(chatId, "Rasm yaratish uchun so'rov matnini kiriting.\nMasalan: /image quyosh botishidagi qorli tog'lar");
        return;
      }

      await this.sendChatAction(chatId, "upload_photo");

      try {
        if (this.generateImageFn) {
          const result = await this.generateImageFn(prompt);
          const match = result.match(/!\[.*?\]\((.*?)\)/);
          if (match && match[1]) {
            await this.sendPhoto(chatId, match[1], prompt);
            return;
          }
        }

        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        await this.sendPhoto(chatId, fallbackUrl, prompt);
      } catch (err: any) {
        console.error("Image generation in Telegram failed:", err);
        await this.sendMessage(chatId, `Rasm yaratishda xatolik yuz berdi: ${err?.message || "Xizmat band"}`);
      }
      return;
    }

    // Handle user photo message (Vision analysis)
    if (msg.photo && Array.isArray(msg.photo) && msg.photo.length > 0) {
      await this.handlePhotoAnalysis(chatId, msg);
      return;
    }

    // Direct conversational message with Gemini
    if (text) {
      await this.handleGeminiChat(chatId, text);
    }
  }

  private async handlePhotoAnalysis(chatId: number, msg: any): Promise<void> {
    await this.sendChatAction(chatId, "typing");
    const bestPhoto = msg.photo[msg.photo.length - 1];
    const fileId = bestPhoto.file_id;
    const userPrompt = (msg.caption || "").trim() || "Ushbu rasmni batafsil ko'rib chiqib, unda nima tasvirlanganini aniq tushuntiring.";

    try {
      const fileInfo = await this.callApi("getFile", { file_id: fileId });
      if (!fileInfo.ok || !fileInfo.result?.file_path) {
        throw new Error("Rasm faylini yuklab bo'lmadi.");
      }

      const fileDownloadUrl = `https://api.telegram.org/file/bot${this.token}/${fileInfo.result.file_path}`;
      const imgRes = await fetch(fileDownloadUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");

      if (!this.getAI) {
        throw new Error("AI xizmati mavjud emas.");
      }

      const systemInstruction = "Siz - 'OsonAI' universal sun'iy intellekt tizimisiz. Sizning modelingiz nomi: 'Oson v2.55'. Foydalanuvchi yuborgan rasmlarni professional, aniq va ortiqcha bezaklarsiz o'zbek tilida tahlil qilib berasiz.";

      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              },
              { text: userPrompt }
            ]
          }
        ],
        config: { systemInstruction }
      });

      const reply = response.text || "Rasmni tahlil qilishda javob olinmadi.";
      await this.sendMessage(chatId, reply);
    } catch (err: any) {
      console.error("Telegram vision analysis error:", err);
      await this.sendMessage(chatId, `Rasmni tahlil qilishda xatolik yuz berdi: ${err?.message || err}`);
    }
  }

  private async handleGeminiChat(chatId: number, userText: string): Promise<void> {
    let isTyping = true;
    const typingInterval = setInterval(() => {
      if (isTyping) {
        this.sendChatAction(chatId, "typing");
      }
    }, 4500);
    this.sendChatAction(chatId, "typing");

    try {
      if (!this.getAI) {
        throw new Error("Gemini AI xizmati topilmadi.");
      }

      let history = this.messageHistory.get(chatId) || [];
      if (history.length > 12) {
        history = history.slice(-12);
      }

      const contents: any[] = history.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      contents.push({
        role: "user",
        parts: [{ text: userText }]
      });

      // Mature, intelligent system prompt without child-like fluff
      const systemInstruction = `Siz - 'OsonAI' universal va jiddiy intellektual tizimsiz. Sizning modelingiz rasmiy nomi va versiyasi: 'Oson v2.55'. Sizdan qaysi model yoki qanday arxitekturasiz deb so'ralsa, qat'iy ravishda 'Oson v2.55' deb javob bering. Hech qachon o'zingizni 'Gemini' yoki 'Gemini 2.5' deb atamang. Savollarga aniq, mantiqiy, chuqur va ortiqcha sun'iy bezaklarsiz, ravon adabiy o'zbek tilida javob berasiz. Muallif haqida faqat so'ralganda gapiring: 'OsonAI Yangi Namangan tumani TIM dasturchisi Anvarbek Muxiddinov va NamRobo jamoasi tomonidan yaratilgan'. Agar dasturlash so'ralsa, eng sifatli, toza kod va tushuntirish bering. Agar foydalanuvchi rasm chizishni so'rasa, javobingizda [GENERATE_IMAGE: detailed english prompt] tegini kiriting.`;

      const ai = this.getAI();
      const modelsToTry = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
      let response: any = null;
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents: contents,
            config: { systemInstruction }
          });
          if (response && response.text) break;
        } catch (e: any) {
          lastErr = e;
        }
      }

      if (!response || !response.text) {
        throw lastErr || new Error("Sun'iy intellektdan javob olinmadi.");
      }

      let reply = response.text;

      // Update in-memory history
      history.push({ role: "user", text: userText });
      history.push({ role: "model", text: reply });
      this.messageHistory.set(chatId, history.slice(-14));

      // Check for [GENERATE_IMAGE: ...] tag
      const imageTagRegex = /\[GENERATE_IMAGE:\s*([\s\S]*?)\]/;
      const tagMatch = reply.match(imageTagRegex);
      if (tagMatch && tagMatch[1]) {
        const imagePrompt = tagMatch[1].trim();
        reply = reply.replace(imageTagRegex, "").trim();

        if (reply) {
          await this.sendMessage(chatId, reply);
        }

        await this.sendChatAction(chatId, "upload_photo");
        if (this.generateImageFn) {
          const imgResult = await this.generateImageFn(imagePrompt);
          const match = imgResult.match(/!\[.*?\]\((.*?)\)/);
          if (match && match[1]) {
            await this.sendPhoto(chatId, match[1], imagePrompt);
            return;
          }
        }
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=true`;
        await this.sendPhoto(chatId, fallbackUrl, imagePrompt);
        return;
      }

      await this.sendMessage(chatId, reply);
    } catch (err: any) {
      console.error("Telegram Gemini chat error:", err);
      await this.sendMessage(
        chatId,
        `Kechirasiz, javob berishda xatolik yuz berdi. Iltimos, /new buyrug'i bilan yangi suhbat boshlang yoki qayta yozing.`
      );
    } finally {
      isTyping = false;
      clearInterval(typingInterval);
    }
  }
}

export const telegramBotManager = new TelegramBotManager();
