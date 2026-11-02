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
  HelpCircle,
  LogOut,
  LogIn,
  Lock,
  Menu,
  X,
  Pencil,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Edit2,
  RotateCcw,
  Paperclip,
  Image as ImageIcon,
  FileText,
  File,
  Download,
  Maximize2,
  Eye,
  FolderGit2,
  Wand2,
  Network,
  Layers,
  AlertCircle,
  RefreshCw,
  FolderPlus,
  Play,
  Award,
  ChevronRight
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, logout } from "./firebase";
import { 
  saveConversation as firestoreSaveConversation, 
  deleteConversationDoc, 
  syncLocalConversationsToCloud,
  loadConversations,
  Project,
  CustomGem,
  saveProject,
  loadProjects,
  deleteProjectDoc,
  saveCustomGem,
  loadCustomGems,
  deleteCustomGemDoc
} from "./db";
import { detectTextLanguage, playSpeech, DetectedLang } from "./utils/speech";
import { SpeechToTextInput } from "./components/SpeechToTextInput";
import { useSpeechToText } from "./utils/useSpeechToText";
import { LiveCanvasModal } from "./components/LiveCanvasModal";
import { GemsModal, BUILT_IN_GEMS } from "./components/GemsModal";
import { ProjectsModal } from "./components/ProjectsModal";
import { MindmapModal } from "./components/MindmapModal";
import { TelegramBotModal } from "./components/TelegramBotModal";
import { PromoShowcaseModal } from "./components/PromoShowcaseModal";

export interface FileAttachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

// Chat Message structure
interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date | string;
  attachments?: FileAttachment[];
}

