import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Sliders,
  Settings2,
  X,
  RefreshCw,
  Volume2,
  VolumeX,
  Check,
  ShieldCheck,
  Radio,
  RotateCcw,
  Sparkles,
  Play,
  Square,
  HelpCircle,
  Headphones
} from "lucide-react";
import { AudioInputDevice } from "../utils/useSpeechToText";

export interface SpeechSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  audioDevices: AudioInputDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
  threshold: number;
  onChangeThreshold: (val: number) => void;
  noiseSuppression: boolean;
  onChangeNoiseSuppression: (val: boolean) => void;
  echoCancellation: boolean;
  onChangeEchoCancellation: (val: boolean) => void;
  onResetSettings: () => void;
  onRefreshDevices: () => Promise<void>;
  isTestingMic: boolean;
  onToggleMicTest: () => void;
  testAudioLevel: number;
  activeAudioLevel?: number;
  isRecording?: boolean;
}

export const SpeechSettingsModal: React.FC<SpeechSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  audioDevices,
  selectedDeviceId,
  onSelectDevice,
  sensitivity,
  onChangeSensitivity,
  threshold,
  onChangeThreshold,
  noiseSuppression,
  onChangeNoiseSuppression,
  echoCancellation,
  onChangeEchoCancellation,
  onResetSettings,
  onRefreshDevices,
  isTestingMic,
  onToggleMicTest,
  testAudioLevel,
  activeAudioLevel = 0,
  isRecording = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const currentLevel = isRecording ? activeAudioLevel : testAudioLevel;
  const isAboveThreshold = currentLevel >= threshold;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshDevices();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const sensitivityPresets = [
    { label: "Sokin (75%)", value: 75 },
    { label: "Standart (100%)", value: 100 },
    { label: "Baland (140%)", value: 140 },
    { label: "Maksimal (200%)", value: 200 },
  ];

  const thresholdPresets = [
    { label: "Past (5%)", value: 5 },
    { label: "Standart (15%)", value: 15 },
    { label: "Yuqori (25%)", value: 25 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", duration: 0.3 }}
          className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            theme === "light"
              ? "bg-white border-slate-200 text-slate-800"
              : "bg-[#16192b] border-slate-800 text-slate-100"
          }`}
        >
          {/* Header */}
          <div
            className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${
              theme === "light"
                ? "bg-slate-50/80 border-slate-200"
                : "bg-[#1a1e33] border-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">
                  Ovozli kiritish sozlamalari
                </h3>
                <p className={`text-xs mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                  Mikrofon qurilmasi va sezgirlik chegarasini boshqaring
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                theme === "light"
                  ? "hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-sm">
            
            {/* 1. Input Device Selection */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === "light"
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-[#1c2038]/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Kirish qurilmasi (Mikrofon)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    {audioDevices.length > 0 ? `${audioDevices.length} ta aniqlandi` : "Qidirilmoqda..."}
                  </span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-1 rounded-lg transition ${
                      theme === "light" ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-700 text-slate-300"
                    } ${isRefreshing ? "animate-spin" : ""}`}
                    title="Qurilmalarni yangilash"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => onSelectDevice(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium border outline-none transition cursor-pointer appearance-none ${
                    theme === "light"
                      ? "bg-white border-slate-300 text-slate-800 focus:border-cyan-500"
                      : "bg-[#131627] border-slate-700 text-slate-200 focus:border-cyan-400"
                  }`}
                >
                  <option value="">Standart tizim mikrofoni (Avtomatik)</option>
                  {audioDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Mikrofon (${dev.deviceId.slice(0, 8)}...)`}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
              </div>

              {audioDevices.length === 0 && (
                <p className="text-[11px] text-amber-500/90 leading-tight">
                  Eslatma: Qurilmalar ro'yxatini ko'rish uchun mikrofonga brauzer orqali ruxsat berilgan bo'lishi kerak.
                </p>
              )}
            </div>

            {/* 2. Live Audio Level Meter & Threshold Indicator */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === "light"
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-[#1c2038]/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Jonli ovoz darajasi va tekshiruv</span>
                </div>

                {!isRecording && (
                  <button
                    type="button"
                    onClick={onToggleMicTest}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isTestingMic
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                    }`}
                  >
                    {isTestingMic ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Sinovni to'xtatish</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Mikrofonni sinash</span>
                      </>
                    )}
                  </button>
                )}

                {isRecording && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Hozir yozilmoqda
                  </span>
                )}
              </div>

              {/* Meter bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={theme === "light" ? "text-slate-500" : "text-slate-400"}>
                    Ovoz darajasi: <b className="text-cyan-400">{currentLevel}%</b>
                  </span>
                  <span className="text-[11px] font-medium">
                    Chegara: <b className="text-amber-400">{threshold}%</b>
                  </span>
                </div>

                <div className="relative w-full h-3.5 rounded-full overflow-hidden bg-slate-700/30 border border-slate-600/30">
                  {/* Current sound fill */}
                  <motion.div
                    className={`h-full rounded-full transition-all duration-75 ${
                      isAboveThreshold
                        ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500"
                        : "bg-slate-500/50"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, currentLevel))}%` }}
                  />

                  {/* Threshold mark pin */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-sm shadow-amber-400"
                    style={{ left: `${threshold}%` }}
                    title={`Sezgirlik chegarasi: ${threshold}%`}
                  />
                </div>

                {/* Status indicator badge */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    {isAboveThreshold ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Nutq aniqlandi (Chegaradan yuqori)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <VolumeX className="w-3 h-3" />
                        Sokinlik / Fon shovqini (Chegaradan past)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 italic">
                    {isTestingMic ? "Gapirib sinab ko'ring..." : isRecording ? "Aktiv yozuv" : "Sinovni yoqing"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Microphone Sensitivity (Gain) Adjustment */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === "light"
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-[#1c2038]/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Mikrofon sezgirligi (Gain)</span>
                  </label>
                  <p className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    Mikrofoningiz past ovozda bo'lsa kuchaytiring yoki baland bo'lsa pasaytiring
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {sensitivity}%
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={sensitivity}
                onChange={(e) => onChangeSensitivity(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-1.5 rounded-lg bg-slate-700/40 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                {sensitivityPresets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onChangeSensitivity(p.value)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      sensitivity === p.value
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-400 font-bold"
                        : theme === "light"
                        ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Sensitivity Threshold (Noise Gate Threshold) */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === "light"
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-[#1c2038]/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-xs flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Sezgirlik / Shovqin chegarasi (Threshold)</span>
                  </label>
                  <p className={`text-[11px] mt-0.5 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    Ushbu foizdan past tovushlar fon shovqini sifatida e'tiborga olinmaydi
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {threshold}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={threshold}
                onChange={(e) => onChangeThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 rounded-lg bg-slate-700/40 cursor-pointer"
              />

              <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                {thresholdPresets.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onChangeThreshold(p.value)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      threshold === p.value
                        ? "bg-amber-500/20 border-amber-400 text-amber-400 font-bold"
                        : theme === "light"
                        ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Audio Enhancements (Noise Suppression & Echo Cancellation) */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                theme === "light"
                  ? "bg-slate-50/60 border-slate-200"
                  : "bg-[#1c2038]/60 border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ovozni qayta ishlash filtrlari</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-500/20 bg-slate-500/5 cursor-pointer hover:bg-slate-500/10 transition">
                  <div className="pr-2">
                    <div className="font-semibold text-xs">Shovqinni bostirish</div>
                    <div className="text-[10px] text-slate-400">Atrofdagi begona shovqinlarni kamaytiradi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => onChangeNoiseSuppression(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-500/20 bg-slate-500/5 cursor-pointer hover:bg-slate-500/10 transition">
                  <div className="pr-2">
                    <div className="font-semibold text-xs">Aks-sado (Echo) yo'qotish</div>
                    <div className="text-[10px] text-slate-400">Karnaydan qaytgan aks-sadoni olib tashlaydi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => onChangeEchoCancellation(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div
            className={`px-5 py-3.5 border-t flex items-center justify-between shrink-0 gap-3 ${
              theme === "light"
                ? "bg-slate-50/80 border-slate-200"
                : "bg-[#1a1e33] border-slate-800"
            }`}
          >
            <button
              type="button"
              onClick={onResetSettings}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                theme === "light"
                  ? "hover:bg-slate-200 text-slate-600"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standartga qaytarish</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0f111a] shadow-md shadow-cyan-500/20 transition cursor-pointer"
            >
              Tayyor
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
