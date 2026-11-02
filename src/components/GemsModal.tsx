import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Sparkles, 
  Code, 
  Calculator, 
  Languages, 
  PenTool, 
  Briefcase, 
  Palette, 
  BookOpen, 
  Plus, 
  Check, 
  Trash2, 
  Bot,
  Zap,
  GraduationCap
} from "lucide-react";
import { CustomGem } from "../db";

export const BUILT_IN_GEMS: CustomGem[] = [
  {
    id: "gem-coder",
    name: "Full-Stack Dasturchi & Arxitektor",
    description: "Mukammal kod yozish, xatolarni tuzatish, React, Node, Python, arxitektura va testlash bo'yicha super ekspert.",
    systemPrompt: "Siz - dunyo darajasidagi Senior Full-Stack Dasturchi va Dasturiy Arxitektorsiz. Clean Architecture, SOLID tamoyillari, xavfsizlik va eng optimal kod yozish bo'yicha foydalanuvchiga professional yordam berasiz. Har doim kodlarni to'liq, tushunarli va production-ready formatda taqdim eting.",
    icon: "Code",
    color: "cyan",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-math",
    name: "Matematika & Formula Solver",
    description: "Murakkab algebra, geometriya, hisob-kitoblar, fizika va oliy matematika masalalarini bosqichma-bosqich yechuvchi.",
    systemPrompt: "Siz - professional Matematik va STEM ekspertisiz. Har qanday matematik tenglama, integral, matritsa, statistika yoki amaliy masalalarni qadamma-qadam (step-by-step), qoidalar va formulalari bilan tushuntirib berasiz.",
    icon: "Calculator",
    color: "emerald",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-ielts",
    name: "IELTS & English Mentor",
    description: "Ingliz tili darajangizni oshirish, IELTS Band 8.5+ writing/speaking namunalari, lug'at va grammatika tahlili.",
    systemPrompt: "You are an elite IELTS Master and Native English Fluency Coach. Help the user improve their vocabulary, grammar, IELTS Writing Task 1/2, Speaking questions, and natural conversational idioms with rich explanations and corrections.",
    icon: "Languages",
    color: "purple",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-copywriter",
    name: "Kreativ Kopirayter & SMM Guru",
    description: "Auditoriyani rom qiluvchi postlar, reklama matnlari, YouTube/Reels skriptlari, maqolalar va marketing rejalari.",
    systemPrompt: "Siz - eng yuqori konversiyali matnlar yozuvchi Professional Kopirayter va SMM strategisiz. Psixologik ilmoqlar (hook), AIDA formulasi, qiziqarli hikoyalar (storytelling) va zamonaviy o'zbek auditoriyasiga mos matnlar yaratasiz.",
    icon: "PenTool",
    color: "rose",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-business",
    name: "Biznes & Startup Maslahatchisi",
    description: "Biznes rejalar, Pitch Deck, moliyaviy prognozlar, bozor tahlili va daromadni oshirish strategiyalari.",
    systemPrompt: "Siz - tajribali Startup Asoschisi va Biznes Strategisiz. Biznes modellar (Unit Economics, CAC, LTV), bozorga kirish (GTM strategy), investitsiya jalb qilish va daromadli mahsulotlar yaratish bo'yicha maslahatlar berasiz.",
    icon: "Briefcase",
    color: "amber",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-uiux",
    name: "UI/UX & Web Dizayn Eksperti",
    description: "Zamonaviy veb va mobil ilovalar dizayn tizimi, Tailwind ranglari, tipografiya va foydalanuvchi tajribasi bo'yicha maslahatlar.",
    systemPrompt: "Siz - Apple, Stripe va Airbnb darajasidagi mahsulotlar yaratuvchi Senior UI/UX Dizayner va Frontend Stylerisiz. Zamonaviy toza interfeyslar, Tailwind CSS sinflari, ranglar palitrasi va ergonomik layoutlar bo'yicha maslahat berasiz.",
    icon: "Palette",
    color: "indigo",
    createdAt: "2026-01-01",
    isBuiltIn: true
  },
  {
    id: "gem-literature",
    name: "O'zbek Tili & Adabiyot Tahlilchisi",
    description: "Milliy til me'yorlari, mumtoz va zamonaviy adabiyot, g'azallar sharhi, to'g'ri imlo va boy so'z boyligi.",
    systemPrompt: "Siz - Alisher Navoiy, Abdulla Qodiriy va mumtoz adabiyotimiz durdonalarini chuqur biluvchi O'zbek tili va Adabiyoti professori hamda tilshunos ekspertisiz. To'g'ri imlo, so'z ma'nolari, she'riy tahlillar va boy badiiy til bilan javob berasiz.",
    icon: "BookOpen",
    color: "teal",
    createdAt: "2026-01-01",
    isBuiltIn: true
  }
];

interface GemsModalProps {
  activeGem: CustomGem | null;
  customGems: CustomGem[];
  theme: "light" | "dark";
  onSelectGem: (gem: CustomGem | null) => void;
  onCreateGem: (gem: CustomGem) => void;
  onDeleteGem: (gemId: string) => void;
  onClose: () => void;
}