// Conversation structure
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date | string;
  userId?: string;
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
  const GEMS_KEY = "osonai_custom_gems";
  const PROJECTS_KEY = "osonai_projects";

  // Auth State
  const [user, setUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Conversations list
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Active conversation ID
  const [activeId, setActiveId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  });

  const [inputMsg, setInputMsg] = useState("");
  const [isAiPending, setIsAiPending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Responsive Layout States (YouTube-like sidebar collapse and mobile drawer)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Conversation rename states
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  // Theme states ("light" or "dark")
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("osonai_theme") as "light" | "dark") || "light";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("osonai_theme", nextTheme);
  };

  // Multilingual Speech Synthesis state
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [speakingLang, setSpeakingLang] = useState<DetectedLang | null>(null);

  // Edit user message state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState<string>("");

  // Attachments & Preview states
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Gems & Personas State
  const [customGems, setCustomGems] = useState<CustomGem[]>([]);
  const [activeGem, setActiveGem] = useState<CustomGem | null>(null);
  const [isGemsModalOpen, setIsGemsModalOpen] = useState(false);

  // Projects / Workspaces State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Live Canvas Sandbox Modal State
  const [liveCanvasCode, setLiveCanvasCode] = useState<{ code: string; language: string } | null>(null);

  // Mindmap Visualizer State
  const [mindmapSource, setMindmapSource] = useState<string | null>(null);

  // Prompt Enhancer State
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Telegram Bot Integration Modal State
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Promo / Pitch Video Showcase Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Speech-to-Text (STT) Hook & Handlers
  const {
    isRecording: isSttRecording,
    isTranscribing: isSttTranscribing,
    formattedDuration: sttDuration,
    audioLevel: sttAudioLevel,
    fullLiveTranscript: sttLiveTranscript,
    selectedLang: sttLang,
    setSelectedLang: setSttLang,
    errorMsg: sttError,
    startRecording: startSttRecording,
    stopRecording: stopSttRecording,
    cancelRecording: cancelSttRecording,
    // Audio device & sensitivity settings
    audioDevices: sttAudioDevices,
    selectedDeviceId: sttSelectedDeviceId,
    setSelectedDeviceId: setSttSelectedDeviceId,
    refreshDevices: refreshSttDevices,
    sensitivity: sttSensitivity,
    setSensitivity: setSttSensitivity,
    threshold: sttThreshold,
    setThreshold: setSttThreshold,
    noiseSuppression: sttNoiseSuppression,
    setNoiseSuppression: setSttNoiseSuppression,
    echoCancellation: sttEchoCancellation,
    setEchoCancellation: setSttEchoCancellation,
    resetSettings: resetSttSettings,
    isTestingMic: isSttTestingMic,
    toggleMicTest: toggleSttMicTest,
    testAudioLevel: sttTestAudioLevel,
  } = useSpeechToText();

  const handleSttApply = async () => {
    const finalText = await stopSttRecording();
    if (finalText && finalText.trim()) {
      setInputMsg((prev) => (prev ? `${prev.trim()} ${finalText.trim()}` : finalText.trim()));
    }
  };

  const handleSttSend = async () => {
    const finalText = await stopSttRecording();
    const textToSend = (inputMsg ? `${inputMsg.trim()} ${finalText || ""}` : (finalText || "")).trim();
    if (textToSend) {
      handleSendMessage(textToSend);
      setInputMsg("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`'${file.name}' faylining hajmi o'ta katta (Maksimal: 25MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type || "application/octet-stream",
              data: result,
              size: file.size
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, msgId: string) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setSpeakingLang(null);
      return;
    }

    playSpeech(
      text,
      (lang) => {
        setSpeakingMsgId(msgId);
        setSpeakingLang(lang);
      },
      () => {
        setSpeakingMsgId(null);
        setSpeakingLang(null);
      },
      () => {
        setSpeakingMsgId(null);
        setSpeakingLang(null);
      }
    );
  };

  // Auth state change listener & cloud data sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Load cloud conversations, projects, custom gems
        const cloudConvs = await loadConversations(currentUser.uid);
        const cloudProjects = await loadProjects(currentUser.uid);
        const cloudGems = await loadCustomGems(currentUser.uid);

        setProjects(cloudProjects);
        setCustomGems(cloudGems);
        
        // If the user has local conversations, sync them
        const localSaved = localStorage.getItem(CONVS_KEY);
        if (localSaved) {
          try {
            const localParsed = JSON.parse(localSaved);
            const meaningfulLocal = localParsed.filter((c: any) => 
              c.messages.length > 1 || (c.messages.length === 1 && c.messages[0].id !== "welcome")
            );
            
            if (meaningfulLocal.length > 0) {
              await syncLocalConversationsToCloud(currentUser.uid, meaningfulLocal);
              localStorage.removeItem(CONVS_KEY);
              const mergedConvs = await loadConversations(currentUser.uid);
              setConversations(mergedConvs);
              return;
            }
          } catch (e) {
            console.error("Local sync error:", e);
          }
        }
        
        setConversations(cloudConvs);
      } else {
        // Logged out: load from localstorage
        const saved = localStorage.getItem(CONVS_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setConversations(parsed);
          } catch (e) {
            console.error(e);
          }
        } else {
          setConversations([]);
        }

        const savedProjects = localStorage.getItem(PROJECTS_KEY);
        if (savedProjects) {
          try { setProjects(JSON.parse(savedProjects)); } catch(e){}
        }

        const savedGems = localStorage.getItem(GEMS_KEY);
        if (savedGems) {
          try { setCustomGems(JSON.parse(savedGems)); } catch(e){}
        }
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Sync to localstorage (only if NOT logged in)
  useEffect(() => {
    if (!user && conversations.length > 0) {
      localStorage.setItem(CONVS_KEY, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(GEMS_KEY, JSON.stringify(customGems));
    }
  }, [projects, customGems, user]);

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_CONV_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }
  }, [activeId]);

  // Current active conversation structure
  const activeConv = conversations.find((c) => c.id === activeId) || null;

  // Auto-sync active conversation to Firestore on change
  useEffect(() => {
    if (user && activeConv) {
      firestoreSaveConversation({
        id: activeConv.id,
        title: activeConv.title,
        messages: activeConv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: typeof m.timestamp === "string" ? m.timestamp : m.timestamp.toISOString(),
          attachments: m.attachments || []
        })),
        createdAt: typeof activeConv.createdAt === "string" ? activeConv.createdAt : activeConv.createdAt.toISOString(),
        userId: user.uid
      });
    }
  }, [conversations, activeId, user]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, isAiPending]);

  // Quick prompt suggestions tailored to active persona/project
  const suggestions: QuickPrompt[] = activeGem?.id === "gem-coder" ? [
    { icon: Code, title: "React & Tailwind", subtitle: "Zamonaviy Glassmorphism UI", prompt: "React va Tailwind CSS yordamida zamonaviy Glassmorphism kartochkasi va interaktiv animatsiyali komponent kodini yozib ber." },
    { icon: Brain, title: "API Arxitekturasi", subtitle: "Express REST API va xavfsizlik", prompt: "JWT autentifikatsiyasi va rate limiting bilan himoyalangan Node.js Express API arxitekturasini tuzib ber." },
    { icon: Compass, title: "Algoritm", subtitle: "Optimizatsiya va Binary Search", prompt: "Binary search algoritmini va uning vaqt murakkabligini vizual misol bilan tushuntirib ber." }
  ] : [
    {
      icon: Code,
      title: "Kod yozish & Sandbox",
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
      title: "G'oya & Startap",
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
          text: activeGem 
            ? `Salom! Men **${activeGem.name}** sifatida xizmatingizdaman. ${activeGem.description}\n\nQanday vazifa ustida ishlaymiz?`
            : "Salom! Men **OsonAI** — sizning universal sun'iy intellekt hamrohingizman. Matnlar yozish, dasturlash, hisob-kitoblar, loyihalash va tahlilda yordam beraman. Bugun nima haqida suhbatlashamiz?",
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      userId: user ? user.uid : undefined
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

  // Handle Smart Prompt Enhancer
  const handleEnhancePrompt = async () => {
    if (!inputMsg.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: inputMsg })
      });
      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        setInputMsg(data.enhancedPrompt);
      }
    } catch (e) {
      console.error("Enhance error:", e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText.trim() : inputMsg.trim();
    if ((!textToSend && attachments.length === 0) || isAiPending) return;

    if (customText === undefined) {
      setInputMsg("");
    }

    const currentAttachments = [...attachments];
    setAttachments([]);

    // Prepare message IDs
    const userMsgId = Math.random().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    let targetConvId = activeId;
    let currentConversations = [...conversations];

    // If no conversation existed or activeId was invalid, create one immediately
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const newId = Math.random().toString();
      targetConvId = newId;
      const titleText = textToSend || (currentAttachments.length > 0 ? currentAttachments[0].name : "Yangi suhbat");
      const newConv: Conversation = {
        id: newId,
        title: titleText.length > 26 ? titleText.slice(0, 26) + "..." : titleText,
        messages: [newUserMsg],
        createdAt: new Date().toISOString(),
        userId: user ? user.uid : undefined
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
          const titleText = textToSend || (currentAttachments.length > 0 ? currentAttachments[0].name : "Yangi suhbat");
          const newTitle = isFirstRealMsg
            ? titleText.length > 26
              ? titleText.slice(0, 26) + "..."
              : titleText
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

    const activeC = currentConversations.find((c) => c.id === targetConvId);

    setIsAiPending(true);

    try {
      const history = activeC
        ? activeC.messages.map((m) => ({
            role: m.role,
            text: m.text,
            attachments: m.attachments
          }))
        : [];

      // Context injection from active Gem & Project
      const projectContextString = activeProject
        ? `FAOL LOYIHA: ${activeProject.title}\nTavsif: ${activeProject.description}\nMaxsus ko'rsatma: ${activeProject.customInstructions || ""}\n${
            activeProject.files && activeProject.files.length > 0
              ? `Loyiha bilimlari:\n` + activeProject.files.map(f => `--- Fayl: ${f.name} ---\n${f.data}`).join("\n\n")
              : ""
          }`
        : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: history.slice(0, -1),
          attachments: currentAttachments,
          customSystemPrompt: activeGem?.systemPrompt || activeProject?.customInstructions,
          gemName: activeGem?.name,
          projectContext: projectContextString
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const responseMsg: Message = {
          id: Math.random().toString(),
          role: "model",
          text: data.reply,
          timestamp: new Date().toISOString()
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
        throw new Error(data.error || "Something went wrong while generating the response.");
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        role: "model",
        text: `⚠️ Something went wrong while generating the response. Please reload the response.\n\nDetails: ${error.message || "Server connection failure"}`,
        timestamp: new Date().toISOString()
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

  // Reload the response (Regenerate from specific model turn)
  const handleReloadResponse = async (modelMsgIndex?: number) => {
    if (!activeId || isAiPending) return;
    const activeC = conversations.find(c => c.id === activeId);
    if (!activeC || activeC.messages.length === 0) return;

    let targetIdx = modelMsgIndex !== undefined ? modelMsgIndex : activeC.messages.length - 1;
    
    // Find the nearest preceding user message
    let userMsgIdx = -1;
    for (let i = targetIdx; i >= 0; i--) {
      if (activeC.messages[i].role === "user") {
        userMsgIdx = i;
        break;
      }
    }

    if (userMsgIdx === -1) return;

    const userMessage = activeC.messages[userMsgIdx];
    
    // Remove the failed/old model message and re-run
    const truncatedMessages = activeC.messages.slice(0, userMsgIdx + 1);
    setConversations(prev => prev.map(c => {
      if (c.id === activeId) {
        return { ...c, messages: truncatedMessages };
      }
      return c;
    }));

    setIsAiPending(true);

    try {
      const history = truncatedMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text,
        attachments: m.attachments
      }));

      const projectContextString = activeProject
        ? `FAOL LOYIHA: ${activeProject.title}\nTavsif: ${activeProject.description}\nMaxsus ko'rsatma: ${activeProject.customInstructions || ""}\n${
            activeProject.files && activeProject.files.length > 0
              ? `Loyiha bilimlari:\n` + activeProject.files.map(f => `--- Fayl: ${f.name} ---\n${f.data}`).join("\n\n")
              : ""
          }`
        : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          history: history,
          attachments: userMessage.attachments || [],
          customSystemPrompt: activeGem?.systemPrompt || activeProject?.customInstructions,
          gemName: activeGem?.name,
          projectContext: projectContextString
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const newModelMsg: Message = {
          id: Math.random().toString(),
          role: "model",
          text: data.reply,
          timestamp: new Date().toISOString()
        };

        setConversations(prev => prev.map(c => {
          if (c.id === activeId) {
            return {
              ...c,
              messages: [...truncatedMessages, newModelMsg]
            };
          }
          return c;
        }));
      } else {
        throw new Error(data.error || "Failed to reload response");
      }
    } catch (err: any) {
      const errModelMsg: Message = {
        id: Math.random().toString(),
        role: "model",
        text: `⚠️ Something went wrong while generating the response. Please reload the response.\n\nDetails: ${err.message || "Server connection failure"}`,
        timestamp: new Date().toISOString()
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          return {
            ...c,
            messages: [...truncatedMessages, errModelMsg]
          };
        }
        return c;
      }));
    } finally {
      setIsAiPending(false);
    }
  };

  // Edit user message and regenerate AI response from that point
  const handleEditUserMessage = async (msgId: string, newText: string) => {
    const textToSend = newText.trim();
    if (!textToSend || !activeId || isAiPending) return;

    setEditingMsgId(null);
    setEditingMsgText("");

    const targetConvId = activeId;
    const activeC = conversations.find((c) => c.id === targetConvId);
    if (!activeC) return;

    const msgIndex = activeC.messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    const updatedMessages = activeC.messages.slice(0, msgIndex + 1).map((m, idx) => {
      if (idx === msgIndex) {
        return {
          ...m,
          text: textToSend,
          timestamp: new Date().toISOString()
        };
      }
      return m;
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            messages: updatedMessages
          };
        }
        return c;
      })
    );

    setIsAiPending(true);

    try {
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        text: m.text,
        attachments: m.attachments
      }));

      const projectContextString = activeProject
        ? `FAOL LOYIHA: ${activeProject.title}\nTavsif: ${activeProject.description}\nMaxsus ko'rsatma: ${activeProject.customInstructions || ""}`
        : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: history,
          attachments: updatedMessages[msgIndex].attachments || [],
          customSystemPrompt: activeGem?.systemPrompt || activeProject?.customInstructions,
          gemName: activeGem?.name,
          projectContext: projectContextString
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const responseMsg: Message = {
          id: Math.random().toString(),
          role: "model",
          text: data.reply,
          timestamp: new Date().toISOString()
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: [...updatedMessages, responseMsg]
              };
            }
            return c;
          })
        );
      } else {
        throw new Error(data.error || "Something went wrong while generating the response.");
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        role: "model",
        text: `⚠️ Something went wrong while generating the response. Please reload the response.\n\nDetails: ${error.message || "Connection error"}`,
        timestamp: new Date().toISOString()
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: [...updatedMessages, errorMsg]
            };
          }
          return c;
        })
      );
    } finally {
      setIsAiPending(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (user) {
      await deleteConversationDoc(id);
    }

    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);

    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
      } else {
        createNewChat();
      }
    }
  };

  // Start renaming conversation
  const startEditingTitle = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(id);
    setEditingTitle(currentTitle);
  };

  // Save new title
  const saveEditedTitle = (id: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, title: editingTitle.trim() };
        }
        return c;
      })
    );
    setEditingConvId(null);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Custom Gems CRUD Handlers
  const handleCreateGem = async (gem: CustomGem) => {
    setCustomGems(prev => [gem, ...prev]);
    if (user) {
      await saveCustomGem({ ...gem, userId: user.uid });
    }
  };

  const handleDeleteGem = async (gemId: string) => {
    setCustomGems(prev => prev.filter(g => g.id !== gemId));
    if (activeGem?.id === gemId) {
      setActiveGem(null);
    }
    if (user) {
      await deleteCustomGemDoc(gemId);
    }
  };

  // Projects CRUD Handlers
  const handleCreateProject = async (proj: Project) => {
    setProjects(prev => [proj, ...prev]);
    if (user) {
      await saveProject({ ...proj, userId: user.uid });
    }
  };

  const handleUpdateProject = async (proj: Project) => {
    setProjects(prev => prev.map(p => p.id === proj.id ? proj : p));
    if (activeProject?.id === proj.id) {
      setActiveProject(proj);
    }
    if (user) {
      await saveProject({ ...proj, userId: user.uid });
    }
  };

  const handleDeleteProject = async (projId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projId));
    if (activeProject?.id === projId) {
      setActiveProject(null);
    }
    if (user) {
      await deleteProjectDoc(projId);
    }
  };

  // Sidebar width logic
  const sidebarWidthClass = isSidebarCollapsed ? "w-[72px]" : "w-[270px]";

  // Render Sidebar Content (Shared between desktop and mobile drawer)
  const renderSidebarContent = (isMobile: boolean) => {
    const isNarrow = isSidebarCollapsed && !isMobile;

    return (
      <div className={`h-full flex flex-col justify-between border-r transition-colors duration-200 ${
        theme === "light"
          ? "bg-[#f8fafd] border-[#e3e3e3] text-[#1f1f1f]"
          : "bg-[#111422] border-[#24273c] text-slate-100"
      }`}>
        {/* TOP SECTION: Header & Actions */}
        <div className="flex flex-col gap-3 p-3 min-w-0">
          
          {/* Logo & Toggle Header */}
          <div className="flex items-center justify-between px-1 h-9">
            <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => createNewChat()}>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              {(!isNarrow || isMobile) && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`font-bold tracking-tight text-[15px] font-sans ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                    OsonAI
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                    Pro
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {isMobile && (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`p-1.5 rounded-lg transition ${
                  theme === "light" ? "hover:bg-[#e1e5ea] text-slate-600" : "hover:bg-[#1f233a] text-slate-400"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              createNewChat();
              if (isMobile) setIsMobileSidebarOpen(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-2xl transition font-medium cursor-pointer shadow-sm ${
              theme === "light"
                ? "bg-[#e8edf5] hover:bg-[#d8e2f0] text-slate-800"
                : "bg-[#1c2035] hover:bg-[#252b47] text-slate-100 border border-slate-700/50"
            } ${
              isNarrow 
                ? "h-11 w-11 mx-auto" 
                : "w-full px-3.5 py-2.5 text-xs"
            }`}
            title="Yangi suhbat boshlash"
          >
            <Plus className="h-4 w-4 text-cyan-500 shrink-0" />
            {(!isNarrow || isMobile) && <span className="font-semibold">Yangi suhbat</span>}
          </button>

          {/* Special Hub Navigations: Gems & Projects */}
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-700/20">
            {/* Gems Button */}
            <button
              onClick={() => setIsGemsModalOpen(true)}
              className={`flex items-center gap-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
                activeGem
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                  : theme === "light"
                    ? "hover:bg-[#e8edf5] text-slate-700"
                    : "hover:bg-[#1a1d30] text-slate-300"
              } ${isNarrow ? "h-10 w-10 justify-center mx-auto" : "px-3 py-2 w-full justify-between"}`}
              title="Gems & AI Personalar"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                {(!isNarrow || isMobile) && (
                  <span className="truncate">Gems & Agentlar</span>
                )}
              </div>
              {(!isNarrow || isMobile) && activeGem && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono truncate max-w-[80px]">
                  {activeGem.name}
                </span>
              )}
            </button>

            {/* Projects Button */}
            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className={`flex items-center gap-2.5 rounded-xl transition text-xs font-semibold cursor-pointer ${
                activeProject
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  : theme === "light"
                    ? "hover:bg-[#e8edf5] text-slate-700"
                    : "hover:bg-[#1a1d30] text-slate-300"
              } ${isNarrow ? "h-10 w-10 justify-center mx-auto" : "px-3 py-2 w-full justify-between"}`}
              title="Projects (Loyihalar Markazi)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderGit2 className="h-4 w-4 text-blue-400 shrink-0" />
                {(!isNarrow || isMobile) && (
                  <span className="truncate">Projects (Loyihalar)</span>
                )}
              </div>
              {(!isNarrow || isMobile) && activeProject && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono truncate max-w-[80px]">
                  {activeProject.title}
                </span>
              )}
            </button>
          </div>

          {/* Conversations History List */}
          {(!isNarrow || isMobile) && (
            <div className="mt-1 flex items-center justify-between px-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>
                Suhbatlar tarixi ({conversations.length})
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 max-h-[calc(100vh-340px)]">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = conv.id === editingConvId;

              if (isNarrow) {
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    className={`h-10 w-10 mx-auto rounded-xl flex items-center justify-center transition cursor-pointer ${
                      isActive
                        ? theme === "light"
                          ? "bg-cyan-100 text-cyan-800 shadow-sm"
                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : theme === "light"
                          ? "text-slate-600 hover:bg-[#e8edf5]"
                          : "text-slate-400 hover:bg-[#1a1d30]"
                    }`}
                    title={conv.title}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                );
              }

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveId(conv.id);
                    if (isMobile) setIsMobileSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? theme === "light"
                        ? "bg-[#e2ebf7] text-[#0b57d0] font-semibold"
                        : "bg-[#1c223c] text-cyan-400 border border-cyan-500/20"
                      : theme === "light"
                        ? "text-[#444746] hover:bg-[#eef2f8]"
                        : "text-slate-400 hover:bg-[#16192a] hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-cyan-500" : "text-slate-500"}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveEditedTitle(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditedTitle(conv.id);
                          if (e.key === "Escape") setEditingConvId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full text-xs px-1.5 py-0.5 rounded outline-none border ${
                          theme === "light"
                            ? "bg-white border-cyan-400 text-slate-900"
                            : "bg-[#0b0d17] border-cyan-500 text-cyan-200"
                        }`}
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditingTitle(conv.id, conv.title, e)}
                        className={`p-1 rounded-md transition ${
                          theme === "light" ? "hover:bg-[#d8e2f0] text-slate-500" : "hover:bg-[#252b47] text-slate-400"
                        }`}
                        title="Nomini o'zgartirish"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className={`p-1 rounded-md transition ${
                          theme === "light" ? "hover:bg-[#d8e2f0] text-slate-500 hover:text-red-600" : "hover:bg-[#252b47] text-slate-400 hover:text-red-400"
                        }`}
                        title="O'chirish"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SECTION: User Auth & App Settings */}
        <div className={`p-3 border-t flex flex-col gap-2.5 ${
          theme === "light" ? "border-[#e3e3e3]" : "border-[#24273c]"
        }`}>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-between rounded-xl transition text-xs font-medium cursor-pointer ${
              theme === "light"
                ? "bg-[#e8edf5] hover:bg-[#d8e2f0] text-slate-700"
                : "bg-[#181c2e] hover:bg-[#22273f] text-slate-300"
            } ${
              isNarrow 
                ? "h-9 w-9 mx-auto justify-center p-0" 
                : "w-full px-3 py-2"
            }`}
            title={theme === "light" ? "Tungi rejimga o'tish" : "Kunduzgi rejimga o'tish"}
          >
            <div className="flex items-center gap-2">
              {theme === "light" ? (
                <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              {(!isNarrow || isMobile) && (
                <span>{theme === "light" ? "Tungi rejim" : "Kunduzgi rejim"}</span>
              )}
            </div>
            {(!isNarrow || isMobile) && (
              <span className="text-[10px] text-slate-500 font-mono">
                {theme === "light" ? "Dark" : "Light"}
              </span>
            )}
          </button>

          {/* User Account / Login State */}
          {isAuthLoading ? (
            <div className="h-10 flex items-center justify-center">
              <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-7 w-7 rounded-full border border-cyan-500/30 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    theme === "light" ? "bg-cyan-600 text-white" : "bg-cyan-500 text-[#0f111a]"
                  }`}>
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                {(!isNarrow || isMobile) && (
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-bold truncate ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>{user.displayName || "Foydalanuvchi"}</p>
                    <p className="text-[9px] text-slate-500 truncate font-mono">{user.email}</p>
                  </div>
                )}
                {(!isNarrow || isMobile) && (
                  <button
                    onClick={logout}
                    className={`p-1 rounded-lg transition cursor-pointer shrink-0 ${
                      theme === "light" ? "hover:bg-[#d3e3fd] text-slate-500 hover:text-red-600" : "hover:bg-[#1d2035] text-slate-400 hover:text-red-400"
                    }`}
                    title="Chiqish"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {(!isNarrow || isMobile) && (
                <div className={`text-[9px] font-medium flex items-center gap-1 px-1.5 py-0.5 rounded self-start ${
                  theme === "light"
                    ? "text-cyan-800 bg-cyan-100/60 border border-cyan-200"
                    : "text-cyan-400 bg-cyan-950/40 border border-cyan-500/20"
                }`}>
                  <span className={`h-1 w-1 rounded-full animate-pulse ${theme === "light" ? "bg-cyan-600" : "bg-cyan-400"}`}></span>
                  <span>Bulut faol</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={signInWithGoogle}
                className={`flex items-center justify-center gap-2 font-bold rounded-xl transition cursor-pointer shadow-md ${
                  theme === "light"
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                    : "bg-cyan-500 hover:bg-cyan-400 text-[#0f111a]"
                } ${
                  isNarrow 
                    ? "h-9 w-9 mx-auto" 
                    : "w-full px-2.5 py-2 text-xs"
                }`}
                title="Google orqali kirish"
              >
                <LogIn className="h-3.5 w-3.5" />
                {(!isNarrow || isMobile) && <span>Google</span>}
              </button>
              {(!isNarrow || isMobile) && (
                <p className="text-[8px] text-slate-500 text-center">
                  Saqlash uchun kiring
                </p>
              )}
            </div>
          )}
          {(!isNarrow || isMobile) && (
            <div className={`flex items-center justify-between text-[10px] pt-1.5 border-t ${
              theme === "light" ? "border-slate-300 text-slate-500" : "border-[#24273c] text-slate-500"
            }`}>
              <span className="flex items-center gap-1">
                <Cpu className={`h-3 w-3 ${theme === "light" ? "text-emerald-600" : "text-emerald-400"}`} />
                <span className={`font-mono ${theme === "light" ? "text-emerald-600 font-semibold" : "text-emerald-400"}`}>Oson v2.55</span>
              </span>
              <span className={`cursor-pointer ${theme === "light" ? "hover:text-slate-800" : "hover:text-slate-300"}`}>Maxfiylik</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-200 ${
      theme === "light" ? "bg-[#ffffff] text-[#1f1f1f]" : "bg-[#0f111a] text-slate-100"
    }`}>
      
      {/* MOBILE DRAWER BACKDROP */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER CONTENT */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-50 w-[270px] shrink-0 md:hidden shadow-2xl"
          >
            {renderSidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR: Collapsible, like YouTube */}
      <aside 
        className={`hidden md:block shrink-0 h-full transition-all duration-200 ease-in-out ${sidebarWidthClass}`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* RIGHT SIDEBAR: Pure Chat Workspace */}
      <main className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-200 ${
        theme === "light" ? "bg-[#ffffff]" : "bg-[#0f111a]"
      }`}>
        
        {/* Dynamic Mobile and Desktop workspace header */}
        <header className={`h-14 md:h-16 border-b px-4 md:px-6 flex items-center justify-between shrink-0 z-10 transition-colors ${
          theme === "light" 
            ? "border-[#e3e3e3] bg-[#ffffff] text-[#1f1f1f]" 
            : "border-[#24273c] bg-[#131623] text-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`p-2 rounded-xl md:hidden transition cursor-pointer ${
                theme === "light" ? "hover:bg-[#f0f4f9] text-slate-700" : "hover:bg-[#1c2035] text-slate-300"
              }`}
              title="Menyu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop YouTube-style toggle sidebar button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`hidden md:flex p-2 rounded-xl transition cursor-pointer ${
                theme === "light" ? "hover:bg-[#f0f4f9] text-slate-700" : "hover:bg-[#1c2035] text-slate-300"
              }`}
              title={isSidebarCollapsed ? "Yon panelni kengaytirish" : "Yon panelni yig'ish"}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm md:text-base tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                {activeConv?.title || "OsonAI - Artificial intelligence"}
              </h2>

              {/* Active Gem indicator pill */}
              {activeGem && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{activeGem.name}</span>
                  <button
                    onClick={() => setActiveGem(null)}
                    className="ml-1 hover:text-white"
                    title="Gedan chiqish"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Active Project indicator pill */}
              {activeProject && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FolderGit2 className="h-3 w-3" />
                  <span className="truncate max-w-[120px]">{activeProject.title}</span>
                  <button
                    onClick={() => setActiveProject(null)}
                    className="ml-1 hover:text-white"
                    title="Loyihadan chiqish"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Gems button */}
            <button
              onClick={() => setIsGemsModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                theme === "light"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-[#1a1e33] hover:bg-[#232944] text-cyan-300 border-[#2b3152]"
              }`}
              title="Gems & Personalar"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden lg:inline">Gems</span>
            </button>

            {/* Quick Projects button */}
            <button
              onClick={() => setIsProjectsModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                theme === "light"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  : "bg-[#1a1e33] hover:bg-[#232944] text-blue-300 border-[#2b3152]"
              }`}
              title="Projects (Loyihalar)"
            >
              <FolderGit2 className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden lg:inline">Projects</span>
            </button>

            {/* Telegram Bot button */}
            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                theme === "light"
                  ? "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200"
                  : "bg-[#14243b] hover:bg-[#1a3152] text-sky-300 border-[#1f3f6e]"
              }`}
              title="OsonAI Telegram Boti (@osonaiuzbot)"
            >
              <Send className="h-3.5 w-3.5 text-sky-400 -translate-x-0.5" />
              <span className="hidden sm:inline">Telegram Bot</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Video / Promo Showcase button for Screen Recording */}
            <button
              onClick={() => setIsPromoModalOpen(true)}
              className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                theme === "light"
                  ? "bg-gradient-to-r from-amber-50 to-cyan-50 hover:from-amber-100 hover:to-cyan-100 text-slate-800 border-amber-300/80"
                  : "bg-gradient-to-r from-amber-500/15 to-cyan-500/15 hover:from-amber-500/25 hover:to-cyan-500/25 text-amber-300 border-amber-500/30"
              }`}
              title="OsonAI 60s Video & Taqdimot Rejimi (Screen Record uchun)"
            >
              <Award className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline font-bold">Taqdimot (60s Video)</span>
            </button>

            {/* Speaking voice status badge */}
            {speakingMsgId && speakingLang && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                <span>{speakingLang.flag}</span>
                <span className="hidden sm:inline">{speakingLang.name} spikeri</span>
                <Volume2 className="h-3.5 w-3.5 animate-bounce" />
              </div>
            )}
          </div>
        </header>

        {/* CHAT MESSAGES SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between">
          
          {/* If the conversation is empty or just has welcome message, show clean home prompts */}
          {activeConv && activeConv.messages.length <= 1 && (
            <div className="max-w-3xl mx-auto w-full my-auto py-8 flex flex-col items-center text-center">
              
              <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white mb-4 shadow-2xl shadow-cyan-500/30 ring-4 ring-cyan-500/20">
                <Sparkles className="h-8 w-8" />
              </div>

              <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}>
                {activeGem ? activeGem.name : activeProject ? activeProject.title : "OsonAI — Sun'iy Intellekt"}
              </h1>

              <p className={`text-sm md:text-base max-w-lg mb-8 leading-relaxed ${
                theme === "light" ? "text-slate-600" : "text-slate-400"
              }`}>
                {activeGem 
                  ? activeGem.description 
                  : activeProject 
                    ? `Faol Loyiha maydoni: ${activeProject.description}`
                    : "Universal sun'iy intellekt tizimi: kod yozish, tahlil qilish, loyihalar va ko'p tilli audio tinglash."}
              </p>

              {/* Quick suggestions cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {suggestions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        theme === "light"
                          ? "bg-[#f8fafd] hover:bg-[#f0f4f9] border-[#e3e3e3] hover:border-cyan-400 shadow-sm"
                          : "bg-[#141727] hover:bg-[#1c2035] border-[#24273c] hover:border-cyan-500/50 shadow-lg"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-1.5">
                        <div className={`p-2 rounded-xl ${
                          theme === "light" ? "bg-cyan-100 text-cyan-800" : "bg-cyan-500/15 text-cyan-400"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-xs md:text-sm">{item.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 group-hover:text-cyan-500 transition-colors">
                        {item.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Telegram Bot Callout Banner */}
              <div
                onClick={() => setIsTelegramModalOpen(true)}
                className={`mt-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition w-full max-w-2xl ${
                  theme === "light"
                    ? "bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border-sky-200/80 shadow-sm"
                    : "bg-gradient-to-r from-[#121c2e] to-[#162540] hover:from-[#18263d] hover:to-[#1d3052] border-sky-500/20 shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/25">
                    <Send className="w-5 h-5 -translate-x-0.5 translate-y-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm">OsonAI Telegram Boti (@osonaiuzbot)</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Faol
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Istalgan joydan Telegram orqali savol-javob qiling, rasm chizing va tahlil qiling
                    </p>
                  </div>
                </div>
                <div className="shrink-0 hidden sm:flex items-center gap-1 text-xs font-semibold text-sky-500">
                  <span>Ochish</span>
                  <ArrowUp className="w-4 h-4 rotate-45" />
                </div>
              </div>

              {/* 60s Video Rejimi & Taqdimot Callout Banner */}
              <div
                onClick={() => setIsPromoModalOpen(true)}
                className={`mt-2.5 p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition w-full max-w-2xl ${
                  theme === "light"
                    ? "bg-gradient-to-r from-amber-50 via-cyan-50 to-blue-50 hover:opacity-95 border-amber-200/80 shadow-sm"
                    : "bg-gradient-to-r from-[#211b15] via-[#12212f] to-[#141b2e] hover:opacity-95 border-amber-500/30 shadow-md"
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-amber-500/20">
                    <Play className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm">OsonAI Jonli Demo & 60s Video Rejimi</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Screen Record
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Haqiqiy OsonAI interfeysi: chatga prompt yozilishi, AI javobi, Live Canvas va ovozli boshqaruvni 60 soniyada videoga oling!
                    </p>
                  </div>
                </div>
                <div className="shrink-0 hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-500">
                  <span>Tomosha</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* Render real message list */}
          {activeConv && activeConv.messages.length > 1 && (
            <div className="max-w-3xl mx-auto w-full space-y-6 pb-4">
              {activeConv.messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex gap-3.5 ${
                    msg.role === "user" ? "flex-row-reverse max-w-[85%] ml-auto" : "max-w-[90%] mr-auto"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      msg.role === "user"
                        ? theme === "light"
                          ? "bg-cyan-600 text-white border-cyan-700"
                          : "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                        : msg.isFromAdmin
                          ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20"
                          : theme === "light"
                            ? "bg-[#e6f4ea] text-[#137333] border-[#c4eed0]"
                            : "bg-[#162723] text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Body */}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {msg.role === "user" ? (user?.displayName || "Siz") : (activeGem?.name || "OsonAI")}
                      </span>
                    </div>

                    {/* Inline Editing for User Message */}
                    {editingMsgId === msg.id && msg.role === "user" ? (
                      <div className={`p-3 rounded-2xl border ${
                        theme === "light" ? "bg-white border-cyan-400 shadow-md" : "bg-[#151829] border-cyan-500"
                      }`}>
                        <textarea
                          value={editingMsgText}
                          onChange={(e) => setEditingMsgText(e.target.value)}
                          className="w-full text-xs md:text-sm bg-transparent outline-none resize-none leading-relaxed"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingMsgId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-300"
                          >
                            Bekor qilish
                          </button>
                          <button
                            onClick={() => handleEditUserMessage(msg.id, editingMsgText)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-[#0f111a] transition shadow-md"
                          >
                            Saqlash va qaytadan yuborish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl px-4 py-3.5 text-[14px] md:text-[15px] leading-relaxed border select-text ${
                          msg.role === "user"
                            ? theme === "light"
                              ? "bg-[#f0f4f9] text-[#1f1f1f] border-[#e3e3e3] rounded-tr-none shadow-sm"
                              : "bg-[#1a1d35] text-cyan-50 border-[#2d325c] rounded-tr-none shadow-xl"
                            : theme === "light"
                              ? "bg-[#ffffff] text-[#1f1f1f] border-[#e3e3e3] rounded-tl-none shadow-sm"
                              : "bg-[#131623] text-slate-200 border-[#24273c] rounded-tl-none shadow-2xl"
                        }`}
                      >
                        {/* Display uploaded attachments if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 mb-3 pb-3 border-b border-slate-500/20">
                            {msg.attachments.map((att, attIdx) => (
                              <div key={attIdx} className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/40 p-1.5">
                                {att.type.startsWith("image/") ? (
                                  <div className="relative group cursor-pointer" onClick={() => setPreviewImageModal(att.data)}>
                                    <img
                                      src={att.data}
                                      alt={att.name}
                                      className="max-h-48 max-w-xs object-cover rounded-lg hover:opacity-90 transition"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                                      <Eye className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <a
                                    href={att.data}
                                    download={att.name}
                                    className="flex items-center gap-2 px-3 py-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                                  >
                                    <File className="h-4 w-4" />
                                    <span className="truncate max-w-[160px]">{att.name}</span>
                                    <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                                    <Download className="h-3.5 w-3.5 ml-1" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {parseMarkdownAndCode(msg.text).map((part, partIdx) => {
                          if (part.type === "code") {
                             const codeContent = part.content.trim();
                             return (
                               <div key={partIdx} className={`my-3.5 border rounded-xl overflow-hidden shadow-inner font-mono text-xs ${
                                 theme === "light" ? "bg-[#f8f9fa] border-[#e3e3e3]" : "bg-[#0a0c14] border-slate-800"
                               }`}>
                                 <div className={`px-4 py-2 border-b flex items-center justify-between ${
                                   theme === "light" ? "bg-[#f0f4f9] border-[#e3e3e3] text-slate-600" : "bg-[#131623] border-slate-800/80 text-slate-400"
                                 }`}>
                                   <span className="text-[10px] font-bold uppercase tracking-wider">{part.language || "code"}</span>
                                   
                                   <div className="flex items-center gap-1.5">
                                     {/* Live Preview Button */}
                                     <button
                                       onClick={() => setLiveCanvasCode({ code: codeContent, language: part.language || "html" })}
                                       className="text-[10px] px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer font-sans bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-bold"
                                       title="Jonli sandboxda ko'rish va ishga tushirish"
                                     >
                                       <Play className="h-3 w-3 text-cyan-400 fill-cyan-400" />
                                       <span>Live Preview</span>
                                     </button>

                                     {/* Copy Code */}
                                     <button
                                       onClick={() => handleCopy(codeContent, msg.id + partIdx)}
                                       className={`text-[10px] px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer font-sans ${
                                         theme === "light" 
                                           ? "bg-slate-200/80 hover:bg-slate-200 text-slate-700" 
                                           : "bg-slate-800/60 hover:bg-slate-800 text-slate-300"
                                       }`}
                                     >
                                       {copiedId === msg.id + partIdx ? (
                                         <>
                                           <Check className="h-3 w-3 text-emerald-500" />
                                           <span className="text-emerald-500 font-bold">Nusxalandi</span>
                                         </>
                                       ) : (
                                         <>
                                           <Copy className="h-3 w-3" />
                                           <span>Nusxa olish</span>
                                         </>
                                       )}
                                     </button>
                                   </div>
                                 </div>
                                 <pre className={`p-4 overflow-x-auto leading-relaxed max-h-[350px] select-text ${
                                   theme === "light" ? "text-slate-800" : "text-cyan-300/90"
                                 }`}>
                                   <code>{codeContent}</code>
                                 </pre>
                               </div>
                             );
                          }

                          // Parse markdown images and bold text
                          return (
                            <div key={partIdx} className="whitespace-pre-wrap select-text">
                              {part.content.split("\n").map((line, lineIdx) => {
                                const imageMarkdownRegex = /!\[(.*?)\]\((.*?)\)/g;
                                const imgMatches = [...line.matchAll(imageMarkdownRegex)];

                                if (imgMatches.length > 0) {
                                  return (
                                    <div key={lineIdx} className="my-3">
                                      {imgMatches.map((match, imgIdx) => {
                                        const altText = match[1];
                                        const imageUrl = match[2];
                                        return (
                                          <div key={imgIdx} className="relative group max-w-md my-2 rounded-2xl overflow-hidden border border-slate-700/50 bg-black/20 shadow-xl">
                                            <img
                                              src={imageUrl}
                                              alt={altText || "AI Image"}
                                              className="w-full h-auto max-h-[420px] object-cover rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                                              onClick={() => setPreviewImageModal(imageUrl)}
                                              referrerPolicy="no-referrer"
                                            />
                                            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={() => setPreviewImageModal(imageUrl)}
                                                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs flex items-center gap-1 cursor-pointer shadow-md"
                                                title="Katta o'lchamda ko'rish"
                                              >
                                                <Eye className="h-3.5 w-3.5" />
                                              </button>
                                              <a
                                                href={imageUrl}
                                                download="osonai-image.jpg"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white backdrop-blur-md text-xs flex items-center gap-1 cursor-pointer shadow-md"
                                                title="Rasmni yuklab olish"
                                              >
                                                <Download className="h-3.5 w-3.5" />
                                              </a>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                const boldRegex = /\*\*(.*?)\*\*/g;
                                const elements = [];
                                let lastTextIdx = 0;
                                let boldMatch;

                                while ((boldMatch = boldRegex.exec(line)) !== null) {
                                  if (boldMatch.index > lastTextIdx) {
                                    elements.push(line.slice(lastTextIdx, boldMatch.index));
                                  }
                                  elements.push(
                                    <strong key={boldMatch.index} className={`font-bold ${
                                      theme === "light" ? "text-cyan-700 font-bold" : "text-cyan-400"
                                    }`}>
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
                    )}

                    {/* Action buttons below message */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {msg.role !== "user" ? (
                        <>
                          <button
                            onClick={() => handleCopy(msg.text, `msg-${msg.id}`)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              copiedId === `msg-${msg.id}`
                                ? theme === "light"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : theme === "light"
                                  ? "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900 border border-[#e3e3e3]"
                                  : "bg-[#131623] hover:bg-[#1a1d2e] text-slate-400 hover:text-slate-200 border border-[#24273c]"
                            }`}
                            title="Javobni nusxalash"
                          >
                            {copiedId === `msg-${msg.id}` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Nusxalandi</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Nusxalash</span>
                              </>
                            )}
                          </button>

                          {/* Multilingual Speech with Language Awareness */}
                          <button
                            onClick={() => speakText(msg.text, msg.id)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              speakingMsgId === msg.id
                                ? theme === "light"
                                  ? "bg-cyan-100 text-cyan-800 border border-cyan-300"
                                  : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : theme === "light"
                                  ? "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900 border border-[#e3e3e3]"
                                  : "bg-[#131623] hover:bg-[#1a1d2e] text-slate-400 hover:text-slate-200 border border-[#24273c]"
                            }`}
                            title={speakingMsgId === msg.id ? "Ovozni to'xtatish" : "Ovozli o'qish (Avtomatik til aniqlovchi)"}
                          >
                            {speakingMsgId === msg.id ? (
                              <>
                                <VolumeX className="h-3.5 w-3.5 animate-pulse text-cyan-500" />
                                <span>To'xtatish</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5" />
                                <span>Tinglash</span>
                              </>
                            )}
                          </button>

                          {/* AI MindMap Visualizer */}
                          <button
                            onClick={() => setMindmapSource(msg.text)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              theme === "light"
                                ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30"
                            }`}
                            title="Javobni mantiqiy MindMap xaritasida ko'rish"
                          >
                            <Network className="h-3.5 w-3.5 text-purple-400" />
                            <span>MindMap</span>
                          </button>

                          {/* "Reload the response" button */}
                          <button
                            onClick={() => handleReloadResponse(index)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              msg.text.includes("Something went wrong") || msg.text.includes("xatolik")
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-bold"
                                : theme === "light"
                                  ? "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900 border border-[#e3e3e3]"
                                  : "bg-[#131623] hover:bg-[#1a1d2e] text-slate-400 hover:text-slate-200 border border-[#24273c]"
                            }`}
                            title="Reload the response"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                            <span>Reload the response</span>
                          </button>
                        </>
                      ) : (
                        editingMsgId !== msg.id && (
                          <>
                            <button
                              onClick={() => handleCopy(msg.text, `msg-${msg.id}`)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                                copiedId === `msg-${msg.id}`
                                  ? theme === "light"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : theme === "light"
                                    ? "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900 border border-[#e3e3e3]"
                                    : "bg-[#131623] hover:bg-[#1a1d2e] text-slate-400 hover:text-slate-200 border border-[#24273c]"
                              }`}
                              title="Savolni nusxalash"
                            >
                              {copiedId === `msg-${msg.id}` ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Nusxalandi</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Nusxalash</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditingMsgText(msg.text);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                                theme === "light"
                                  ? "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900 border border-[#e3e3e3]"
                                  : "bg-[#131623] hover:bg-[#1a1d2e] text-slate-400 hover:text-slate-200 border border-[#24273c]"
                              }`}
                              title="Xabarni tahrirlash"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Tahrirlash</span>
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot typing state loader */}
              {isAiPending && (
                <div className="flex gap-4 max-w-[80%] mr-auto">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    theme === "light"
                      ? "bg-[#e6f4ea] text-[#137333] border-[#c4eed0]"
                      : "bg-[#162723] text-emerald-400 border border-emerald-500/20"
                  }`}>
                    <Bot className="h-4.5 w-4.5 animate-bounce" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 font-mono">OsonAI • javob tayyorlamoqda</span>
                    <div className={`rounded-2xl rounded-tl-none px-4 py-3.5 shadow-2xl border ${
                      theme === "light"
                        ? "bg-[#ffffff] text-slate-800 border-[#e3e3e3]"
                        : "bg-[#131623] text-slate-300 border-[#24273c]"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`h-1.5 w-1.5 rounded-full animate-ping ${theme === "light" ? "bg-cyan-600" : "bg-cyan-400"}`}></span>
                        <span className={`text-xs font-mono animate-pulse ${theme === "light" ? "text-cyan-700 font-semibold" : "text-cyan-400"}`}>Javob tayyorlanmoqda...</span>
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
        <footer className={`p-4 border-t shrink-0 transition-colors duration-200 ${
          theme === "light" ? "bg-[#ffffff] border-[#e3e3e3]" : "bg-[#131623] border-[#24273c]"
        }`}>
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-2.5">
            
            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-slate-500/10 border border-slate-500/20 max-h-32 overflow-y-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border bg-slate-800 text-slate-100 border-slate-700 shadow-sm">
                    {att.type.startsWith("image/") ? (
                      <img src={att.data} alt={att.name} className="h-6 w-6 rounded object-cover" />
                    ) : (
                      <FileText className="h-4 w-4 text-cyan-400" />
                    )}
                    <span className="max-w-[130px] truncate font-medium">{att.name}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(att.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
                      title="Faylni o'chirish"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            {isSttRecording || isSttTranscribing ? (
              <SpeechToTextInput
                isRecording={isSttRecording}
                isTranscribing={isSttTranscribing}
                duration={sttDuration}
                audioLevel={sttAudioLevel}
                liveTranscript={sttLiveTranscript}
                selectedLang={sttLang}
                onSelectLang={setSttLang}
                onStartRecording={startSttRecording}
                onStopAndApply={handleSttApply}
                onStopAndSend={handleSttSend}
                onCancel={cancelSttRecording}
                errorMsg={sttError}
                theme={theme}
                disabled={isAiPending}
                audioDevices={sttAudioDevices}
                selectedDeviceId={sttSelectedDeviceId}
                onSelectDevice={setSttSelectedDeviceId}
                sensitivity={sttSensitivity}
                onChangeSensitivity={setSttSensitivity}
                threshold={sttThreshold}
                onChangeThreshold={setSttThreshold}
                noiseSuppression={sttNoiseSuppression}
                onChangeNoiseSuppression={setSttNoiseSuppression}
                echoCancellation={sttEchoCancellation}
                onChangeEchoCancellation={setSttEchoCancellation}
                onResetSettings={resetSttSettings}
                onRefreshDevices={refreshSttDevices}
                isTestingMic={isSttTestingMic}
                onToggleMicTest={toggleSttMicTest}
                testAudioLevel={sttTestAudioLevel}
              />
            ) : (
              <div className={`relative flex items-center gap-2 rounded-3xl p-1.5 md:p-2 border transition-all ${
                theme === "light"
                  ? "bg-[#f0f4f9] border-[#d3e3fd] focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-sm"
                  : "bg-[#1a1d30] border-[#2a2f4d] focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 shadow-xl"
              }`}>
                
                {/* File upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
                    theme === "light"
                      ? "hover:bg-[#e1e5ea] text-slate-600 hover:text-slate-900"
                      : "hover:bg-[#252b47] text-slate-400 hover:text-cyan-400"
                  }`}
                  title="Barcha turdagi fayllarni biriktirish (Rasm, PDF, Kod, Hujjatlar)"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />

                {/* Main text input field */}
                <textarea
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    activeGem 
                      ? `${activeGem.name}ga savol yoki topshiriq bering...`
                      : activeProject 
                        ? `${activeProject.title} loyihasi bo'yicha so'rang...`
                        : "OsonAI ga istalgan savol bering yoki topshiriq yuklang..."
                  }
                  rows={1}
                  className="w-full text-xs md:text-sm bg-transparent outline-none resize-none leading-relaxed px-2 py-1 max-h-32 placeholder:text-slate-400"
                />

                {/* Speech-to-Text Microphone button */}
                <SpeechToTextInput
                  isRecording={isSttRecording}
                  isTranscribing={isSttTranscribing}
                  duration={sttDuration}
                  audioLevel={sttAudioLevel}
                  liveTranscript={sttLiveTranscript}
                  selectedLang={sttLang}
                  onSelectLang={setSttLang}
                  onStartRecording={startSttRecording}
                  onStopAndApply={handleSttApply}
                  onStopAndSend={handleSttSend}
                  onCancel={cancelSttRecording}
                  errorMsg={sttError}
                  theme={theme}
                  disabled={isAiPending}
                  audioDevices={sttAudioDevices}
                  selectedDeviceId={sttSelectedDeviceId}
                  onSelectDevice={setSttSelectedDeviceId}
                  sensitivity={sttSensitivity}
                  onChangeSensitivity={setSttSensitivity}
                  threshold={sttThreshold}
                  onChangeThreshold={setSttThreshold}
                  noiseSuppression={sttNoiseSuppression}
                  onChangeNoiseSuppression={setSttNoiseSuppression}
                  echoCancellation={sttEchoCancellation}
                  onChangeEchoCancellation={setSttEchoCancellation}
                  onResetSettings={resetSttSettings}
                  onRefreshDevices={refreshSttDevices}
                  isTestingMic={isSttTestingMic}
                  onToggleMicTest={toggleSttMicTest}
                  testAudioLevel={sttTestAudioLevel}
                />

                {/* Smart Prompt Enhancer Wand */}
                {inputMsg.trim().length > 3 && (
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancingPrompt}
                    className={`p-2 rounded-2xl transition flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer ${
                      isEnhancingPrompt
                        ? "bg-purple-500/20 text-purple-300 animate-pulse"
                        : "bg-purple-500/10 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30"
                    }`}
                    title="Promptni professional darajada boyitish va takomillashtirish"
                  >
                    <Wand2 className={`h-4 w-4 ${isEnhancingPrompt ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Enhance</span>
                  </button>
                )}

                {/* Send message button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMsg.trim() && attachments.length === 0) || isAiPending}
                  className="p-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-[#0f111a] transition cursor-pointer shrink-0 font-bold shadow-md shadow-cyan-500/20"
                  title="Xabarni yuborish"
                >
                  <ArrowUp className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-500 text-center">
              OsonAI noto'g'ri ma'lumot berishi mumkin. Muhim ma'lumotlarni tekshiring.
            </p>
          </div>
        </footer>
      </main>

      {/* MODALS */}
      {/* Live Canvas Sandbox Modal */}
      {liveCanvasCode && (
        <LiveCanvasModal
          initialCode={liveCanvasCode.code}
          language={liveCanvasCode.language}
          theme={theme}
          onClose={() => setLiveCanvasCode(null)}
        />
      )}

      {/* Gems & Personas Modal */}
      {isGemsModalOpen && (
        <GemsModal
          activeGem={activeGem}
          customGems={customGems}
          theme={theme}
          onSelectGem={(gem) => setActiveGem(gem)}
          onCreateGem={handleCreateGem}
          onDeleteGem={handleDeleteGem}
          onClose={() => setIsGemsModalOpen(false)}
        />
      )}

      {/* Projects / Workspaces Modal */}
      {isProjectsModalOpen && (
        <ProjectsModal
          activeProject={activeProject}
          projects={projects}
          theme={theme}
          onSelectProject={(proj) => setActiveProject(proj)}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onClose={() => setIsProjectsModalOpen(false)}
        />
      )}

      {/* Concept MindMap Visualizer Modal */}
      {mindmapSource && (
        <MindmapModal
          sourceText={mindmapSource}
          theme={theme}
          onClose={() => setMindmapSource(null)}
        />
      )}

      {/* Telegram Bot Modal */}
      <TelegramBotModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        theme={theme}
      />

      {/* Promo Video Showcase Modal (60s Screen Record Mode) */}
      <PromoShowcaseModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        theme={theme}
      />

      {/* Fullscreen Image Preview Modal */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImageModal}
              alt="Katta rasm"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-700/50"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
