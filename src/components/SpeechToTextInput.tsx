import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Check,
  X,
  Send,
  Loader2,
  Globe,
  Radio,
  Trash2,
  Sparkles,
  ArrowUp,
  Sliders,
  Settings2,
  Volume2
} from "lucide-react";
import { SUPPORTED_STT_LANGUAGES, SpeechLanguage, AudioInputDevice } from "../utils/useSpeechToText";
import { SpeechSettingsModal } from "./SpeechSettingsModal";

interface SpeechToTextInputProps {
  isRecording: boolean;
  isTranscribing: boolean;
  duration: string;
  audioLevel: number;
  liveTranscript: string;
  selectedLang: string;
  onSelectLang: (lang: string) => void;
  onStartRecording: () => void;
  onStopAndApply: () => void;
  onStopAndSend: () => void;
  onCancel: () => void;
  errorMsg: string | null;
  theme: "dark" | "light";
  disabled?: boolean;

  // Settings & Device Selection props
  audioDevices?: AudioInputDevice[];
  selectedDeviceId?: string;
  onSelectDevice?: (deviceId: string) => void;
  sensitivity?: number;
  onChangeSensitivity?: (val: number) => void;
  threshold?: number;
  onChangeThreshold?: (val: number) => void;
  noiseSuppression?: boolean;
  onChangeNoiseSuppression?: (val: boolean) => void;
  echoCancellation?: boolean;
  onChangeEchoCancellation?: (val: boolean) => void;
  onResetSettings?: () => void;
  onRefreshDevices?: () => Promise<void>;
  isTestingMic?: boolean;
  onToggleMicTest?: () => void;
  testAudioLevel?: number;
}

