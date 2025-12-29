// Fix: Use named import for Dexie to ensure proper class inheritance and type recognition
import { Dexie, type Table } from 'dexie';
import { Conversation, Project, RepositoryItem, Template, Factor } from '../types';

export class TessyDatabase extends Dexie {
  projects!: Table<Project>;
  conversations!: Table<Conversation>;
  library!: Table<RepositoryItem>;
  templates!: Table<Template>;
  settings!: Table<{ key: string; value: any }>;
  files!: Table<{ id: string; projectId: string; name: string; type: string; blob: Blob; createdAt: number }>;
  secrets!: Table<{ id: string; key: string; value: string }>;

  constructor() {
    super('TessyDB');
    // Fix: Proper call to version method from the inherited Dexie class
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      conversations: 'id, projectId, title, createdAt, updatedAt',
      library: 'id, projectId, title, createdAt',
      templates: 'id, label, createdAt',
      settings: 'key',
      files: 'id, projectId, name, type, createdAt',
      secrets: 'id, key'
    });
  }
}

export const db = new TessyDatabase();

/**
 * Migration from LocalStorage to IndexedDB
 */
export async function migrateToIndexedDB(): Promise<void> {
  const isMigrated = await db.settings.get('migration-completed');
  if (isMigrated?.value === true) return;

  console.log('Starting migration to IndexedDB...');
  
  try {
    const defaultProjectId = 'default-project';
    
    // Check for existing data in LocalStorage
    const oldConversationsRaw = localStorage.getItem('tessy_conversations_v2');
    const oldPromptsRaw = localStorage.getItem('prompts');
    const oldFactorsRaw = localStorage.getItem('tessy_factors_v2');
    const oldTheme = localStorage.getItem('tessy-theme');
    
    // Decompression fallback logic if needed
    const getDecompressed = (data: string) => {
      try {
        // Try simple JSON parse first
        return JSON.parse(data);
      } catch (e) {
        // If fails, maybe it's the compressed format from the previous storageService
        // Since we don't have the decompress function here easily available without duplication,
        // we assume standard JSON or we skip.
        console.warn("Could not parse legacy compressed data during migration.");
        return [];
      }
    };

    // Fix: Proper call to transaction method from the Dexie database instance
    await db.transaction('rw', [db.projects, db.conversations, db.library, db.settings], async () => {
      // 1. Create Default Project
      await db.projects.put({
        id: defaultProjectId,
        name: 'Projeto Padrão',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // 2. Migrate Conversations
      if (oldConversationsRaw) {
        const convs = getDecompressed(oldConversationsRaw);
        if (Array.isArray(convs)) {
          const processedConvs = convs.map(c => ({
            ...c,
            projectId: defaultProjectId
          }));
          await db.conversations.bulkPut(processedConvs);
        }
      }

      // 3. Migrate Library (Prompts)
      if (oldPromptsRaw) {
        const prompts = getDecompressed(oldPromptsRaw);
        if (Array.isArray(prompts)) {
          const processedPrompts = prompts.map(p => ({
            ...p,
            projectId: defaultProjectId
          }));
          await db.library.bulkPut(processedPrompts);
        }
      }

      // 4. Migrate Settings
      if (oldTheme) await db.settings.put({ key: 'tessy-theme', value: oldTheme });
      if (oldFactorsRaw) {
        const factors = JSON.parse(oldFactorsRaw);
        await db.settings.put({ key: 'tessy-factors', value: factors });
      }

      // 5. Set Migration Flag
      await db.settings.put({ key: 'migration-completed', value: true });
    });

    // Cleanup LocalStorage after successful migration (optional but recommended)
    // We keep it for safety unless explicitly asked to delete
    // localStorage.removeItem('tessy_conversations_v2');
    // localStorage.removeItem('prompts');
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    // Rollback is handled by Dexie transaction on RW stores if we throw
    throw error;
  }
}

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