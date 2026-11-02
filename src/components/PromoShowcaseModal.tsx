import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Code2,
  Mic,
  Send,
  Award,
  Terminal,
  Zap,
  X,
  CheckCircle2,
  ArrowUp,
  MessageSquare,
  Plus,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText
} from "lucide-react";

interface PromoShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

const TOTAL_DURATION = 59.9; // exactly 59.9 seconds

export const PromoShowcaseModal: React.FC<PromoShowcaseModalProps> = ({
  isOpen,
  onClose,
  theme: appTheme,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [cleanMode, setCleanMode] = useState(false);

  // Simulated typing state
  const [typedPrompt, setTypedPrompt] = useState("");
  const [aiStreamedText, setAiStreamedText] = useState("");
  const [showCanvasInDemo, setShowCanvasInDemo] = useState(false);
  const [isMicActiveInDemo, setIsMicActiveInDemo] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const FULL_PROMPT = "OsonAI, menga O'zbekiston yoshlari uchun interaktiv veb dastur kodi va AI imkoniyatlarini ko'rsat";

  const FULL_AI_RESPONSE = `Assalomu alaykum! **OsonAI (Oson v2.55)** tizimiga xush kelibsiz.

Bizning platformamiz o'zbek tilida erkin muloqot qiladi va kodlarni nafaqat yozadi, balki **Live Code Canvas** orqali darhol jonli ishga tushirib beradi. Mana siz so'ragan interaktiv dastur:`;

  // Auto-scroll chat body smoothly to bottom as AI responds
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [aiStreamedText, isMicActiveInDemo, elapsedTime >= 50.0]);

  // Main playback loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 0.1;
          if (next >= TOTAL_DURATION) {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Sync animation states with elapsedTime
  useEffect(() => {
    // 0s - 6s: Initial zero-state screen
    if (elapsedTime < 6.0) {
      setTypedPrompt("");
      setAiStreamedText("");
      setShowCanvasInDemo(false);
      setIsMicActiveInDemo(false);
    }
    // 6s - 14s: Typing prompt into input
    else if (elapsedTime >= 6.0 && elapsedTime < 14.5) {
      const progress = (elapsedTime - 6.0) / 8.5;
      const charCount = Math.floor(progress * FULL_PROMPT.length);
      setTypedPrompt(FULL_PROMPT.slice(0, charCount));
      setAiStreamedText("");
      setShowCanvasInDemo(false);
      setIsMicActiveInDemo(false);
    }
    // 14.5s - 26s: Prompt sent, AI streaming response + code block
    else if (elapsedTime >= 14.5 && elapsedTime < 27.0) {
      setTypedPrompt(FULL_PROMPT);
      const progress = Math.min(1, (elapsedTime - 15.0) / 9.0);
      const charCount = Math.floor(progress * FULL_AI_RESPONSE.length);
      setAiStreamedText(FULL_AI_RESPONSE.slice(0, charCount));
      setShowCanvasInDemo(false);
      setIsMicActiveInDemo(false);
    }
    // 27s - 39s: Live Canvas clicked and open!
    else if (elapsedTime >= 27.0 && elapsedTime < 40.0) {
      setTypedPrompt(FULL_PROMPT);
      setAiStreamedText(FULL_AI_RESPONSE);
      setShowCanvasInDemo(true);
      setIsMicActiveInDemo(false);
    }
    // 40s - 49s: Canvas closed, Speech-to-Text & Telegram Bot active
    else if (elapsedTime >= 40.0 && elapsedTime < 50.0) {
      setShowCanvasInDemo(false);
      setIsMicActiveInDemo(true);
    }
    // 50s - 59.9s: Creator & Team showcase finale
    else if (elapsedTime >= 50.0) {
      setShowCanvasInDemo(false);
      setIsMicActiveInDemo(false);
    }
  }, [elapsedTime]);

  const togglePlay = () => {
    if (elapsedTime >= TOTAL_DURATION) {
      setElapsedTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setTypedPrompt("");
    setAiStreamedText("");
    setShowCanvasInDemo(false);
    setIsMicActiveInDemo(false);
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = 0;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Dynamic subtitle matching current second
  const getCurrentCaption = () => {
    if (elapsedTime < 6.5) {
      return "Tanishiring: OsonAI — o'zbek tilidagi ilk universal intellektual ekotizim!";
    } else if (elapsedTime < 14.5) {
      return "Foydalanuvchi o'z ona tilida istalgan topshiriq yoki dasturlash so'rovini yozadi...";
    } else if (elapsedTime < 27.0) {
      return "Oson v2.55 modeli o'zbek adabiy tilida chuqur mantiqli tahlil va tayyor kod taqdim etadi.";
    } else if (elapsedTime < 40.0) {
      return "Inqilobiy Live Code Canvas: kodni bir zumda brauzerda jonli dastur sifatida ishga tushirish!";
    } else if (elapsedTime < 50.0) {
      return "Moslashuvchan ovozli boshqaruv (STT) va 24/7 ishlovchi rasmiy Telegram bot (@osonaiuzbot).";
    } else {
      return "Loyiha muallifi: Yangi Namangan TIM o'quvchisi Anvarbek Muxiddinov va NamRobo jamoasi!";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 sm:p-3 overflow-hidden font-sans">
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className={`relative w-full max-w-6xl h-screen sm:h-[95vh] flex flex-col rounded-none sm:rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl transition-all ${
            isFullscreen ? "max-w-none h-screen rounded-none border-0" : ""
          } bg-[#0b0e17] text-white`}
        >
          {/* FLOATING CLEAN MODE TOGGLE BUTTON */}
          <button
            onClick={() => setCleanMode(!cleanMode)}
            className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 border border-cyan-500/30 text-cyan-400 text-xs flex items-center gap-1.5 backdrop-blur-md shadow-xl transition cursor-pointer"
            title={cleanMode ? "Boshqaruv tugmalarini ko'rsatish" : "Toza kadr (tugmalarni yashirish)"}
          >
            {cleanMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{cleanMode ? "Tugmalarni ko'rsatish" : "Toza Kadr (Yozib olish)"}</span>
          </button>

          {/* Top Control Bar (Hidden when cleanMode is on) */}
          {!cleanMode && (
            <div className="px-4 py-2 bg-[#101424] border-b border-cyan-500/20 flex items-center justify-between gap-3 shrink-0 text-xs">
              {/* Left: Indicator & Timer */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 ${isPlaying ? "animate-ping" : ""}`} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                  </span>
                  <span className="font-bold uppercase tracking-wider text-[11px] text-cyan-400">
                    OsonAI Jonli Demo
                  </span>
                </div>

                <div className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-black/50 text-emerald-400 border border-emerald-500/30 text-[11px]">
                  {elapsedTime.toFixed(1)}s / {TOTAL_DURATION}s
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {/* Download Standalone HTML file */}
                <a
                  href="/demo.html"
                  download="osonai-60s-demo.html"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Alohida mustaqil HTML fayl sifatida yuklab olish"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden md:inline">Demo HTML</span>
                </a>

                {/* Tezis PDF Download */}
                <a
                  href="/OsonAI_Tezis.pdf"
                  download="OsonAI_Tezis_Anvarbek_Muxiddinov.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="Loyiha ilmiy-amaliy tezisini PDF formatida yuklab olish"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Tezis (PDF)</span>
                </a>

                {/* Open in clean new tab */}
                <a
                  href="/demo.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition"
                  title="To'liq toza yangi oynada ochish"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden md:inline">Yangi oynada</span>
                </a>

                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
                    showCaptions
                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Titr: {showCaptions ? "ON" : "OFF"}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer"
                  title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran (F11)"}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition cursor-pointer"
                  title="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Time Progress Line */}
          <div className="w-full h-1 bg-slate-800/80 relative overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-100"
              style={{ width: `${(elapsedTime / TOTAL_DURATION) * 100}%` }}
            />
          </div>

          {/* REAL OSONAI INTERFACE SIMULATION */}
          <div className="flex-1 flex overflow-hidden w-full h-full bg-[#0e111d] relative text-slate-100">
            
            {/* 1. Left Sidebar */}
            <div className="w-60 border-r border-[#1a1f33] bg-[#070911] p-3 hidden md:flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/30">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm tracking-tight text-white">OsonAI</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">v2.55</span>
                  </div>
                </div>

                {/* New Chat Button */}
                <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 flex items-center gap-2 text-xs font-semibold">
                  <Plus className="w-4 h-4" />
                  <span>Yangi suhbat</span>
                </div>

                {/* Simulated Recent Chats */}
                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">Oxirgi suhbatlar</div>
                  <div className="p-2 rounded-lg bg-slate-800/50 text-cyan-300 font-medium flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">OsonAI & Yoshlar dasturlashi</span>
                  </div>
                  <div className="p-2 rounded-lg text-slate-400 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="truncate">Live Canvas HTML sandbox</span>
                  </div>
                  <div className="p-2 rounded-lg text-slate-400 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="truncate">Telegram bot sozlamalari</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer info */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>NamRobo TIM</span>
                  <span className="text-emerald-400 text-[10px]">● Online</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">Muallif: Anvarbek Muxiddinov</div>
              </div>
            </div>

            {/* 2. Main Chat Area */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#0c0f1c] relative">
              
              {/* Header inside simulated app */}
              <div className="h-12 border-b border-[#1b2035] px-4 flex items-center justify-between shrink-0 bg-[#090b16]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-xs text-slate-200">Oson v2.55 Modeli</span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">| O'zbek tili adabiy intellekti</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs flex items-center gap-1 font-semibold">
                    <Send className="w-3 h-3" />
                    <span>@osonaiuzbot</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                    O'zbekcha 🇺🇿
                  </div>
                </div>
              </div>

              {/* AUTO-SCROLLING CHAT CONTENT BODY */}
              <div
                ref={chatBodyRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scroll relative scroll-smooth"
              >
                {/* State A: Zero state (0s - 14.5s) */}
                {elapsedTime < 14.5 && (
                  <div className="max-w-xl mx-auto my-auto text-center space-y-4 py-8 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20 border border-cyan-400/30">
                      <Sparkles className="w-8 h-8 fill-current" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">OsonAI — Sun'iy Intellekt</h1>
                      <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                        O'zbek tilida erkin fikrlovchi, kod yozuvchi, ovoz bilan boshqariladigan universal platforma.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-left pt-2">
                      <div className="p-3 rounded-2xl border border-slate-800/80 bg-[#121526] text-xs">
                        <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Live Code Canvas</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">Kodni darhol jonli ishga tushirish</div>
                      </div>
                      <div className="p-3 rounded-2xl border border-slate-800/80 bg-[#121526] text-xs">
                        <div className="font-bold text-sky-400 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5" />
                          <span>Telegram Bot (@osonaiuzbot)</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">24/7 doimiy mobil yordamchi</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* State B: Active Chat (Prompt sent & AI response: 14.5s - 50s) */}
                {elapsedTime >= 14.5 && (
                  <div className="max-w-2xl mx-auto w-full space-y-4 animate-in fade-in duration-300">
                    {/* User Question */}
                    <div className="flex items-start gap-2.5 justify-end">
                      <div className="p-3.5 rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs sm:text-sm shadow-md max-w-md font-medium leading-relaxed">
                        {FULL_PROMPT}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] shrink-0 font-bold">
                        Siz
                      </div>
                    </div>

                    {/* AI Message */}
                    <div className="flex items-start gap-2.5 justify-start">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center text-xs shrink-0 font-black shadow-md shadow-cyan-500/30">
                        AI
                      </div>
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-[#131728] border border-cyan-500/30 text-xs sm:text-sm text-slate-200 space-y-3 max-w-lg shadow-xl">
                        <p className="leading-relaxed whitespace-pre-line text-slate-300 font-sans">
                          {aiStreamedText}
                        </p>

                        {/* Interactive Code block in AI response */}
                        {elapsedTime >= 20.0 && (
                          <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-[#090c16] font-mono text-xs shadow-inner animate-in fade-in duration-300">
                            <div className="px-3 py-1.5 bg-[#121627] border-b border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-cyan-400 font-bold">HTML / TAILWIND</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-400 font-sans">Tayyor kod</span>
                                {/* Live Preview Button */}
                                <div className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-bold flex items-center gap-1 transition ${
                                  elapsedTime >= 25.0
                                    ? "bg-cyan-500 text-slate-950 scale-105 shadow-md shadow-cyan-500/40"
                                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                }`}>
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Live Preview</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 text-[11px] text-slate-300 space-y-0.5 leading-relaxed">
                              <p><span className="text-purple-400">&lt;div</span> <span className="text-cyan-300">class</span>=<span className="text-emerald-300">"bg-cyan-500 text-white p-4"</span>&gt;</p>
                              <p className="pl-3">&lt;h1&gt;Namangan TIM — Yosh Ixtirochilar&lt;/h1&gt;</p>
                              <p className="pl-3">&lt;button onclick="boshla()"&gt;Hisoblash&lt;/button&gt;</p>
                              <p>&lt;/div&gt;</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* State C: Speech-to-Text Live Demonstration (40s - 49s) */}
                {isMicActiveInDemo && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl mx-auto w-full p-4 rounded-2xl border border-cyan-500/40 bg-[#12182c] shadow-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-rose-500 text-white animate-pulse">
                          <Mic className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-white">Jonli Ovozli Kiritish (Speech-to-Text)</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">Nutq aniqlandi (76%)</span>
                    </div>

                    {/* Soundwaves */}
                    <div className="flex items-end justify-between h-9 gap-1 px-3 py-1 bg-black/50 rounded-xl">
                      {[35, 70, 95, 60, 90, 100, 75, 45, 85, 95, 65, 40].map((val, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gradient-to-t from-cyan-500 to-emerald-400 rounded-full animate-pulse"
                          style={{ height: `${val}%`, animationDelay: `${idx * 0.08}s` }}
                        />
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-300 italic bg-black/30 p-2 rounded-lg">
                      «OsonAI, robototexnika algoritmini hisoblab ber...»
                    </div>
                  </motion.div>
                )}

                {/* State D: Creator & NamRobo Team Finale (50s - 59.9s) */}
                {elapsedTime >= 50.0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-lg mx-auto text-center space-y-3 p-5 rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-[#151c33] to-[#0c101c] shadow-2xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-400/30">
                      <Award className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Loyiha Asoschisi va Jamoasi</div>
                      <h3 className="text-2xl font-black text-white mt-0.5">Anvarbek Muxiddinov</h3>
                      <p className="text-xs text-slate-300 mt-0.5">Yangi Namangan tumani ixtisoslashtirilgan maktabi (TIM)</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1 text-xs">
                      <span className="px-3 py-1 rounded-xl bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">NamRobo Jamoasi</span>
                      <span className="px-3 py-1 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 font-mono font-semibold">@osonaiuzbot</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Bottom Simulated Input Bar */}
              <div className="p-3 border-t border-[#1c2136] bg-[#0c0f1c] shrink-0">
                <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-2xl bg-[#141829] border border-[#252b45] p-2">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                    <Mic className={`w-4 h-4 ${isMicActiveInDemo ? "text-rose-400 animate-pulse" : ""}`} />
                  </div>
                  
                  {/* Real-time typing display */}
                  <div className="flex-1 text-xs text-slate-200 overflow-hidden truncate">
                    {typedPrompt ? (
                      <span className="font-medium">
                        {typedPrompt}
                        {elapsedTime < 14.5 && <span className="inline-block w-1.5 h-3 ml-0.5 bg-cyan-400 animate-pulse align-middle" />}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">OsonAI ga savol yoki topshiriq bering...</span>
                    )}
                  </div>

                  <div className={`p-2 rounded-xl transition ${
                    elapsedTime >= 13.5 && elapsedTime < 15.0
                      ? "bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/50"
                      : "bg-cyan-500 text-slate-950"
                  }`}>
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* LIVE CODE CANVAS SANDBOX OVERLAY (27s - 39s) */}
              <AnimatePresence>
                {showCanvasInDemo && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="absolute inset-4 z-40 rounded-2xl border border-cyan-500/40 bg-[#0d101d]/98 backdrop-blur-md flex flex-col overflow-hidden shadow-2xl"
                  >
                    {/* Sandbox Header */}
                    <div className="px-4 py-2 bg-[#14182b] border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white">Live Code Canvas Sandbox</span>
                        <span className="text-[10px] px-1.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">HTML + JS</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        ⚡ Real-time Execution
                      </span>
                    </div>

                    {/* Split View */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
                      {/* Code */}
                      <div className="p-4 border-r border-slate-800 bg-[#080a12] font-mono text-[11px] text-slate-300 leading-relaxed overflow-hidden">
                        <div className="text-slate-500 pb-2">// Jonli tahrirlash oynasi:</div>
                        <p><span className="text-purple-400">&lt;div</span> <span className="text-cyan-300">class</span>=<span className="text-emerald-300">"p-6 bg-slate-900 rounded-2xl"</span>&gt;</p>
                        <p className="pl-4 text-cyan-200">&lt;h2&gt;Namangan TIM — Yosh Ixtirochilar&lt;/h2&gt;</p>
                        <p className="pl-4 text-slate-300">&lt;p&gt;OsonAI Live Sandbox orqali ishlamoqda&lt;/p&gt;</p>
                        <p className="pl-4 text-emerald-300">&lt;button class="btn-cyan"&gt;Sinash&lt;/button&gt;</p>
                        <p><span className="text-purple-400">&lt;/div&gt;</span></p>
                      </div>

                      {/* Live rendered preview */}
                      <div className="p-6 bg-gradient-to-br from-[#101424] to-[#0a0d18] flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20">
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-base text-white">Namangan TIM — Yosh Ixtirochilar</h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                          Kod brauzerning o'zida jonli render bo'ldi. Boshqa dastur ochish shart emas!
                        </p>
                        <button className="mt-3.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30">
                          Interaktiv Natija
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* DYNAMIC TIMED SUBTITLES BANNER */}
          {showCaptions && !cleanMode && (
            <div className="px-4 py-2 bg-black/85 border-t border-cyan-500/20 text-center shrink-0">
              <p className="text-xs sm:text-sm font-semibold text-cyan-200 leading-snug">
                "{getCurrentCaption()}"
              </p>
            </div>
          )}

          {/* Bottom Playback Toolbar (Hidden when cleanMode is on) */}
          {!cleanMode && (
            <div className="px-4 py-2.5 bg-[#101424] border-t border-cyan-500/20 flex items-center justify-between gap-3 shrink-0">
              {/* Play/Pause */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? "To'xtatish" : "Jonli Demonu Boshlash (Play)"}</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Boshidan boshlash"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Screen Record Advice */}
              <div className="text-[11px] text-slate-400 hidden sm:block">
                💡 <b>Toza yozish:</b> "Toza Kadr" tugmasini bosing va ekranni yozib oling!
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setElapsedTime(0)}
                  className={`px-2 py-1 rounded-lg border transition ${elapsedTime < 14 ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  1. Kirish
                </button>
                <button
                  onClick={() => setElapsedTime(15)}
                  className={`px-2 py-1 rounded-lg border transition ${elapsedTime >= 14 && elapsedTime < 27 ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  2. Chat & AI
                </button>
                <button
                  onClick={() => setElapsedTime(28)}
                  className={`px-2 py-1 rounded-lg border transition ${elapsedTime >= 27 && elapsedTime < 40 ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  3. Canvas
                </button>
                <button
                  onClick={() => setElapsedTime(41)}
                  className={`px-2 py-1 rounded-lg border transition ${elapsedTime >= 40 && elapsedTime < 50 ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  4. Ovoz/Bot
                </button>
                <button
                  onClick={() => setElapsedTime(51)}
                  className={`px-2 py-1 rounded-lg border transition ${elapsedTime >= 50 ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "bg-slate-800 text-slate-400 border-slate-700"}`}
                >
                  5. Jamoa
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
