import { Conversation, Factor, RepositoryItem, Template } from '../types';

/**
 * Generates a standard UUID v4
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const STORAGE_KEYS = {
  CONVERSATIONS: 'tessy_conversations_v2',
  FACTORS: 'tessy_factors_v2',
  LAST_CONV_ID: 'tessy_last_conv_id',
  PROMPTS: 'prompts',
  OLD_HISTORY: 'conversation_history',
  CUSTOM_TEMPLATES: 'tessy_custom_templates'
};

// --- Simple Compression (LZW Implementation) ---

const compress = (uncompressed: string): string => {
  const dictionary: { [key: string]: number } = {};
  for (let i = 0; i < 256; i++) dictionary[String.fromCharCode(i)] = i;

  let w = "";
  const result: number[] = [];
  let dictSize = 256;

  for (let i = 0; i < uncompressed.length; i++) {
    const c = uncompressed.charAt(i);
    const wc = w + c;
    if (dictionary.hasOwnProperty(wc)) {
      w = wc;
    } else {
      result.push(dictionary[w]);
      dictionary[wc] = dictSize++;
      w = c;
    }
  }

  if (w !== "") result.push(dictionary[w]);
  return btoa(result.map(n => String.fromCharCode(n >> 8, n & 0xff)).join(''));
};

const decompress = (compressed: string): string => {
  const binary = atob(compressed);
  const compressedData: number[] = [];
  for (let i = 0; i < binary.length; i += 2) {
    compressedData.push((binary.charCodeAt(i) << 8) | binary.charCodeAt(i + 1));
  }

  const dictionary: { [key: number]: string } = {};
  for (let i = 0; i < 256; i++) dictionary[i] = String.fromCharCode(i);

  let w = String.fromCharCode(compressedData[0]);
  let result = w;
  let dictSize = 256;

  for (let i = 1; i < compressedData.length; i++) {
    const k = compressedData[i];
    let entry = "";
    if (dictionary.hasOwnProperty(k)) {
      entry = dictionary[k];
    } else if (k === dictSize) {
      entry = w + w.charAt(0);
    } else {
      throw new Error("Decompression failure");
    }

    result += entry;
    dictionary[dictSize++] = w + entry.charAt(0);
    w = entry;
  }
  return result;
};

// --- Repository (Legacy/Static Prompts) ---

export const getDocs = (collectionName: string): any[] => {
  try {
    const data = localStorage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving from ${collectionName}:`, error);
    return [];
  }
};

export const addDoc = (collectionName: string, doc: any): void => {
  try {
    const existing = getDocs(collectionName);
    const newDoc = {
      ...doc,
      id: doc.id || generateUUID(),
      timestamp: Date.now()
    };
    const updated = [newDoc, ...existing];
    localStorage.setItem(collectionName, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
  }
};

export const deleteDoc = (collectionName: string, docId: string): void => {
  try {
    const existing = getDocs(collectionName);
    const updated = existing.filter(doc => doc.id !== docId);
    localStorage.setItem(collectionName, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
  }
};

export const getAllTags = (): string[] => {
  const items = getDocs('prompts') as RepositoryItem[];
  const tagSet = new Set<string>();
  items.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
    }
  });
  return Array.from(tagSet).sort();
};

// --- Centralized Persistence (Conversations) ---

export const saveConversation = (conv: Conversation): void => {
  try {
    const conversations = getAllConversations();
    const index = conversations.findIndex(c => c.id === conv.id);
    
    if (index >= 0) {
      conversations[index] = conv;
    } else {
      conversations.unshift(conv);
    }
    
    const compressedData = compress(JSON.stringify(conversations));
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, compressedData);
    localStorage.setItem(STORAGE_KEYS.LAST_CONV_ID, conv.id);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

export const getAllConversations = (): Conversation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!data) return [];
    
    let convs: Conversation[];
    try {
      // Try decompressing
      const decompressed = decompress(data);
      convs = JSON.parse(decompressed);
    } catch (e) {
      // Fallback to legacy uncompressed format
      convs = JSON.parse(data);
    }
    
    return convs;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

export const loadConversation = (conversationId: string): Conversation | null => {
  const convs = getAllConversations();
  return convs.find(c => c.id === conversationId) || null;
};

export const loadLastConversation = (): Conversation | null => {
  const lastId = localStorage.getItem(STORAGE_KEYS.LAST_CONV_ID);
  if (!lastId) return null;
  return loadConversation(lastId);
};

export const deleteConversation = (id: string): void => {
  const convs = getAllConversations();
  const updated = convs.filter(c => c.id !== id);
  const compressedData = compress(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, compressedData);
  
  if (localStorage.getItem(STORAGE_KEYS.LAST_CONV_ID) === id) {
    localStorage.removeItem(STORAGE_KEYS.LAST_CONV_ID);
  }
};

// --- Cleanup Logic ---

export const cleanOldConversations = (): number => {
  try {
    const conversations = getAllConversations();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const initialCount = conversations.length;
    const filtered = conversations.filter(c => (now - c.updatedAt) < THIRTY_DAYS_MS);
    const removedCount = initialCount - filtered.length;
    
    if (removedCount > 0) {
      const compressedData = compress(JSON.stringify(filtered));
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, compressedData);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning old conversations:', error);
    return 0;
  }
};

// --- Factors Persistence ---

export const saveFactors = (factors: Factor[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FACTORS, JSON.stringify(factors));
  } catch (error) {
    console.error('Error saving factors:', error);
  }
};

export const loadFactors = (): Factor[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FACTORS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading factors:', error);
    return null;
  }
};

// --- Custom Templates Persistence ---

export const getCustomTemplates = (): Template[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting custom templates:', error);
    return [];
  }
};

export const saveCustomTemplate = (template: Template): void => {
  try {
    const templates = getCustomTemplates();
    const newTemplate = {
      ...template,
      id: template.id || generateUUID(),
      isCustom: true,
      createdAt: template.createdAt || Date.now(),
      updatedAt: Date.now()
    };
    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving custom template:', error);
  }
};

export const updateCustomTemplate = (id: string, updatedTemplate: Template): void => {
  try {
    const templates = getCustomTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = {
        ...updatedTemplate,
        id,
        isCustom: true,
        updatedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
    }
  } catch (error) {
    console.error('Error updating custom template:', error);
  }
};

export const deleteCustomTemplate = (id: string): void => {
  try {
    const templates = getCustomTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting custom template:', error);
  }
};