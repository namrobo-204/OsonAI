// Smart Multilingual Speech Detection and Synthesis Utility

export interface DetectedLang {
  code: string;       // e.g. "uz-UZ", "en-US", "ru-RU"
  shortCode: "uz" | "en" | "ru" | "other";
  name: string;       // "O'zbekcha", "English", "Русский"
  flag: string;       // "🇺🇿", "🇺🇸", "🇷🇺"
}

export function detectTextLanguage(text: string): DetectedLang {
  const sample = text.slice(0, 1000).toLowerCase();

  // Check Cyrillic (Russian)
  const cyrillicMatches = sample.match(/[\u0400-\u04FF]/g) || [];
  if (cyrillicMatches.length > 15 || cyrillicMatches.length / (sample.length || 1) > 0.3) {
    return {
      code: "ru-RU",
      shortCode: "ru",
      name: "Русский",
      flag: "🇷🇺"
    };
  }

  // Check English markers
  const englishWords = [
    "the", "is", "are", "and", "to", "for", "with", "this", "that",
    "from", "you", "have", "not", "but", "what", "can", "will", "your",
    "here", "import", "function", "const", "return", "class", "async", "await", "please", "error"
  ];
  
  // Uzbek specific markers
  const uzbekPatterns = [
    "o'", "g'", "o‘", "g‘", "o’", "g’", "sh", "ch", "q", "x", "h"
  ];
  const uzbekWords = [
    "va", "uchun", "bilan", "ham", "bu", "kerak", "bo'lgan", "qilish",
    "qanday", "nima", "dastur", "masalan", "foydalanuvchi", "orqali",
    "xatolik", "tizim", "yaratilgan", "mumkin", "emas", "bo'ladi", "ushbu"
  ];

  const words = sample.replace(/[^a-z0-9'\s]/g, " ").split(/\s+/).filter(Boolean);
  
  let engWordCount = 0;
  let uzbWordCount = 0;

  for (const w of words) {
    if (englishWords.includes(w)) engWordCount++;
    if (uzbekWords.includes(w)) uzbWordCount++;
  }

  // Count Uzbek specific apostrophe characters
  const apostropheCount = (sample.match(/[og][`'’‘]/g) || []).length;
  uzbWordCount += apostropheCount * 2;

  if (engWordCount > uzbWordCount + 2 && engWordCount >= 3) {
    return {
      code: "en-US",
      shortCode: "en",
      name: "English",
      flag: "🇺🇸"
    };
  }

  return {
    code: "uz-UZ",
    shortCode: "uz",
    name: "O'zbekcha",
    flag: "🇺🇿"
  };
}

export function playSpeech(
  text: string, 
  onStart: (lang: DetectedLang) => void, 
  onEnd: () => void,
  onError: () => void
) {
  if (!("speechSynthesis" in window)) {
    alert("Brauzeringiz ovozli o'qish (Speech Synthesis) texnologiyasini qo'llab-quvvatlamaydi.");
    onError();
    return;
  }

  window.speechSynthesis.cancel();

  // Clean code blocks and markdown symbols
  const cleanText = text
    .replace(/```[\s\S]*?```/g, " kod bloki. ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/[*#`~_]/g, "")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanText) {
    onEnd();
    return;
  }

  const detected = detectTextLanguage(cleanText);
  onStart(detected);

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = detected.code;

  const voices = window.speechSynthesis.getVoices();

  if (detected.shortCode === "en") {
    // Pick authentic English voice
    const enVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("David") || v.name.includes("Daniel") || v.name.includes("US") || v.name.includes("GB"))
    ) || voices.find(v => v.lang.toLowerCase().startsWith("en"));
    if (enVoice) utterance.voice = enVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
  } else if (detected.shortCode === "ru") {
    // Pick Russian voice
    const ruVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith("ru") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Milena") || v.name.includes("Russian"))
    ) || voices.find(v => v.lang.toLowerCase().startsWith("ru"));
    if (ruVoice) utterance.voice = ruVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
  } else {
    // Uzbek / Turkic language voice
    // Check if uz-UZ voice is installed
    const uzVoice = voices.find(v => v.lang.toLowerCase().includes("uz"));
    const trVoice = voices.find(v => v.lang.toLowerCase().startsWith("tr"));
    
    if (uzVoice) {
      utterance.voice = uzVoice;
    } else if (trVoice) {
      // Turkish phonetic system is very close to Uzbek Latin
      utterance.voice = trVoice;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
  }

  utterance.onend = () => {
    onEnd();
  };

  utterance.onerror = (e) => {
    console.warn("Speech error:", e);
    onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
