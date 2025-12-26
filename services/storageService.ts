
export const addDoc = (collectionName: string, doc: any): void => {
  try {
    const existing = getDocs(collectionName);
    const newDoc = {
      ...doc,
      id: doc.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    const updated = [newDoc, ...existing];
    localStorage.setItem(collectionName, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
  }
};

export const getDocs = (collectionName: string): any[] => {
  try {
    const data = localStorage.getItem(collectionName);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error retrieving from ${collectionName}:`, error);
    return [];
  }
};

export const updateDoc = (collectionName: string, docId: string, updates: any): void => {
  try {
    const existing = getDocs(collectionName);
    const updated = existing.map(doc => 
      doc.id === docId ? { ...doc, ...updates } : doc
    );
    localStorage.setItem(collectionName, JSON.stringify(updated));
  } catch (error) {
    console.error(`Error updating in ${collectionName}:`, error);
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
