import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "./firebase";

export interface FileAttachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string; // ISO string format for safe serialization
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string; // ISO string format
  userId: string;
}

export interface ProjectFile {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  customInstructions: string;
  files?: ProjectFile[];
  createdAt: string;
  userId?: string;
  color?: string;
}

export interface CustomGem {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  color: string;
  createdAt: string;
  userId?: string;
  isBuiltIn?: boolean;
}

// Save or update conversation in Firestore
export const saveConversation = async (conversation: Conversation) => {
  try {
    const docRef = doc(db, "conversations", conversation.id);
    await setDoc(docRef, {
      ...conversation,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firestore save error: ", error);
  }
};

// Load all conversations for a user, sorted by createdAt
export const loadConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const q = query(collection(db, "conversations"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Conversation;
      conversations.push({
        id: data.id,
        title: data.title || "Yangi suhbat",
        messages: data.messages || [],
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId
      });
    });

    // Sort by createdAt desc in JS to avoid index requirement
    return conversations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Firestore load error: ", error);
    return [];
  }
};

// Delete conversation from Firestore
export const deleteConversationDoc = async (conversationId: string) => {
  try {
    const docRef = doc(db, "conversations", conversationId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore delete error: ", error);
  }
};

// Projects Firestore operations
export const saveProject = async (project: Project) => {
  try {
    const docRef = doc(db, "projects", project.id);
    await setDoc(docRef, {
      ...project,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firestore save project error: ", error);
  }
};

export const loadProjects = async (userId: string): Promise<Project[]> => {
  try {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push(doc.data() as Project);
    });
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Firestore load projects error: ", error);
    return [];
  }
};

export const deleteProjectDoc = async (projectId: string) => {
  try {
    const docRef = doc(db, "projects", projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore delete project error: ", error);
  }
};

// Custom Gems Firestore operations
export const saveCustomGem = async (gem: CustomGem) => {
  try {
    const docRef = doc(db, "customGems", gem.id);
    await setDoc(docRef, {
      ...gem,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firestore save custom gem error: ", error);
  }
};

export const loadCustomGems = async (userId: string): Promise<CustomGem[]> => {
  try {
    const q = query(collection(db, "customGems"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const gems: CustomGem[] = [];
    querySnapshot.forEach((doc) => {
      gems.push(doc.data() as CustomGem);
    });
    return gems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Firestore load custom gems error: ", error);
    return [];
  }
};

export const deleteCustomGemDoc = async (gemId: string) => {
  try {
    const docRef = doc(db, "customGems", gemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Firestore delete custom gem error: ", error);
  }
};

// Sync local storage conversations to Firestore on login
export const syncLocalConversationsToCloud = async (userId: string, localConversations: any[]) => {
  try {
    for (const conv of localConversations) {
      // Create copy with userId and standardized timestamps
      const cloudConv: Conversation = {
        id: conv.id,
        title: conv.title,
        userId: userId,
        createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : new Date(conv.createdAt).toISOString(),
        messages: conv.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.text,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString()
        }))
      };
      await saveConversation(cloudConv);
    }
  } catch (error) {
    console.error("Error syncing local conversations: ", error);
  }
};
