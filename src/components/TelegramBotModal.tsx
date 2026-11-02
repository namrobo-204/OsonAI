import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Check,
  Copy,
  ExternalLink,
  Bot,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Code2,
  RefreshCw,
  Zap,
  ShieldCheck,
  Smartphone,
  Cpu
} from "lucide-react";

interface TelegramBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}

interface BotStatus {
  isRunning: boolean;
  botUsername: string;
  botFirstName: string;
  messagesCount: number;
  usersCount: number;
  startTime: number;
  lastActive: number | null;
  lastError: string | null;
}

export const TelegramBotModal: React.FC<TelegramBotModalProps> = ({
  isOpen,
  onClose,
  theme
}) => {
  const [copied, setCopied] = useState(false);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);
  const [avatarSynced, setAvatarSynced] = useState(false);

  const BOT_USERNAME = "osonaiuzbot";
  const BOT_LINK = `https://t.me/${BOT_USERNAME}`;

  const fetchBotStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/telegram-bot/status");
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch (e) {
      console.error("Bot status fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBotStatus();
      const interval = setInterval(fetchBotStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`@${BOT_USERNAME}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestartBot = async () => {
    setIsRestarting(true);
    try {
      const res = await fetch("/api/telegram-bot/restart", { method: "POST" });
      if (res.ok) {
        await fetchBotStatus();
      }
    } catch (e) {
      console.error("Restart error:", e);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleSyncAvatar = async () => {
    setIsSyncingAvatar(true);
    try {
      const res = await fetch("/api/telegram-bot/set-avatar", { method: "POST" });
      if (res.ok) {
        setAvatarSynced(true);
        setTimeout(() => setAvatarSynced(false), 3000);
      }
    } catch (e) {
      console.error("Set avatar error:", e);
    } finally {
      setIsSyncingAvatar(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
            theme === "light"
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-[#131625] border-slate-800 text-slate-100"
          }`}
        >
          {/* Top Header */}
          <div className="relative overflow-hidden p-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shrink-0">
            {/* Background geometric accents */}
            <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-1/3 -bottom-10 w-32 h-32 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl overflow-hidden border border-white/30 shadow-lg shrink-0">
                  <img src="/osonai-avatar.png" alt="OsonAI Bot Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight">OsonAI Telegram Boti</h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Faol & Online
                    </span>
                  </div>
                  <p className="text-sm text-sky-100/90 font-mono mt-0.5">@{BOT_USERNAME}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* Primary Action Hero Card */}
            <div
              className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                theme === "light"
                  ? "bg-sky-50/70 border-sky-100"
                  : "bg-sky-950/20 border-sky-800/40"
              }`}
            >
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-cyan-400/40 shadow-md shadow-cyan-500/30 shrink-0">
                  <img src="/osonai-avatar.png" alt="OsonAI" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Telegramda hoziroq boshlang</h3>
                  <p className={`text-xs mt-1 ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                    Ilovani yuklab olish shart emas, Telegram messenjeri orqali doimiy 24/7 AI yordamchi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-xl border transition ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                  }`}
                  title="Username'ni nusxalash"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Nusxalandi" : `@${BOT_USERNAME}`}
                </button>

                <a
                  href={BOT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/25 transition active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Botni ochish
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              </div>
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className={`p-3.5 rounded-xl border ${
                  theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181c30] border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-sky-500 font-medium">
                  <Zap className="w-3.5 h-3.5" />
                  Holat
                </div>
                <div className="text-sm font-bold mt-1 text-emerald-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181c30] border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Xabarlar
                </div>
                <div className="text-sm font-bold mt-1">
                  {botStatus?.messagesCount !== undefined ? botStatus.messagesCount : 0} ta
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181c30] border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-purple-500 font-medium">
                  <Cpu className="w-3.5 h-3.5" />
                  AI Modeli
                </div>
                <div className="text-sm font-bold mt-1 truncate text-purple-400">
                  Oson v2.55
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#181c30] border-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tezlik
                </div>
                <div className="text-sm font-bold mt-1 text-sky-500">
                  Ultra tezkor
                </div>
              </div>
            </div>

            {/* Features Capabilities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Bot imkoniyatlari
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-[#171a2e] border-slate-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Har qanday savol-javob</div>
                    <div className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                      O'zbek tilida mukammal, tushunarli va professional javoblar
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-[#171a2e] border-slate-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Rasm chizish (Imagen 3)</div>
                    <div className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                      /image buyrug'i orqali istalgan tasvirni bir zumda yaratish
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-[#171a2e] border-slate-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Rasmlarni tahlil qilish (Vision)</div>
                    <div className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                      Botga rasm yuboring va xohlagan savolingizni so'rang
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    theme === "light" ? "bg-white border-slate-200" : "bg-[#171a2e] border-slate-800"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Dasturlash va kod yordamchisi</div>
                    <div className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                      Python, JS, C++, PHP, xatolarni tuzatish va tushuntirish
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Channels Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Majburiy a'zolik kanallari
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="https://t.me/namtim_robo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl border flex items-center justify-between transition group ${
                    theme === "light"
                      ? "bg-slate-50 hover:bg-sky-50 border-slate-200 hover:border-sky-300"
                      : "bg-[#171a2e] hover:bg-[#1d2342] border-slate-800 hover:border-sky-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      1
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold group-hover:text-sky-500 transition-colors">NamRobo</div>
                      <div className="text-[11px] text-slate-400 font-mono">@namtim_robo</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
                </a>

                <a
                  href="https://t.me/yanginamangantim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl border flex items-center justify-between transition group ${
                    theme === "light"
                      ? "bg-slate-50 hover:bg-sky-50 border-slate-200 hover:border-sky-300"
                      : "bg-[#171a2e] hover:bg-[#1d2342] border-slate-800 hover:border-sky-500/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 font-bold text-xs">
                      2
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold group-hover:text-indigo-400 transition-colors">Yangi Namangan TIM</div>
                      <div className="text-[11px] text-slate-400 font-mono">@yanginamangantim</div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
                </a>
              </div>
            </div>

            {/* Commands Reference Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Asosiy Telegram buyruqlari
              </h4>
              <div
                className={`rounded-xl border overflow-hidden text-xs ${
                  theme === "light" ? "bg-white border-slate-200" : "bg-[#171a2e] border-slate-800"
                }`}
              >
                <div className={`grid grid-cols-3 p-2.5 font-semibold border-b ${
                  theme === "light" ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-slate-800/60 border-slate-800 text-slate-300"
                }`}>
                  <div>Buyruq</div>
                  <div className="col-span-2">Vazifasi</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="grid grid-cols-3 p-2.5 font-mono">
                    <span className="text-sky-500 font-bold">/start</span>
                    <span className={`col-span-2 font-sans ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                      Botni ishga tushirish va interaktiv menyu
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 font-mono">
                    <span className="text-sky-500 font-bold">/new</span>
                    <span className={`col-span-2 font-sans ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                      Suhbat xotirasini tozalash va yangi mavzu boshlash
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 font-mono">
                    <span className="text-sky-500 font-bold">/image &lt;so'rov&gt;</span>
                    <span className={`col-span-2 font-sans ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                      Sun'iy intellekt yordamida tasvir chizib berish
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 font-mono">
                    <span className="text-sky-500 font-bold">/help</span>
                    <span className={`col-span-2 font-sans ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                      To'liq qo'llanma va maslahatlar
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 font-mono">
                    <span className="text-sky-500 font-bold">/web</span>
                    <span className={`col-span-2 font-sans ${theme === "light" ? "text-slate-700" : "text-slate-300"}`}>
                      OsonAI kengaytirilgan veb-platformasi havolasi
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div
            className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
              theme === "light"
                ? "bg-slate-50 border-slate-200"
                : "bg-[#111422] border-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestartBot}
                disabled={isRestarting}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
                title="Bot ulanishini qayta yangilash"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestarting ? "animate-spin text-sky-500" : ""}`} />
                {isRestarting ? "Yangilanmoqda..." : "Ulanishni yangilash"}
              </button>

              <button
                onClick={handleSyncAvatar}
                disabled={isSyncingAvatar}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  avatarSynced
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : theme === "light"
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
                title="Telegram bot profiliga OsonAI rasmini qayta yuklash"
              >
                {avatarSynced ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rasm o'rnatildi!</span>
                  </>
                ) : (
                  <>
                    <img src="/osonai-avatar.png" alt="" className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{isSyncingAvatar ? "O'rnatilmoqda..." : "Profil rasmini yangilash"}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 text-xs font-medium rounded-xl border transition ${
                  theme === "light"
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Yopish
              </button>
              <a
                href={BOT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20 transition active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                Telegramda ochish
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
