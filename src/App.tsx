import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Cpu,
  User,
  Bot,
  MessageSquare,
  Plus,
  Compass,
  Code,
  BookOpen,
  ArrowUp,
  Brain,
  Settings,
  HelpCircle
} from "lucide-react";

// Chat Message structure
interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

// Conversation structure
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// Quick prompts for the home screen
interface QuickPrompt {
  icon: any;
  title: string;
  subtitle: string;
  prompt: string;
}

// Helper to parse code blocks from AI replies
interface ChatPart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseMarkdownAndCode(text: string): ChatPart[] {
  const parts: ChatPart[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index)
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "code",
      content: match[2]
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex)
    });
  }

  return parts;
}

export default function App() {
  // LocalStorage keys
  const CONVS_KEY = "osonai_conversations";
  const ACTIVE_CONV_KEY = "osonai_active_conv_id";

  // Conversations list
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(CONVS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Active conversation ID
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  });

  const [inputMsg, setInputMsg] = useState("");
  const [isAiPending, setIsAiPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem(CONVS_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_CONV_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }
  }, [activeId]);

  // Current active conversation structure
  const activeConv = conversations.find((c) => c.id === activeId) || null;

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isAiPending]);

  // Quick prompt suggestions
  const suggestions: QuickPrompt[] = [
    {
      icon: Code,
      title: "Kod yozish",
      subtitle: "HTML/CSS da neon tugma yaratib ber",
      prompt: "Menga HTML va CSS yordamida ajoyib neon effektiga ega, hover qilganda reaktiv o'zgaradigan tugma kodini yozib ber."
    },
    {
      icon: Compass,
      title: "Sayohat rejasi",
      subtitle: "Samarqand bo'ylab 3 kunlik sayohat",
      prompt: "Samarqand shahrini 3 kun davomida aylanib ko'rish uchun mukammal sayohat marshruti va rejasi tuzib ber."
    },
    {
      icon: Brain,
      title: "G'oya izlash",
      subtitle: "Mobil ilova uchun yangi startap",
      prompt: "O'zbekiston bozori uchun hozirda dolzarb bo'lgan 3 ta foydali mobil ilova startap g'oyasini taqdim et."
    },
    {
      icon: BookOpen,
      title: "Tushuntirish",
      subtitle: "Kvant fizikasini bolalarga tushuntir",
      prompt: "Kvant fizikasi nima ekanligini 10 yoshli bolaga tushunarli bo'lgan sodda o'xshatishlar bilan tushuntirib ber."
    }
  ];

  // Start a new blank conversation
  const createNewChat = () => {
    const newId = Math.random().toString();
    const newConv: Conversation = {
      id: newId,
      title: "Yangi suhbat",
      messages: [
        {
          id: "welcome",
          role: "model",
          text: "Salom! Men **OsonAI** — sizning aqlli virtual hamrohingizman. Sizga matnlar yozishda, kodlarni tahlil qilishda, rejalashtirishda va istalgan savolingizga mukammal javob topishda yordam beraman. Bugun nima haqida suhbatlashamiz?",
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
  };

  // Ensure we have at least one active conversation
  useEffect(() => {
    if (conversations.length === 0) {
      createNewChat();
    } else if (!activeId || !conversations.some((c) => c.id === activeId)) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText ? customText.trim() : inputMsg.trim();
    if (!textToSend || isAiPending) return;

    if (!customText) {
      setInputMsg("");
    }

    // Prepare message IDs
    const userMsgId = Math.random().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    let targetConvId = activeId;
    let currentConversations = [...conversations];

    // If no conversation existed or activeId was invalid, create one immediately
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const newId = Math.random().toString();
      targetConvId = newId;
      const newConv: Conversation = {
        id: newId,
        title: textToSend.length > 26 ? textToSend.slice(0, 26) + "..." : textToSend,
        messages: [newUserMsg],
        createdAt: new Date()
      };
      currentConversations = [newConv, ...currentConversations];
      setConversations(currentConversations);
      setActiveId(newId);
    } else {
      // Update existing conversation message list
      currentConversations = currentConversations.map((c) => {
        if (c.id === targetConvId) {
          const isFirstRealMsg = c.messages.length === 1 && c.messages[0].id === "welcome";
          const updatedMsgs = isFirstRealMsg ? [newUserMsg] : [...c.messages, newUserMsg];
          const newTitle = isFirstRealMsg
            ? textToSend.length > 26
              ? textToSend.slice(0, 26) + "..."
              : textToSend
            : c.title;

          return {
            ...c,
            title: newTitle,
            messages: updatedMsgs
          };
        }
        return c;
      });
      setConversations(currentConversations);
    }

    setIsAiPending(true);

    try {
      // Get conversation history safely
      const activeC = currentConversations.find((c) => c.id === targetConvId);
      const history = activeC
        ? activeC.messages.map((m) => ({
            role: m.role,
            text: m.text
          }))
        : [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: history.slice(0, -1) // Exclude current user message, it's sent as 'message'
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const responseMsg: Message = {
          id: Math.random().toString(),
          role: "model",
          text: data.reply,
          timestamp: new Date()
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: [...c.messages, responseMsg]
              };
            }
            return c;
          })
        );
      } else {
        throw new Error(data.error || "Tizimdan javob olishda xatolik yuz berdi");
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        role: "model",
        text: `Kechirasiz, tarmoq ulanishida yoki sun'iy intellekt modulida xatolik yuz berdi.\n\nTafsilot: ${error.message || error}`,
        timestamp: new Date()
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: [...c.messages, errorMsg]
            };
          }
          return c;
        })
      );
    } finally {
      setIsAiPending(false);
    }
  };

  // Delete a specific conversation
  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeId === id) {
      if (filtered.length > 0) {
        setActiveId(filtered[0].id);
      } else {
        setActiveId(null);
      }
    }
  };

  // Copy code blocks to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-[#05060f] text-slate-100 font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: Conversations history list */}
      <aside className="w-[280px] bg-[#0c0d16] border-r border-[#191b29] flex flex-col justify-between shrink-0 hidden md:flex">
        
        {/* Top brand header */}
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="h-5.5 w-5.5 text-[#05060f]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1">
                <span className="text-white">Oson</span>
                <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[9px] text-cyan-400/50 font-mono tracking-widest uppercase">Intelligent Client</p>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#131524] hover:bg-[#1a1c30] text-slate-200 hover:text-white border border-[#21243d] rounded-xl text-sm font-semibold transition cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-cyan-400 group-hover:rotate-90 transition-transform" />
              <span>Yangi suhbat</span>
            </span>
            <span className="text-[10px] bg-[#21243d] px-2 py-0.5 rounded text-slate-400 font-mono">⌘N</span>
          </button>
        </div>

        {/* Saved Conversations scroll space */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Muloqotlar tarixi</div>
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-600 italic px-2 py-3">Hozircha suhbatlar yo'q</p>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-950/30 to-violet-950/20 border border-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-[#101221] hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className="text-xs font-medium truncate pr-2">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1c1e33] rounded text-slate-500 hover:text-red-400 transition shrink-0"
                    title="O'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom profile and settings area */}
        <div className="p-4 border-t border-[#191b29] bg-[#090a12] flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs text-[#05060f]">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">Foydalanuvchi</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">kwindows630@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="font-mono text-emerald-400">Gemini 3.5</span>
            </span>
            <span className="hover:text-slate-300 cursor-pointer">Maxfiylik</span>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDEBAR: Pure Chat Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Dynamic Mobile and Desktop workspace header */}
        <header className="h-14 md:h-16 border-b border-[#121422] bg-[#070812] px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger shortcut or brand */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#05060f]" />
              </div>
              <span className="text-sm font-black tracking-tight italic text-white">OsonAI</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest font-semibold">
                FAOL SUHBAT DOSKASI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="md:hidden flex items-center gap-1 px-3 py-1.5 bg-[#121321] text-xs font-bold rounded-lg border border-[#212338]"
            >
              <Plus className="h-3 w-3 text-cyan-400" />
              <span>Yangi</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-[#0f111e] px-3 py-1.5 rounded-full border border-[#191b29] text-[11px]">
              <span className="text-slate-500 font-mono">Xavfsizlik:</span>
              <span className="text-emerald-400 font-bold font-mono">Shifrlangan</span>
            </div>
          </div>
        </header>

        {/* Core chat window container */}
        <div className="flex-1 overflow-y-auto bg-[#05060f] relative flex flex-col">
          
          {/* Main conditional rendering: If empty context (welcome/no msgs) -> show Suggestions page */}
          {activeConv && activeConv.messages.length <= 1 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
              
              {/* Massive branding icon container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center mb-10"
              >
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-violet-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20 mb-6">
                  <Sparkles className="h-9 w-9 text-[#05060f]" />
                </div>
                <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-white mb-2">
                  Bugun sizga qanday yordam bera olaman?
                </h2>
                <p className="text-sm text-slate-400 max-w-md leading-relaxed font-sans">
                  Sizning OsonAI aqlli yordamchingiz har qanday topshiriqni sodda va tez hal qilishga tayyor.
                </p>
              </motion.div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {suggestions.map((item, idx) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="bg-[#0c0d16] hover:bg-[#121321] border border-[#171929] hover:border-cyan-500/30 p-4 rounded-2xl transition cursor-pointer group relative overflow-hidden flex gap-3.5 items-start"
                    >
                      <div className="h-9 w-9 rounded-xl bg-[#17192a] flex items-center justify-center shrink-0 border border-slate-800 text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                        <IconComponent className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-200 mb-0.5 group-hover:text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Traditional Scrollable Conversational Area */
            <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
              {activeConv?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-[90%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* User/Bot Avatar Icon */}
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                      msg.role === "user"
                        ? "bg-gradient-to-tr from-cyan-500/20 to-blue-500/15 text-cyan-400 border border-cyan-500/20"
                        : "bg-gradient-to-tr from-emerald-500/20 to-teal-500/15 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {msg.role === "user" ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  {/* Message Bubble Column */}
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider px-1">
                      {msg.role === "user" ? "Siz" : "OsonAI"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div
                      className={`rounded-2xl px-4 py-3.5 text-[14px] md:text-[15px] leading-relaxed border select-text ${
                        msg.role === "user"
                          ? "bg-[#0b0e21] text-cyan-50 border-cyan-500/10 rounded-tr-none shadow-xl"
                          : "bg-[#0b0d18] text-slate-200 border-[#151726] rounded-tl-none shadow-2xl"
                      }`}
                    >
                      {parseMarkdownAndCode(msg.text).map((part, partIdx) => {
                        if (part.type === "code") {
                          const codeContent = part.content.trim();
                          return (
                            <div key={partIdx} className="my-3.5 border border-slate-800 rounded-xl overflow-hidden bg-[#030409] shadow-inner font-mono text-xs">
                              <div className="bg-[#0a0c14] px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{part.language || "code"}</span>
                                <button
                                  onClick={() => handleCopy(codeContent, msg.id + partIdx)}
                                  className="text-[10px] bg-slate-800/60 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer font-sans"
                                >
                                  {copiedId === msg.id + partIdx ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-400" />
                                      <span className="text-emerald-400">Nusxalandi</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" />
                                      <span>Nusxa olish</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 overflow-x-auto text-cyan-300/90 leading-relaxed max-h-[350px] select-text">
                                <code>{codeContent}</code>
                              </pre>
                            </div>
                          );
                        }

                        // Parse simple line breaks and inline formatting (**bold**)
                        return (
                          <div key={partIdx} className="whitespace-pre-wrap select-text">
                            {part.content.split("\n").map((line, lineIdx) => {
                              let renderedLine = line;
                              const boldRegex = /\*\*(.*?)\*\*/g;
                              const elements = [];
                              let lastTextIdx = 0;
                              let boldMatch;

                              while ((boldMatch = boldRegex.exec(line)) !== null) {
                                if (boldMatch.index > lastTextIdx) {
                                  elements.push(line.slice(lastTextIdx, boldMatch.index));
                                }
                                elements.push(
                                  <strong key={boldMatch.index} className="text-cyan-400 font-bold">
                                    {boldMatch[1]}
                                  </strong>
                                );
                                lastTextIdx = boldRegex.lastIndex;
                              }
                              if (lastTextIdx < line.length) {
                                elements.push(line.slice(lastTextIdx));
                              }

                              return (
                                <p key={lineIdx} className="mb-1.5">
                                  {elements.length > 0 ? elements : line}
                                </p>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot typing state loader */}
              {isAiPending && (
                <div className="flex gap-4 max-w-[80%] mr-auto">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Bot className="h-4.5 w-4.5 animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-mono">OsonAI • javob tayyorlamoqda</span>
                    <div className="bg-[#0b0d18] text-slate-300 border border-[#151726] rounded-2xl rounded-tl-none px-4 py-3.5 shadow-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        <span className="text-xs font-mono text-cyan-400 animate-pulse">Aqlli javob tahlil qilinmoqda...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

        </div>

        {/* FOOTER: Static Branding and Input layout */}
        <footer className="p-4 bg-[#070812] border-t border-[#121422] shrink-0">
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
            
            {/* Input wrap */}
            <div className="flex items-center gap-3 bg-[#0c0d16] border border-[#1e2133] focus-within:border-cyan-500/60 rounded-2xl p-2.5 transition-all shadow-inner">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAiPending) handleSendMessage();
                }}
                placeholder="Savolingizni yoki xabaringizni o'zbek tilida yozing..."
                className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                disabled={isAiPending}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMsg.trim() || isAiPending}
                className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center text-[#05060f] transition shadow-md shadow-cyan-400/10 cursor-pointer"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>

            {/* Information line */}
            <div className="text-center text-[10px] text-slate-500 font-mono">
              OsonAI noto'g'ri ma'lumotlar berishi ham mumkin. Muhim faktlarni tekshirib oling.
            </div>

          </div>
        </footer>

      </main>

    </div>
  );
}