export const GemsModal: React.FC<GemsModalProps> = ({
  activeGem,
  customGems,
  theme,
  onSelectGem,
  onCreateGem,
  onDeleteGem,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [color, setColor] = useState("cyan");

  const allGems = [...BUILT_IN_GEMS, ...customGems];

  const getGemIcon = (iconName: string) => {
    switch (iconName) {
      case "Code": return <Code className="h-5 w-5" />;
      case "Calculator": return <Calculator className="h-5 w-5" />;
      case "Languages": return <Languages className="h-5 w-5" />;
      case "PenTool": return <PenTool className="h-5 w-5" />;
      case "Briefcase": return <Briefcase className="h-5 w-5" />;
      case "Palette": return <Palette className="h-5 w-5" />;
      case "BookOpen": return <BookOpen className="h-5 w-5" />;
      default: return <Sparkles className="h-5 w-5" />;
    }
  };

  const getColorClasses = (c: string, isSelected: boolean) => {
    const map: Record<string, { bg: string; border: string; text: string; ring: string }> = {
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", ring: "ring-cyan-500" },
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", ring: "ring-emerald-500" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", ring: "ring-purple-500" },
      rose: { bg: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-400", ring: "ring-rose-500" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", ring: "ring-amber-500" },
      indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-400", ring: "ring-indigo-500" },
      teal: { bg: "bg-teal-500/10", border: "border-teal-500/40", text: "text-teal-400", ring: "ring-teal-500" }
    };
    return map[c] || map.cyan;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    const newGem: CustomGem = {
      id: "custom-gem-" + Date.now(),
      name: name.trim(),
      description: description.trim() || "Foydalanuvchi tomonidan yaratilgan maxsus AI Gem",
      systemPrompt: systemPrompt.trim(),
      icon: "Sparkles",
      color: color,
      createdAt: new Date().toISOString(),
      isBuiltIn: false
    };

    onCreateGem(newGem);
    onSelectGem(newGem);
    setIsCreating(false);
    setName("");
    setDescription("");
    setSystemPrompt("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${
          theme === "light"
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#111422] border-[#24273c] text-slate-100"
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#161a2c] border-[#24273c]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">OsonAI Gems & Maxsus AI Agentlar</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  {allGems.length} ta Agent
                </span>
              </div>
              <p className="text-xs text-slate-500">Ixtisoslashgan sohalar bo'yicha sun'iy intellekt xarakterlari va yordamchilari</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                <span>Yangi Gem Yaratish</span>
              </button>
            )}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Gem Banner / Reset */}
          {activeGem ? (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              theme === "light" ? "bg-cyan-50 border-cyan-200" : "bg-cyan-950/30 border-cyan-800/50"
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                  {getGemIcon(activeGem.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-mono font-bold text-cyan-500">Hozirgi Faol Gem:</span>
                    <span className="font-bold text-sm">{activeGem.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeGem.description}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectGem(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-[#161a2c] hover:bg-[#20253f] text-slate-200 border-[#2d3252]"
                }`}
              >
                Standart Rejimga Qaytish
              </button>
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
              theme === "light" ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#141727] border-[#24273c] text-slate-400"
            }`}>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-400" />
                <span>Hozirda umumiy <b>Standart OsonAI Yordamchisi</b> faol. Ixtisoslashgan Gemni tanlang:</span>
              </div>
            </div>
          )}

          {/* Create Form */}
          {isCreating ? (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateSubmit}
              className={`p-5 rounded-2xl border space-y-4 ${
                theme === "light" ? "bg-slate-50 border-slate-300" : "bg-[#141727] border-[#2d3252]"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-700/30">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Yangi Maxsus Gem (AI Persona) Yaratish
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Gem Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Python Django & FastAPI Mutaxassisi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Qisqa Tavsifi</label>
                <input
                  type="text"
                  placeholder="Masalan: Backend kodlar, xavfsizlik va optimallashtirish bo'yicha yordamchi"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Shaxsiy Tizim Ko'rsatmasi (System Instructions / Prompt) *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Bu Gem o'zini qanday tutishi kerak, qanday uslubda javob berishi va qaysi qoidalarga rioya qilishi lozim?"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border outline-none font-mono ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Rang:</span>
                  {["cyan", "emerald", "purple", "rose", "amber", "indigo"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        c === "cyan" ? "bg-cyan-500" :
                        c === "emerald" ? "bg-emerald-500" :
                        c === "purple" ? "bg-purple-500" :
                        c === "rose" ? "bg-rose-500" :
                        c === "amber" ? "bg-amber-500" : "bg-indigo-500"
                      } ${color === c ? "border-white scale-110 shadow-md" : "border-transparent opacity-60"}`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer transition"
                >
                  Gemni Saqlash & Ishga Tushirish
                </button>
              </div>
            </motion.form>
          ) : null}

          {/* Grid of Gems */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {allGems.map((gem) => {
              const isSelected = activeGem?.id === gem.id;
              const colorInfo = getColorClasses(gem.color, isSelected);

              return (
                <div
                  key={gem.id}
                  onClick={() => {
                    onSelectGem(gem);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isSelected
                      ? `${colorInfo.bg} ${colorInfo.border} shadow-lg ring-1 ${colorInfo.ring}`
                      : theme === "light"
                        ? "bg-white hover:bg-slate-50 border-slate-200"
                        : "bg-[#141727] hover:bg-[#191d32] border-[#24273c]"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorInfo.bg} ${colorInfo.text}`}>
                        {getGemIcon(gem.icon)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {gem.isBuiltIn && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Rasmiy
                          </span>
                        )}
                        {!gem.isBuiltIn && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteGem(gem.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                            title="O'chirish"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isSelected && (
                          <span className={`p-1 rounded-full ${colorInfo.text}`}>
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm mb-1">{gem.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {gem.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700/20 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-cyan-400" />
                      <span>{isSelected ? "Faol rejimda" : "Faollashtirish uchun bosing"}</span>
                    </span>
                    <span className="font-mono text-[10px]">Oson v2.55</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
