import { db, storage, isFirebaseConfigured } from "./config";
import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper for LocalStorage database
const getLocalItems = (userId) => {
  const key = `shopping_list_${userId}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
};

const saveLocalItems = (userId, items) => {
  const key = `shopping_list_${userId}`;
  localStorage.setItem(key, JSON.stringify(items));
};

export const dbService = {
  async fetchItems(userId) {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, `users/${userId}/items`), orderBy("stt", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return getLocalItems(userId).sort((a, b) => a.stt - b.stt);
    }
  },

  async importItems(userId, newItems) {
    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      newItems.forEach(item => {
        const itemRef = doc(collection(db, `users/${userId}/items`));
        batch.set(itemRef, { ...item, createdAt: new Date() });
      });
      await batch.commit();
    } else {
      const current = getLocalItems(userId);
      const merged = [...current, ...newItems.map(it => ({ ...it, id: Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() }))];
      saveLocalItems(userId, merged);
    }
  },

  async updateItem(userId, itemId, updates) {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, `users/${userId}/items`, itemId);
      await updateDoc(docRef, updates);
    } else {
      const current = getLocalItems(userId);
      const updated = current.map(it => it.id === itemId ? { ...it, ...updates } : it);
      saveLocalItems(userId, updated);
    }
  },

  async deleteItem(userId, itemId) {
    if (isFirebaseConfigured && db) {
      const docRef = doc(db, `users/${userId}/items`, itemId);
      await deleteDoc(docRef);
    } else {
      const current = getLocalItems(userId);
      const filtered = current.filter(it => it.id !== itemId);
      saveLocalItems(userId, filtered);
    }
  },

  async uploadImage(userId, itemId, file, field = "imageUrl") {
    if (isFirebaseConfigured && storage) {
      const storageRef = ref(storage, `users/${userId}/images/${itemId}_${field}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      await this.updateItem(userId, itemId, { [field]: downloadUrl });
      return downloadUrl;
    } else {
      // Fallback: Convert file to Base64 and save in LocalStorage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64String = reader.result;
          await this.updateItem(userId, itemId, { [field]: base64String });
          resolve(base64String);
        };
        reader.onerror = error => reject(error);
      });
    }
  }
};
