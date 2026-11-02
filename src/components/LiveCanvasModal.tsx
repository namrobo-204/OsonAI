import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Play, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Copy, 
  Check, 
  Code2, 
  ExternalLink,
  RotateCcw
} from "lucide-react";

interface LiveCanvasModalProps {
  initialCode: string;
  language: string;
  theme: "light" | "dark";
  onClose: () => void;
}

export const LiveCanvasModal: React.FC<LiveCanvasModalProps> = ({
  initialCode,
  language,
  theme,
  onClose
}) => {
  const [code, setCode] = useState(initialCode);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isCopied, setIsCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "w-[375px] h-[667px]";
      case "tablet":
        return "w-[768px] h-[800px]";
      default:
        return "w-full h-full";
    }
  };

  // Build sandboxed HTML template
  const getRenderSrcDoc = () => {
    const isHtml = language.toLowerCase() === "html" || code.includes("<html") || code.includes("<div") || code.includes("<!DOCTYPE");
    
    if (isHtml) {
      if (code.includes("<html") || code.includes("<!DOCTYPE")) {
        return code;
      }
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; background-color: ${theme === "light" ? "#f8fafc" : "#0f172a"}; color: ${theme === "light" ? "#0f172a" : "#f8fafc"}; }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `;
    }

    // JavaScript / Code snippet runner
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: monospace; padding: 16px; background-color: #0b0f19; color: #38bdf8; }
            #console-log { white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div style="font-weight: bold; color: #a5f3fc; margin-bottom: 12px;">⚡ OsonAI Interactive Execution Output:</div>
          <div id="console-log"></div>
          <script>
            const logDiv = document.getElementById('console-log');
            const originalLog = console.log;
            console.log = function(...args) {
              originalLog.apply(console, args);
              logDiv.innerHTML += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
            };
            console.error = function(...args) {
              logDiv.innerHTML += '<span style="color:#f87171;">[Xato] ' + args.join(' ') + '</span>\\n';
            };
            try {
              ${code}
            } catch (err) {
              console.error(err.message || err);
            }
          </script>
        </body>
      </html>
    `;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-7xl h-[92vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${
          theme === "light"
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#111422] border-[#24273c] text-slate-100"
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#161a2c] border-[#24273c]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">OsonAI Live Canvas Sandbox</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase font-semibold">
                  {language || "code"}
                </span>
              </div>
              <p className="text-xs text-slate-500">Real vaqtda kodni ko'rish, sinash va tahrirlash</p>
            </div>
          </div>

          {/* Device switcher and controls */}
          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center rounded-xl p-1 border ${
              theme === "light" ? "bg-white border-slate-200" : "bg-[#0d101d] border-[#24273c]"
            }`}>
              <button
                onClick={() => setDevice("desktop")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  device === "desktop" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Desktop ko'rinish"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDevice("tablet")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  device === "tablet" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Planshet ko'rinish"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  device === "mobile" ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Mobil telefon ko'rinish"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                theme === "light"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-[#1e2238] hover:bg-[#252a45] text-slate-300 border-[#2d3252]"
              }`}
              title="Qayta yuklash"
            >
              <RotateCcw className="h-4 w-4 text-cyan-400" />
            </button>

            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                isCopied
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    : "bg-[#1e2238] hover:bg-[#252a45] text-slate-300 border-[#2d3252]"
              }`}
            >
              {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{isCopied ? "Nusxalandi" : "Kodni nusxalash"}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl text-slate-400 hover:text-white transition ${
                theme === "light" ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800"
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body (Split view: Code editor + Live Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Code Editor */}
          <div className={`flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden ${
            theme === "light" ? "border-slate-200 bg-slate-900 text-slate-100" : "border-[#24273c] bg-[#0c0e17] text-slate-100"
          }`}>
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Manba kodi (Tahrirlash mumkin)</span>
              <span className="text-[10px] text-cyan-400 font-mono">Real-time sync</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-xs md:text-sm bg-transparent outline-none resize-none leading-relaxed text-slate-200 selection:bg-cyan-500/30"
              spellCheck={false}
            />
          </div>

          {/* Preview Container */}
          <div className={`flex-1 flex items-center justify-center p-4 overflow-auto ${
            theme === "light" ? "bg-slate-100" : "bg-[#090b13]"
          }`}>
            <div className={`transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/40 bg-white ${getDeviceWidth()}`}>
              <iframe
                key={refreshKey}
                srcDoc={getRenderSrcDoc()}
                title="Live Sandbox"
                className="w-full h-full border-0 min-h-[350px]"
                sandbox="allow-scripts allow-modals allow-same-origin"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
