
export const addDoc = (collectionName: string, doc: any): void => {
  try {
    const existing = getDocs(collectionName);
    const updated = [...existing, doc];
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
