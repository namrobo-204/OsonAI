import React, { useMemo } from "react";
import { motion } from "motion/react";
import { X, Network, Share2, Download, ZoomIn, ZoomOut, Sparkles } from "lucide-react";

interface MindmapModalProps {
  sourceText: string;
  theme: "light" | "dark";
  onClose: () => void;
}

interface TreeNode {
  title: string;
  children: TreeNode[];
}

export const MindmapModal: React.FC<MindmapModalProps> = ({
  sourceText,
  theme,
  onClose
}) => {
  // Parse markdown headers / bullet points into tree hierarchy
  const treeData = useMemo(() => {
    const lines = sourceText.split("\n").map(l => l.trim()).filter(Boolean);
    const root: TreeNode = {
      title: "Asosiy Mavzu & Tahlil",
      children: []
    };

    let currentSection: TreeNode | null = null;

    lines.forEach((line) => {
      // Clean headers or bullets
      const isHeader = line.startsWith("#") || line.startsWith("**") && line.endsWith("**");
      const isBullet = line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line);

      const cleanText = line
        .replace(/^#+\s*/, "")
        .replace(/^[-*]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim();

      if (!cleanText || cleanText.length < 2) return;

      if (isHeader || (!currentSection && root.children.length < 5)) {
        currentSection = {
          title: cleanText.length > 55 ? cleanText.slice(0, 52) + "..." : cleanText,
          children: []
        };
        root.children.push(currentSection);
      } else if (isBullet && currentSection) {
        currentSection.children.push({
          title: cleanText.length > 60 ? cleanText.slice(0, 57) + "..." : cleanText,
          children: []
        });
      } else if (root.children.length > 0) {
        const last = root.children[root.children.length - 1];
        if (last.children.length < 4) {
          last.children.push({
            title: cleanText.length > 60 ? cleanText.slice(0, 57) + "..." : cleanText,
            children: []
          });
        }
      }
    });

    if (root.children.length === 0) {
      root.children.push({
        title: "Tahliliy ma'lumotlar",
        children: [
          { title: "To'liq javob matni saqlangan", children: [] },
          { title: "Barcha xususiyatlar integratsiyalashgan", children: [] }
        ]
      });
    }

    return root;
  }, [sourceText]);

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
        className={`w-full max-w-5xl h-[88vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${
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
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">OsonAI MindMap & Concept Flow Visualizer</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Eksklyuziv
                </span>
              </div>
              <p className="text-xs text-slate-500">AI javobidan avtomatik hosil qilingan mantiqiy xarita</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl text-slate-400 hover:text-white transition ${
              theme === "light" ? "hover:bg-slate-200 text-slate-600" : "hover:bg-slate-800"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MindMap Canvas */}
        <div className={`flex-1 overflow-auto p-8 flex items-center justify-center ${
          theme === "light" ? "bg-slate-50" : "bg-[#0c0e18]"
        }`}>
          <div className="flex flex-col md:flex-row items-center gap-8 min-w-[700px]">
            {/* Root Node */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-xl flex items-center gap-2 border border-white/20">
              <Sparkles className="h-4 w-4" />
              <span>{treeData.title}</span>
            </div>

            {/* Branch Level 1 */}
            <div className="flex flex-col gap-5">
              {treeData.children.map((child, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-xl text-xs font-semibold border shadow-md max-w-xs transition-transform hover:scale-[1.02] ${
                    theme === "light"
                      ? "bg-white border-slate-300 text-slate-800 shadow-slate-200"
                      : "bg-[#181c30] border-cyan-500/30 text-cyan-200"
                  }`}>
                    {child.title}
                  </div>

                  {/* Branch Level 2 */}
                  {child.children.length > 0 && (
                    <div className="flex flex-col gap-2 border-l-2 border-dashed border-cyan-500/40 pl-4">
                      {child.children.map((subChild, subIdx) => (
                        <div
                          key={subIdx}
                          className={`p-2 rounded-lg text-[11px] border max-w-[260px] ${
                            theme === "light"
                              ? "bg-slate-100 border-slate-200 text-slate-700"
                              : "bg-[#101322] border-slate-700/50 text-slate-300"
                          }`}
                        >
                          {subChild.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