export const SpeechToTextInput: React.FC<SpeechToTextInputProps> = ({
  isRecording,
  isTranscribing,
  duration,
  audioLevel,
  liveTranscript,
  selectedLang,
  onSelectLang,
  onStartRecording,
  onStopAndApply,
  onStopAndSend,
  onCancel,
  errorMsg,
  theme,
  disabled = false,

  // Settings
  audioDevices = [],
  selectedDeviceId = "",
  onSelectDevice = () => {},
  sensitivity = 100,
  onChangeSensitivity = () => {},
  threshold = 15,
  onChangeThreshold = () => {},
  noiseSuppression = true,
  onChangeNoiseSuppression = () => {},
  echoCancellation = true,
  onChangeEchoCancellation = () => {},
  onResetSettings = () => {},
  onRefreshDevices = async () => {},
  isTestingMic = false,
  onToggleMicTest = () => {},
  testAudioLevel = 0,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentLangObj =
    SUPPORTED_STT_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_STT_LANGUAGES[0];

  // Soundwave visualizer bar count (12 bars with responsive scaling)
  const waveBars = [0.4, 0.7, 0.3, 0.9, 0.6, 1.0, 0.8, 0.5, 0.9, 0.3, 0.7, 0.4];
  const isSoundAboveThreshold = audioLevel >= threshold;

  if (!isRecording && !isTranscribing) {
    return (
      <>
        <div className="relative inline-flex items-center gap-0.5">
          {/* Main Record Button */}
          <button
            type="button"
            onClick={onStartRecording}
            disabled={disabled}
            className={`p-2.5 rounded-2xl transition cursor-pointer shrink-0 group relative ${
              theme === "light"
                ? "hover:bg-[#e1e5ea] text-slate-600 hover:text-cyan-600"
                : "hover:bg-[#252b47] text-slate-400 hover:text-cyan-400"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            title="Ovozli kiritish (Speech-to-Text: Gapirib yozing)"
          >
            <Mic className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="sr-only">Ovozli kiritish</span>
          </button>

          {/* Settings Trigger Icon Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            disabled={disabled}
            className={`p-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              theme === "light"
                ? "hover:bg-[#e1e5ea] text-slate-400 hover:text-cyan-600"
                : "hover:bg-[#252b47] text-slate-500 hover:text-cyan-400"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            title="Mikrofon va sezgirlik sozlamalari (Kirish qurilmasi, Gain, Threshold)"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="sr-only">Mikrofon sozlamalari</span>
          </button>

          {errorMsg && (
            <div
              className={`absolute bottom-full mb-2 left-0 z-50 text-[11px] p-2 rounded-xl shadow-lg border max-w-xs whitespace-normal ${
                theme === "light"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-rose-950/90 text-rose-200 border-rose-800"
              }`}
            >
              {errorMsg}
            </div>
          )}
        </div>

        {/* Settings Modal */}
        <SpeechSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          audioDevices={audioDevices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={onSelectDevice}
          sensitivity={sensitivity}
          onChangeSensitivity={onChangeSensitivity}
          threshold={threshold}
          onChangeThreshold={onChangeThreshold}
          noiseSuppression={noiseSuppression}
          onChangeNoiseSuppression={onChangeNoiseSuppression}
          echoCancellation={echoCancellation}
          onChangeEchoCancellation={onChangeEchoCancellation}
          onResetSettings={onResetSettings}
          onRefreshDevices={onRefreshDevices}
          isTestingMic={isTestingMic}
          onToggleMicTest={onToggleMicTest}
          testAudioLevel={testAudioLevel}
          activeAudioLevel={audioLevel}
          isRecording={false}
        />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className={`w-full flex flex-col gap-2 p-2 rounded-2xl border transition-all ${
            theme === "light"
              ? "bg-white/95 border-cyan-400/60 shadow-md"
              : "bg-[#141727]/95 border-cyan-500/40 shadow-xl"
          }`}
        >
          {/* Top Control Bar: Recording indicator, timer, visualizer, language selector & actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Left: Recording state & timer */}
            <div className="flex items-center gap-2 shrink-0">
              {isTranscribing ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  <span>Ovoz tahlil qilinmoqda...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                  <span className="font-mono text-xs font-semibold">{duration}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 hidden xs:inline">
                    REC
                  </span>
                </div>
              )}

              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  disabled={isTranscribing}
                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                  title="Tilni o'zgartirish"
                >
                  <span>{currentLangObj.flag}</span>
                  <span className="text-[11px] font-semibold">{currentLangObj.code.slice(0, 2).toUpperCase()}</span>
                </button>

                {isLangMenuOpen && (
                  <div
                    className={`absolute left-0 bottom-full mb-1.5 z-50 py-1 rounded-xl shadow-xl border text-xs min-w-[130px] ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800"
                        : "bg-[#1e2337] border-slate-700 text-slate-200"
                    }`}
                  >
                    {SUPPORTED_STT_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectLang(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-cyan-500/10 hover:text-cyan-400 transition ${
                          selectedLang === lang.code ? "font-bold text-cyan-400" : ""
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings Panel Trigger in active bar */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className={`p-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-cyan-600"
                    : "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400"
                }`}
                title="Mikrofon va sezgirlik sozlamalari"
              >
                <Sliders className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Middle: Live soundwave visualization bars with threshold sensitivity indicator */}
            {!isTranscribing && (
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-1 px-2 h-7 overflow-hidden">
                {waveBars.map((multiplier, i) => {
                  const dynamicHeight = Math.max(
                    4,
                    Math.min(26, Math.round(audioLevel * multiplier * 0.35 + 4))
                  );
                  return (
                    <motion.div
                      key={i}
                      animate={{ height: `${dynamicHeight}px` }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`w-1 rounded-full transition-colors ${
                        isSoundAboveThreshold
                          ? "bg-gradient-to-t from-cyan-500 to-emerald-400"
                          : audioLevel > 5
                          ? "bg-amber-400/50"
                          : theme === "light"
                          ? "bg-slate-300"
                          : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Right: Actions (Cancel, Apply/Done, Direct Send) */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* Cancel button */}
              <button
                type="button"
                onClick={onCancel}
                className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200"
                    : "bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60"
                }`}
                title="Ovozli xabarni bekor qilish"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Done / Apply to Input */}
              <button
                type="button"
                onClick={onStopAndApply}
                disabled={isTranscribing}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  theme === "light"
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                    : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30"
                }`}
                title="Matnga o'tkazish va tahrirlash"
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">Matnga o'tkazish</span>
              </button>

              {/* Direct Send */}
              <button
                type="button"
                onClick={onStopAndSend}
                disabled={isTranscribing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0f111a] shadow-md shadow-cyan-500/20 transition cursor-pointer"
                title="To'g'ridan-to'g'ri yuborish"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Yuborish</span>
              </button>
            </div>
          </div>

          {/* Live speech preview transcript row */}
          <div
            className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-2 min-h-[38px] ${
              theme === "light"
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-black/25 border-slate-800 text-slate-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0 animate-pulse" />
            <div className="flex-1 overflow-hidden">
              {liveTranscript ? (
                <span className="font-medium leading-relaxed break-words">
                  {liveTranscript}
                  <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse align-middle" />
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Gapiring... Siz aytgan so'zlar avtomatik yoziladi ({currentLangObj.name})
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="text-[11px] text-rose-400 px-2 py-0.5">{errorMsg}</div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Settings Modal */}
      <SpeechSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={onSelectDevice}
        sensitivity={sensitivity}
        onChangeSensitivity={onChangeSensitivity}
        threshold={threshold}
        onChangeThreshold={onChangeThreshold}
        noiseSuppression={noiseSuppression}
        onChangeNoiseSuppression={onChangeNoiseSuppression}
        echoCancellation={echoCancellation}
        onChangeEchoCancellation={onChangeEchoCancellation}
        onResetSettings={onResetSettings}
        onRefreshDevices={onRefreshDevices}
        isTestingMic={isTestingMic}
        onToggleMicTest={onToggleMicTest}
        testAudioLevel={testAudioLevel}
        activeAudioLevel={audioLevel}
        isRecording={isRecording}
      />
    </>
  );
};
