import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  X, 
  FolderGit2, 
  Plus, 
  FileText, 
  Trash2, 
  Check, 
  UploadCloud, 
  FolderPlus, 
  Sparkles, 
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Project, ProjectFile } from "../db";

interface ProjectsModalProps {
  activeProject: Project | null;
  projects: Project[];
  theme: "light" | "dark";
  onSelectProject: (project: Project | null) => void;
  onCreateProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onClose: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  activeProject,
  projects,
  theme,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    Array.from(uploaded).forEach((file: File) => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`'${file.name}' hajmi 20MB dan oshmasligi kerak.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || "text/plain",
              data: result,
              size: file.size
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProj: Project = {
      id: "project-" + Date.now(),
      title: title.trim(),
      description: description.trim() || "OsonAI loyihasi",
      customInstructions: customInstructions.trim(),
      files: files,
      createdAt: new Date().toISOString(),
      color: "cyan"
    };

    onCreateProject(newProj);
    onSelectProject(newProj);
    setIsCreating(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCustomInstructions("");
    setFiles([]);
    setEditingProjectId(null);
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
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">OsonAI Projects (Loyihalar Markazi)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  {projects.length} ta Loyiha
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Claude Projects va ChatGPT Workspaces uslubidagi alohida bilimlar bazasi va xotirali ish maydoni
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => {
                  resetForm();
                  setIsCreating(true);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md cursor-pointer transition"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Yangi Loyiha</span>
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
          {/* Active Project Banner */}
          {activeProject ? (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              theme === "light" ? "bg-cyan-50 border-cyan-200" : "bg-cyan-950/30 border-cyan-800/50"
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase font-mono font-bold text-cyan-500">Faol Loyiha Maydoni:</span>
                    <span className="font-bold text-sm">{activeProject.title}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeProject.files?.length || 0} ta fayl biriktirilgan • {activeProject.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectProject(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  theme === "light"
                    ? "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-[#161a2c] hover:bg-[#20253f] text-slate-200 border-[#2d3252]"
                }`}
              >
                Loyihadan Chiqish
              </button>
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
              theme === "light" ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#141727] border-[#24273c] text-slate-400"
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Loyihalar barcha fayllar, kodlar va maxsus ko'rsatmalarni bir joyda saqlaydi.</span>
              </div>
            </div>
          )}

          {/* Create / Edit Form */}
          {isCreating && (
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
                  <FolderPlus className="h-4 w-4 text-cyan-400" />
                  Yangi Loyiha Yaratish
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Loyiha Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 'E-commerce Mobil Ilovasi' yoki 'IELTS Essay Tayyorgarlik'"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Qisqa Tavsif</label>
                <input
                  type="text"
                  placeholder="Loyiha haqida qisqacha ma'lumot"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Loyiha uchun Maxsus Ko'rsatmalar (Custom Instructions / Knowledge)
                </label>
                <textarea
                  rows={3}
                  placeholder="Masalan: 'Bu loyihada har doim TypeScript va Tailwind ishlatilsin. Javoblarda qisqa va aniq kod namunalari berilsin.'"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs border outline-none font-mono ${
                    theme === "light" ? "bg-white border-slate-300 text-slate-900" : "bg-[#0d101d] border-[#2d3252] text-white"
                  }`}
                />
              </div>

              {/* Project Knowledge Files */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400">
                    Loyiha Bilimlar Bazasi Fayllari (Hujjatlar, Kodlar, PDF)
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Fayl qo'shish</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                </div>

                {files.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 max-h-32 overflow-y-auto">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700">
                        <FileText className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="max-w-[130px] truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-700/50 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500/50 transition"
                  >
                    <p className="text-xs text-slate-400">Loyiha kontekstiga kiritish uchun fayllarni yuklang (PDF, txt, js, py, docx...)</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer transition"
                >
                  Loyihani Saqlash & Ochish
                </button>
              </div>
            </motion.form>
          )}

          {/* List of projects */}
          {projects.length === 0 && !isCreating ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <FolderGit2 className="h-12 w-12 text-slate-600 mb-3" />
              <h4 className="font-bold text-sm mb-1">Hozircha hech qanday loyiha yaratilmagan</h4>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Katta dasturlar, ilmiy maqolalar yoki kurslar uchun alohida Loyiha maydoni yarating.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 transition"
              >
                Birinchi Loyihani Yaratish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {projects.map((proj) => {
                const isSelected = activeProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/40 shadow-lg ring-1 ring-cyan-500"
                        : theme === "light"
                          ? "bg-white hover:bg-slate-50 border-slate-200"
                          : "bg-[#141727] hover:bg-[#191d32] border-[#24273c]"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <FolderGit2 className="h-5 w-5" />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(proj.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                            title="Loyihani o'chirish"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          {isSelected && (
                            <span className="p-1 rounded-full text-cyan-400">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-sm mb-1">{proj.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description || "Loyiha tavsifi kiritilmagan"}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/20 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{proj.files?.length || 0} ta biriktirilgan fayl</span>
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Ochish</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
