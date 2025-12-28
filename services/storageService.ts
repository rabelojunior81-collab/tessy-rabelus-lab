
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
  PROMPTS: 'prompts', // Compatibility with RepositoryBrowser
  OLD_HISTORY: 'conversation_history', // For migration
  CUSTOM_TEMPLATES: 'tessy_custom_templates'
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

// --- New Centralized Persistence (Conversations) ---

export const saveConversation = (conv: Conversation): void => {
  try {
    const conversations = getAllConversations();
    const index = conversations.findIndex(c => c.id === conv.id);
    
    if (index >= 0) {
      conversations[index] = conv;
    } else {
      conversations.unshift(conv);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    localStorage.setItem(STORAGE_KEYS.LAST_CONV_ID, conv.id);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

export const getAllConversations = (): Conversation[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const convs: Conversation[] = data ? JSON.parse(data) : [];
    
    // Check for migration from Day 4 (Old history was a flat array of turns in some implementations)
    const oldData = localStorage.getItem(STORAGE_KEYS.OLD_HISTORY);
    if (oldData && convs.length === 0) {
      const turns = JSON.parse(oldData);
      if (Array.isArray(turns) && turns.length > 0) {
        const migratedConv: Conversation = {
          id: generateUUID(),
          title: "Conversa Migrada",
          turns: turns.map(t => ({
            ...t,
            id: t.id || generateUUID(),
            timestamp: t.timestamp || Date.now()
          })),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        localStorage.removeItem(STORAGE_KEYS.OLD_HISTORY);
        saveConversation(migratedConv);
        return [migratedConv];
      }
    }
    
    return convs;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

export const getConversationById = (id: string): Conversation | null => {
  const convs = getAllConversations();
  return convs.find(c => c.id === id) || null;
};

export const loadLastConversation = (): Conversation | null => {
  const lastId = localStorage.getItem(STORAGE_KEYS.LAST_CONV_ID);
  if (!lastId) return null;
  return getConversationById(lastId);
};

export const deleteConversation = (id: string): void => {
  const convs = getAllConversations();
  const updated = convs.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updated));
  
  if (localStorage.getItem(STORAGE_KEYS.LAST_CONV_ID) === id) {
    localStorage.removeItem(STORAGE_KEYS.LAST_CONV_ID);
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
